export function generateSessionId(): string {
  // 22 chars of base62-ish randomness via crypto
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 22);
}

export function formatBytes(bytes: number): string {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) return "Unknown";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  // Strip the trailing ".0" for whole-number values so labels read "2 GB"
  // rather than "2.0 GB". toFixed(1) always emits a decimal; parseFloat()
  // removes it when the fractional part is exactly zero.
  return `${parseFloat(value.toFixed(1))} ${sizes[i]}`;
}