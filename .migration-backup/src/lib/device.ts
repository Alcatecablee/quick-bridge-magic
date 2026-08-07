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
