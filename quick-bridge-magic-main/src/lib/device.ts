export type DeviceKind = "phone" | "tablet" | "computer";

export function detectDeviceKind(): DeviceKind {
  if (typeof navigator === "undefined") return "computer";
  const ua = navigator.userAgent || "";
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } }).userAgentData;

  if (uaData?.mobile) return "phone";

  // iPadOS reports as Mac with touch - distinguish via touch points.
  const isIPad =
    /iPad/i.test(ua) ||
    (/(Macintosh)/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1);
  if (isIPad) return "tablet";

  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? "phone" : "tablet";
  }
  if (/iPhone|iPod/i.test(ua)) return "phone";
  if (/Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Mobile|Opera Mini|IEMobile|Windows Phone|webOS|BlackBerry/i.test(ua)) return "phone";

  return "computer";
}

/**
 * Returns the safe upper bound for in-memory file buffering on this device.
 * The receiver broadcasts this value via presence so the sender can enforce
 * a per-device cap rather than a one-size-fits-all limit.
 *
 * iOS Safari is terminated by the OS around 300-500 MB depending on device
 * model and available RAM; 300 MB is conservative but avoids OOM crashes.
 * Android is more forgiving at around 500 MB. Desktop browsers comfortably
 * handle 2 GB or more.
 */
export function detectSafeMemoryBytes(): number {
  if (typeof navigator === "undefined") return 2 * 1024 * 1024 * 1024;
  const ua = navigator.userAgent || "";

  // iOS: iPhone, iPod, and iPadOS (iPadOS reports as Macintosh with touch points)
  const isIOS =
    /iPhone|iPod/i.test(ua) ||
    /iPad/i.test(ua) ||
    (/(Macintosh)/i.test(ua) &&
      typeof navigator.maxTouchPoints === "number" &&
      navigator.maxTouchPoints > 1);
  if (isIOS) return 300 * 1024 * 1024; // 300 MB

  // Android (phone or tablet)
  if (/Android/i.test(ua)) return 500 * 1024 * 1024; // 500 MB

  // Desktop or unknown platform
  return 2 * 1024 * 1024 * 1024; // 2 GB
}

export function deviceLabel(kind: DeviceKind, perspective: "self" | "peer" = "self"): string {
  const prefix = perspective === "self" ? "Your " : "Their ";
  switch (kind) {
    case "phone":
      return `${prefix}Phone`;
    case "tablet":
      return `${prefix}Tablet`;
    case "computer":
    default:
      return `${prefix}Computer`;
  }
}
