import { vi } from 'vitest';

export const mockSendSignal = vi.fn();
export const mockOnMessage = new Set<(msg: any) => void>();

export function useBridgeSignal() {
  return {
    send: mockSendSignal,
    onMessage: (cb: (msg: any) => void) => {
      mockOnMessage.add(cb);
      return () => mockOnMessage.delete(cb);
    }
  };
}
