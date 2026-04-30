const PREFIX = "qb:";

export const StorageKeys = {
  deviceName: `${PREFIX}deviceName`,
  hostSessionId: `${PREFIX}hostSessionId`,
  autoClipboard: (sessionId: string) => `${PREFIX}autoClip:${sessionId}`,
  history: (sessionId: string) => `${PREFIX}history:${sessionId}`,
  activeSession: `${PREFIX}activeSession`,
  contactDraft: `${PREFIX}contactDraft`,
} as const;

export type ActiveSession = {
  id: string;
  role: "host" | "guest";
  ts: number;
};

export function readActiveSession(): ActiveSession | null {
  const raw = readJSON<ActiveSession | null>(StorageKeys.activeSession, null);
  if (!raw || typeof raw.id !== "string" || (raw.role !== "host" && raw.role !== "guest")) {
    return null;
  }
  return raw;
}

export function writeActiveSession(s: ActiveSession): void {
  writeJSON(StorageKeys.activeSession, s);
}

export function clearActiveSession(): void {
  removeKey(StorageKeys.activeSession);
}

function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

export function readString(key: string): string | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    return w.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(key, value);
  } catch {}
}

export function removeKey(key: string): void {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(key);
  } catch {}
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = readString(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    writeString(key, JSON.stringify(value));
  } catch {}
}
