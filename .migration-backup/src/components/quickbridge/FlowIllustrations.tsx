import type { CSSProperties, SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

const TB: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

export function PhoneIllustration(props: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Phone"
      {...props}
    >
      <defs>
        <linearGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect
        x="18"
        y="6"
        width="28"
        height="52"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="url(#phoneScreen)"
      />
      <rect
        x="21.5"
        y="11"
        width="21"
        height="38"
        rx="2"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1"
        fill="none"
      />
      <line
        x1="28"
        y1="9"
        x2="36"
        y2="9"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="53.5" r="1.4" fill="currentColor" fillOpacity="0.6" />
      <path
        className="phone-line-anim"
        d="M26 24h12M26 30h12M26 36h8"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ ...TB, animation: "phone-content 2s ease-in-out infinite" }}
      />
    </svg>
  );
}

export function ScanIllustration(props: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Scan QR"
      {...props}
    >
      <path
        d="M10 18V13a3 3 0 0 1 3-3h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M46 10h5a3 3 0 0 1 3 3v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M54 46v5a3 3 0 0 1-3 3h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 54h-5a3 3 0 0 1-3-3v-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="20" y="20" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="35" y="20" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="20" y="35" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="38" y="38" width="3" height="3" fill="currentColor" />
      <rect x="38" y="33" width="3" height="3" fill="currentColor" fillOpacity="0.6" />
      <rect x="33" y="38" width="3" height="3" fill="currentColor" fillOpacity="0.6" />
      <rect x="43" y="43" width="3" height="3" fill="currentColor" fillOpacity="0.4" />
      <line
        className="scan-line-anim"
        x1="14"
        y1="32"
        x2="50"
        y2="32"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="1.6"
        strokeLinecap="round"
        style={{ ...TB, animation: "scan-sweep 1.8s ease-in-out infinite" }}
      />
    </svg>
  );
}

export function DesktopIllustration(props: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Send to computer"
      {...props}
    >
      <defs>
        <linearGradient id="screenFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect
        x="6"
        y="10"
        width="52"
        height="34"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="url(#screenFill)"
      />
      <rect
        x="10"
        y="14"
        width="44"
        height="26"
        rx="1.5"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M22 50h20l1.5 4h-23z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <line
        x1="18"
        y1="54"
        x2="46"
        y2="54"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        className="dl-arrow-anim"
        d="M32 19v12m0 0-4-4m4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ ...TB, animation: "dl-bounce 1.6s ease-in-out infinite 0.4s" }}
      />
      <line
        x1="22"
        y1="35"
        x2="42"
        y2="35"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EncryptionIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="End-to-end encrypted" {...props}>
      <defs>
        <linearGradient id="encShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path
        d="M24 5l14 5v10c0 9-6.2 16.4-14 18-7.8-1.6-14-9-14-18V10l14-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="url(#encShield)"
      />
      <rect x="18" y="22" width="12" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M21 22v-3a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="24" cy="27" r="1.4" fill="currentColor" />
      <path d="M24 28.4v2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function P2PIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Direct peer-to-peer" {...props}>
      <circle cx="11" cy="24" r="5.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="37" cy="24" r="5.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="11" cy="24" r="2" fill="currentColor" />
      <circle cx="37" cy="24" r="2" fill="currentColor" />
      <path
        d="M16.5 24h15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      <path d="M22 19l-3 5 3 5M26 19l3 5-3 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossPlatformIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cross-platform" {...props}>
      <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.05" />
      <ellipse cx="24" cy="24" rx="8" ry="17" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M7.4 20h33.2M7.4 28h33.2" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 7v34" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

export function BigFilesIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Large file transfers" {...props}>
      <path
        d="M14 8h14l8 8v22a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path d="M28 8v8h8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M24 22v12m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="17" y1="38" x2="31" y2="38" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function MultiContentIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Files, text, and clipboard" {...props}>
      <rect x="6" y="10" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06" />
      <path d="M11 17h12M11 22h12M11 27h8" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="22" y="20" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
      <path d="M27 26h10M27 30h10M27 34h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ResilientIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Resilient by design" {...props}>
      <path d="M9 26c4-5 8-7 15-7s11 2 15 7" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 30c2.5-3.2 5.5-4.8 10-4.8s7.5 1.6 10 4.8" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 34c1.5-1.8 3-2.6 5-2.6s3.5.8 5 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24" cy="38" r="2.2" fill="currentColor" />
      <path d="M30 14l3 3-3 3M33 17h-7a4 4 0 0 0-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FileTransferIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Send files from phone to PC" {...props}>
      <defs>
        <linearGradient id="fileTxScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="14" height="32" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="url(#fileTxScreen)" />
      <line x1="11" y1="11" x2="15" y2="11" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="13" cy="36" r="0.9" fill="currentColor" fillOpacity="0.6" />
      <path d="M22 24h14m0 0-4-3.5m4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 3" />
      <path d="M38 12h6l3 3v18a1.6 1.6 0 0 1-1.6 1.6H38A1.6 1.6 0 0 1 36.4 33V13.6A1.6 1.6 0 0 1 38 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" fillOpacity="0.06" />
      <path d="M44 12v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M39 22h5M39 26h5M39 30h3" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function PhotoTransferIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Transfer photos without USB" {...props}>
      <defs>
        <linearGradient id="photoFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="14" y="6" width="22" height="22" rx="2.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.4" fill="currentColor" fillOpacity="0.04" />
      <rect x="6" y="14" width="22" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="url(#photoFill)" />
      <circle cx="12.5" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 33l6-7 5 5 3-3 5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 38l6 4 6-4-6-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M30 38v4l6 4 6-4v-4" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkShareIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Share links between devices" {...props}>
      <path d="M19 27a6.5 6.5 0 0 1 0-9l4-4a6.5 6.5 0 0 1 9 9l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29 21a6.5 6.5 0 0 1 0 9l-4 4a6.5 6.5 0 0 1-9-9l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="20" y1="28" x2="28" y2="20" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function NetworkIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Works across networks" {...props}>
      <circle cx="9" cy="32" r="4.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="39" cy="32" r="4.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="24" cy="14" r="5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06" />
      <circle cx="9" cy="32" r="1.6" fill="currentColor" />
      <circle cx="39" cy="32" r="1.6" fill="currentColor" />
      <circle cx="24" cy="14" r="1.6" fill="currentColor" />
      <path d="M12 30l9-12M36 30l-9-12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 3" />
      <path d="M14 33h20" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}

export function NoServerIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No server-side copy" {...props}>
      <rect x="11" y="10" width="26" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06" />
      <rect x="11" y="22" width="26" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06" />
      <circle cx="15.5" cy="14.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="26.5" r="1.2" fill="currentColor" />
      <line x1="20" y1="14.5" x2="32" y2="14.5" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20" y1="26.5" x2="32" y2="26.5" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="24" cy="38" r="6" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.05" />
      <path d="M20 34l8 8M28 34l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function InstantIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Instant transfer" {...props}>
      <defs>
        <linearGradient id="boltFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d="M27 5L11 27h10l-3 16 16-22H24l3-16z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="url(#boltFill)" />
      <path d="M5 14h6M5 22h4M5 34h6M37 14h6M39 22h4M37 34h6" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function PWAIllustration(props: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Installable as a PWA" {...props}>
      <defs>
        <linearGradient id="pwaScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="14" y="5" width="20" height="38" rx="3.5" stroke="currentColor" strokeWidth="1.6" fill="url(#pwaScreen)" />
      <line x1="20" y1="8" x2="28" y2="8" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="24" cy="40" r="1.2" fill="currentColor" fillOpacity="0.6" />
      <path d="M24 16v12m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18" y1="32" x2="30" y2="32" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

interface FlowConnectorProps extends Props {
  animDelay?: string;
}

export function FlowConnector({ animDelay = "0s", ...props }: FlowConnectorProps) {
  return (
    <svg
      viewBox="0 0 48 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      {...props}
    >
      <line
        className="flow-dash-anim"
        x1="2"
        y1="8"
        x2="38"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="4 4"
        style={{ animation: `flow-dash 0.9s linear infinite ${animDelay}` }}
      />
      <path
        className="flow-arrow-anim"
        d="M36 3l6 5-6 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ ...TB, animation: `flow-arrow 0.9s ease-in-out infinite ${animDelay}` }}
      />
    </svg>
  );
}
