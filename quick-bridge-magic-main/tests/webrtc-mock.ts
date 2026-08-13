import { vi } from 'vitest';

export class MockDataChannel extends EventTarget {
  label: string;
  readyState: string = 'open';
  binaryType: string = 'blob';
  bufferedAmount: number = 0;
  bufferedAmountLowThreshold: number = 0;

  constructor(label: string) {
    super();
    this.label = label;
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 'closed';
    this.dispatchEvent(new Event('close'));
  });

  // Helper to simulate incoming messages
  simulateMessage(data: string | ArrayBuffer) {
    const event = new MessageEvent('message', { data });
    this.dispatchEvent(event);
    if (this.onmessage) this.onmessage(event as any);
  }

  onmessage: ((ev: MessageEvent) => any) | null = null;
  onopen: ((ev: Event) => any) | null = null;
  onclose: ((ev: Event) => any) | null = null;
  onbufferedamountlow: ((ev: Event) => any) | null = null;
}

export class MockRTCPeerConnection extends EventTarget {
  connectionState = 'new';
  iceConnectionState = 'new';
  signalingState = 'stable';
  localDescription: any = null;
  remoteDescription: any = null;

  channels: MockDataChannel[] = [];

  constructor(config: any) {
    super();
  }

  createDataChannel(label: string) {
    const dc = new MockDataChannel(label);
    this.channels.push(dc);
    return dc;
  }

  async createOffer() { return { type: 'offer', sdp: 'mock-offer' }; }
  async createAnswer() { return { type: 'answer', sdp: 'mock-answer' }; }
  async setLocalDescription(desc: any) { this.localDescription = desc; }
  async setRemoteDescription(desc: any) { this.remoteDescription = desc; }
  async addIceCandidate() {}
  
  close = vi.fn(() => {
    this.connectionState = 'closed';
    this.dispatchEvent(new Event('connectionstatechange'));
  });

  // Helpers to simulate state changes
  simulateConnectionState(state: string) {
    this.connectionState = state;
    this.dispatchEvent(new Event('connectionstatechange'));
  }

  simulateDataChannel(label: string): MockDataChannel {
    const dc = new MockDataChannel(label);
    this.channels.push(dc);
    const event = new Event('datachannel') as any;
    event.channel = dc;
    this.dispatchEvent(event);
    if (this.ondatachannel) this.ondatachannel(event);
    return dc;
  }

  ondatachannel: ((ev: any) => any) | null = null;
  onconnectionstatechange: ((ev: Event) => any) | null = null;
  onicecandidate: ((ev: any) => any) | null = null;
}

// Attach to global window
Object.defineProperty(window, 'RTCPeerConnection', {
  writable: true,
  value: MockRTCPeerConnection,
});
