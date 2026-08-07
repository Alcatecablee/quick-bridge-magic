type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  const g = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof g !== "function") return;
  g(...args);
}

export function trackPeerConnected(quality: "direct" | "relay" | "unknown"): void {
  gtag("event", "peer_connected", { connection_quality: quality });
}

export function trackFileSent(params: { count: number; totalBytes: number }): void {
  gtag("event", "file_sent", {
    file_count: params.count,
    total_bytes: params.totalBytes,
  });
}

export function trackFileReceived(params: { count: number; totalBytes: number }): void {
  gtag("event", "file_received", {
    file_count: params.count,
    total_bytes: params.totalBytes,
  });
}

export function trackQrScanned(): void {
  gtag("event", "qr_scanned");
}

// Fired when the user taps "Trust this device" and the IDB write succeeds.
// newCount is the total number of trusted nodes stored in this browser after
// the write, used to measure the fraction of sessions that have reached >= 2
// trusted environments -- the closest proxy for "average trusted environments
// per user" that the serverless, account-free architecture allows.
export function trackTrustAdded(newCount: number): void {
  gtag("event", "trusted_device_added", { trusted_device_count: newCount });
}

// Phase 3 Continuity. Emitted only on terminal statuses (completed or failure).
// Never emitted on intermediate states (received, accepted).
// intent_type: the ContinuityIntentType string.
// ack_status: the terminal IntentStatus string.
export function trackContinuityAction(
  intentType: string,
  ackStatus: string,
): void {
  gtag("event", "continuity_action_dispatched", {
    intent_type: intentType,
    ack_status: ackStatus,
  });
}
