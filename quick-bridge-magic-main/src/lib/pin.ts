// Deterministic 6-digit PIN derived from a session id. Both peers can compute
// the same channel name (`qb:pin:<pin>`); the host listens on it and replies
// to lookups with the real session id, which the guest then navigates to.
//
// Collision space is 1,000,000 - fine for the brief lifetime of a session.

export async function pinFromSessionId(sessionId: string): Promise<string> {
  const data = new TextEncoder().encode(`pin:${sessionId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const view = new DataView(digest);
  // Take 4 bytes, modulo 1_000_000, then zero-pad to 6 digits.
  const n = view.getUint32(0, false) % 1_000_000;
  return String(n).padStart(6, "0");
}

export function formatPin(pin: string): string {
  if (pin.length !== 6) return pin;
  return `${pin.slice(0, 3)} ${pin.slice(3)}`;
}

export function normalizePin(input: string): string {
  return input.replace(/\D+/g, "").slice(0, 6);
}

export function pinChannelName(pin: string): string {
  return `qb:pin:${pin}`;
}
