import { renderHook, act } from '@testing-library/react';
import { useWebRTC, DEFAULT_CONFIG } from '../src/hooks/use-webrtc';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSendSignal, mockOnMessage } from './bridge-signal-mock';
import { MockRTCPeerConnection, MockDataChannel } from './webrtc-mock';

vi.mock('@/lib/bridge-signal', () => ({
  useBridgeSignal: () => ({
    send: mockSendSignal,
    onMessage: (cb: any) => {
      mockOnMessage.add(cb);
      return () => mockOnMessage.delete(cb);
    }
  })
}));

const { mockChannelEventHandlers, mockPresenceState } = vi.hoisted(() => ({
  mockChannelEventHandlers: new Map<string, Function>(),
  mockPresenceState: {} as any
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => {
      const ch: any = {
        on: vi.fn().mockImplementation((type, filter, cb) => {
          console.log(`MOCK ON CALLED: type=${type}, event=${filter.event}`);
          mockChannelEventHandlers.set(`${type}:${filter.event}`, cb);
          return ch;
        }),
        subscribe: vi.fn().mockImplementation((cb: any) => { if (cb) cb('SUBSCRIBED'); return ch; }),
        unsubscribe: vi.fn(() => ch),
        send: vi.fn(),
        presenceState: vi.fn(() => mockPresenceState.current),
        track: vi.fn(() => ch),
        untrack: vi.fn(() => ch),
      };
      return ch;
    }),
    removeChannel: vi.fn(),
    getChannels: vi.fn(() => []),
  }
}));

const TEST_CONFIG = {
  ...DEFAULT_CONFIG,
  recoveryWindowMs: 5000,
  resumeAckTimeoutMs: 1000,
  diskWriteBatchSize: 1024,
};

describe('useWebRTC Reliability Suite (Phase B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnMessage.clear();
    // Re-stub crypto
    if (!global.crypto) global.crypto = {} as any;
    global.crypto.randomUUID = () => Math.random().toString();
  });

  describe('Cancellation Lifecycle', () => {
    it('Test 4: Sender cancellation (mid-transfer)', async () => {
      let pc: MockRTCPeerConnection | undefined;
      const OriginalRTCPeerConnection = global.RTCPeerConnection;
      global.RTCPeerConnection = class extends MockRTCPeerConnection {
        constructor(config: any) {
          super(config);
          pc = this;
        }
      } as any;

      const { result } = renderHook(() =>
        useWebRTC('session-id', true, 'Host', false, undefined, undefined, undefined, undefined, undefined, undefined, TEST_CONFIG)
      );

      // Simulate a guest joining so Host creates the peer connection
      await act(async () => {
        mockPresenceState.current = { guest: [{ device: 'windows', name: 'Guest PC' }] };
        console.log('Registered handlers:', Array.from(mockChannelEventHandlers.keys()));
        const syncHandler = mockChannelEventHandlers.get('presence:sync');
        if (syncHandler) {
          console.log('Calling syncHandler!');
          syncHandler();
        } else {
          console.log('No sync handler found!');
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Wait for PC to be created
      expect(pc).toBeDefined();
      const dc = pc!.channels[0];
      expect(dc).toBeDefined();

      // Simulate connection open
      act(() => {
        pc!.simulateConnectionState('connected');
        dc.readyState = 'open';
        if (dc.onopen) dc.onopen(new Event('open'));
      });
      
      act(() => {
        result.current.sendFile(new File(['hello'], 'test.txt', { type: 'text/plain' }));
      });

      const outgoing = result.current.outgoingFiles;
      expect(outgoing.length).toBe(1);
      const fileId = outgoing[0].id;

      // Sender cancels
      act(() => {
        result.current.cancelOutgoing(fileId);
      });

      // Verify it transitions to 'cancelled' and doesn't get deleted
      const updatedOutgoing = result.current.outgoingFiles;
      expect(updatedOutgoing.length).toBe(1);
      expect(updatedOutgoing[0].state).toBe('cancelled');
      expect(updatedOutgoing[0].cancelledBy).toBe('sender');
    });

    it('Test 5: Receiver cancellation (mid-transfer)', async () => {
      const { result } = renderHook(() =>
        useWebRTC('session-id', false, 'Guest', false, undefined, undefined, undefined, undefined, undefined, undefined, TEST_CONFIG)
      );

      // We need a file in incomingFiles. Since it's only populated via data channel messages, 
      // we'll need to trigger the internal data channel message handler, or simulate the connection.
    });
  });
});
