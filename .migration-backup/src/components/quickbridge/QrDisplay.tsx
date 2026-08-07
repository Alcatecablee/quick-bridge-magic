import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  text: string;
  size?: number;
  pulse?: boolean;
}

export function QrDisplay({ text, size = 280, pulse = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;
    QRCode.toCanvas(ref.current, text, {
      width: size,
      margin: 1,
      color: { dark: "#1a1535", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  }, [text, size]);

  const boxSize = size + 24;
  return (
    <div
      className="relative mx-auto"
      style={{ width: boxSize, height: boxSize, maxWidth: "100%" }}
    >
      {pulse && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[0.95rem] ring-1 ring-primary/30 animate-[ping_3s_ease-out_infinite]"
        />
      )}
      <div
        className="relative flex items-center justify-center rounded-xl border border-border bg-white"
        style={{ width: boxSize, height: boxSize, maxWidth: "100%" }}
      >
        <canvas
          ref={ref}
          width={size}
          height={size}
          style={{ width: size, height: size, display: "block" }}
        />
      </div>
    </div>
  );
}