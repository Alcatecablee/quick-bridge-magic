import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "stroke" | "fill"> {
  size?: number | string;
  strokeWidth?: number | string;
}

function Svg({
  size = 24,
  strokeWidth = 1.75,
  className,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12h14" />
    <path d="m12 5.5 6.5 6.5-6.5 6.5" />
  </Svg>
);

export const ArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 12h-14" />
    <path d="m12 5.5-6.5 6.5 6.5 6.5" />
  </Svg>
);

export const ArrowLeftRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 7.5h13.5" />
    <path d="m13.5 4 3.5 3.5-3.5 3.5" />
    <path d="M20.5 16.5H7" />
    <path d="m10.5 13-3.5 3.5 3.5 3.5" />
  </Svg>
);

export const X = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Svg>
);
export const XIcon = X;

export const Eye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const HardDrive = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 13.5h18" />
    <path d="m3.5 13.5 2.8-7h11.4l2.8 7v5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18.5Z" />
    <circle cx="7.5" cy="17" r=".75" fill="currentColor" stroke="none" />
    <path d="M11.5 17h6" />
  </Svg>
);

export const Lock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" />
    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
  </Svg>
);

export const Mail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const RefreshCw = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
    <path d="M20.5 4v5h-5" />
  </Svg>
);

export const Server = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="19" height="6.5" rx="1.5" />
    <rect x="2.5" y="14" width="19" height="6.5" rx="1.5" />
    <circle cx="6" cy="6.75" r=".75" fill="currentColor" stroke="none" />
    <circle cx="6" cy="17.25" r=".75" fill="currentColor" stroke="none" />
    <path d="M9.5 6.75h2" />
    <path d="M9.5 17.25h2" />
  </Svg>
);

export const ShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.5 4 5.5v6c0 4.5 3.4 8.4 8 9.5 4.6-1.1 8-5 8-9.5v-6Z" />
    <path d="m9 12 2.25 2.25L15.5 10" />
  </Svg>
);

export const KeyRound = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="15.5" cy="8.5" r="4.25" />
    <path d="M12.5 11.5 4 20v-1.5L4 17l1.5-1.5L7 17l1.5-1.5" />
  </Svg>
);

export const Loader2 = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Svg>
);

export const Camera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7.5h3.5l1.5-2.5h8l1.5 2.5H21v11.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const CheckIcon = Check;

export const Copy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M5.5 15.5h-.5A1.5 1.5 0 0 1 3.5 14V5A1.5 1.5 0 0 1 5 3.5h9a1.5 1.5 0 0 1 1.5 1.5v.5" />
  </Svg>
);

export const Download = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 19.5h16" />
  </Svg>
);

export const Globe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.7 3.6 2.7 14.4 0 18" />
    <path d="M12 3c-2.7 3.6-2.7 14.4 0 18" />
  </Svg>
);

export const Link2 = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 17H7a5 5 0 0 1 0-10h2" />
    <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
    <path d="M8 12h8" />
  </Svg>
);

export const MessageSquare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 14a1.5 1.5 0 0 1-1.5 1.5H8L4 19.5V5A1.5 1.5 0 0 1 5.5 3.5h13.5A1.5 1.5 0 0 1 20.5 5Z" />
  </Svg>
);

export const Share2 = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.25 10.75 7.5-4.5" />
    <path d="m8.25 13.25 7.5 4.5" />
  </Svg>
);

export const Wifi = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 9.5a14 14 0 0 1 20 0" />
    <path d="M5 12.75a9.5 9.5 0 0 1 14 0" />
    <path d="M8.25 16a4.5 4.5 0 0 1 7.5 0" />
    <circle cx="12" cy="19.5" r=".9" fill="currentColor" stroke="none" />
  </Svg>
);

export const Zap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 2.5 4 13.5h6.5L11 21.5l9-11h-6.5Z" />
  </Svg>
);

export const CheckCircle2 = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Svg>
);
export const CheckCircle = CheckCircle2;

export const HelpCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.25a2.5 2.5 0 0 1 5 0c0 1.75-2.5 1.75-2.5 3.5" />
    <circle cx="12" cy="16.5" r=".9" fill="currentColor" stroke="none" />
  </Svg>
);

export const Inbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21.5 12.5h-5l-1.5 2.5h-6L7.5 12.5h-5" />
    <path d="M5.5 4.5h13l3 8v6.5a1.5 1.5 0 0 1-1.5 1.5h-16a1.5 1.5 0 0 1-1.5-1.5v-6.5Z" />
  </Svg>
);

export const Send = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21.5 2.5 11 13" />
    <path d="m21.5 2.5-7 19-3.5-8.5L2.5 9.5Z" />
  </Svg>
);

export const Minus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const Home = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 11.5 9-8 9 8" />
    <path d="M5 10v9.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
  </Svg>
);

export const QrCode = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="6.5" height="6.5" rx="1" />
    <rect x="14.5" y="3" width="6.5" height="6.5" rx="1" />
    <rect x="3" y="14.5" width="6.5" height="6.5" rx="1" />
    <path d="M14.5 14.5h2.5v2.5" />
    <path d="M21 14.5v2.5" />
    <path d="M14.5 19.5h2.5" />
    <path d="M19.5 19.5v1.5h1.5" />
  </Svg>
);

export const Smartphone = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
    <path d="M11 18.5h2" />
  </Svg>
);

export const FileText = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 2.5H6A1.5 1.5 0 0 0 4.5 4v16A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V8Z" />
    <path d="M14 2.5V8h5.5" />
    <path d="M8.5 13h7" />
    <path d="M8.5 16.5h5" />
  </Svg>
);

export const InfinityIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 12c0-2.2 1.5-3.5 3.25-3.5 2.5 0 3.75 7 6.5 7 1.75 0 3.25-1.3 3.25-3.5s-1.5-3.5-3.25-3.5c-2.75 0-4 7-6.5 7-1.75 0-3.25-1.3-3.25-3.5Z" />
  </Svg>
);
export { InfinityIcon as Infinity };

export const Radio = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <path d="M9 9a4.25 4.25 0 0 0 0 6" />
    <path d="M15 9a4.25 4.25 0 0 1 0 6" />
    <path d="M6.5 6.5a8 8 0 0 0 0 11" />
    <path d="M17.5 6.5a8 8 0 0 1 0 11" />
  </Svg>
);

export const Layers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 2.5 9.5 4.5L12 11.5 2.5 7Z" />
    <path d="m2.5 12 9.5 4.5L21.5 12" />
    <path d="m2.5 17 9.5 4.5 9.5-4.5" />
  </Svg>
);

export const Binary = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3.5" width="5" height="6.5" rx="1" />
    <rect x="14" y="14" width="5" height="6.5" rx="1" />
    <path d="M14 3.5h2.5v6.5" />
    <path d="M14 10h5" />
    <path d="M5 20.5h5" />
    <path d="M7.5 20.5V14h-2" />
  </Svg>
);

export const Cpu = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
    <rect x="9" y="9" width="6" height="6" rx=".5" />
    <path d="M5 9.5H3" />
    <path d="M5 14.5H3" />
    <path d="M21 9.5h-2" />
    <path d="M21 14.5h-2" />
    <path d="M9.5 5V3" />
    <path d="M14.5 5V3" />
    <path d="M9.5 21v-2" />
    <path d="M14.5 21v-2" />
  </Svg>
);

export const Antenna = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 11v10.5" />
    <path d="m9 18 3 3 3-3" />
    <path d="M5 8.5 12 3l7 5.5" />
    <path d="M7.5 12 12 8.5l4.5 3.5" />
  </Svg>
);

export const Upload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.5v-12" />
    <path d="m7 13 5-5 5 5" />
    <path d="M4 4.5h16" />
  </Svg>
);

export const Smile = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14.5s1.25 2 3.5 2 3.5-2 3.5-2" />
    <circle cx="9" cy="9.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9.5" r=".9" fill="currentColor" stroke="none" />
  </Svg>
);

export const Sparkles = (p: IconProps) => (
  <Svg {...p}>
    <path d="m10 3 1.75 4.5 4.5 1.75-4.5 1.75L10 15.5 8.25 11l-4.5-1.75 4.5-1.75Z" />
    <path d="m18.5 14.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z" />
  </Svg>
);

export const Clipboard = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4.5H6A1.5 1.5 0 0 0 4.5 6v14A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 18 4.5h-3" />
    <rect x="9" y="2.5" width="6" height="4" rx="1" />
  </Svg>
);

export const FileIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 2.5H6A1.5 1.5 0 0 0 4.5 4v16A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V8Z" />
    <path d="M14 2.5V8h5.5" />
  </Svg>
);
export { FileIcon as File };

export const FolderOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7.5 5.5 5h5l2 2h6.5A1.5 1.5 0 0 1 20.5 8.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18Z" />
    <path d="M3 11.5h17.5" />
  </Svg>
);

export const HardDriveDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 13.5h18" />
    <path d="m3.5 13.5 2.8-7h11.4l2.8 7v5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18.5Z" />
    <path d="M12 3.5v6.5" />
    <path d="m9 7.5 3 3 3-3" />
  </Svg>
);

export const ImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-4.5-4.5L7 20" />
  </Svg>
);
export { ImageIcon as Image };

export const Music = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
);

export const Video = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6" width="13" height="12" rx="1.5" />
    <path d="m16 10 5-3v10l-5-3Z" />
  </Svg>
);

export const Archive = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="4.5" rx="1" />
    <path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9" />
    <path d="M9.5 13h5" />
  </Svg>
);

export const Tablet = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="2.5" width="15" height="19" rx="2" />
    <path d="M11 18.5h2" />
  </Svg>
);

export const Monitor = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="19" height="13" rx="1.5" />
    <path d="M8 20.5h8" />
    <path d="M12 16.5v4" />
  </Svg>
);

export const RotateCw = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 4v5h-5" />
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 9" />
  </Svg>
);

export const Pencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16.5 3 21 7.5 8.5 20H4v-4.5Z" />
    <path d="m13.5 6 4.5 4.5" />
  </Svg>
);

export const HistoryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3 9" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);
export { HistoryIcon as History };

export const Trash2 = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 6h17" />
    <path d="M8.5 6V4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v2" />
    <path d="M5.5 6v14A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Svg>
);

export const ChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const PowerOff = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 8.5a8 8 0 1 0 13 0" />
    <path d="M12 2.5v9" />
  </Svg>
);

export const Users = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20.5a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M17 13.5a6.5 6.5 0 0 1 4.5 7" />
  </Svg>
);

export const AlertTriangle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 22 20.5H2Z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.5" r=".9" fill="currentColor" stroke="none" />
  </Svg>
);

export const Menu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 6h17" />
    <path d="M3.5 12h17" />
    <path d="M3.5 18h17" />
  </Svg>
);
