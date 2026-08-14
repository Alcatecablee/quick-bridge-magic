import type { ContinuityIntentType } from "./continuity-types";

export interface PendingIntent {
  type: ContinuityIntentType;
  payload: unknown;
  targetNodeId: string;
  targetNickname: string;
  transientData?: Record<string, unknown>; // e.g., { file: File }
}

const memoryStore = new Map<string, PendingIntent>();

export const pendingIntentStore = {
  set(sessionId: string, intent: PendingIntent) {
    memoryStore.set(sessionId, intent);
  },
  get(sessionId: string): PendingIntent | undefined {
    return memoryStore.get(sessionId);
  },
  clear(sessionId: string) {
    memoryStore.delete(sessionId);
  }
};
