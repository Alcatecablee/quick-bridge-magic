import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  as?: ElementType;
  className?: string;
  delay?: number;
  id?: string;
  children: ReactNode;
};

/**
 * Wraps a section so it fades + zooms in the first time it scrolls into view.
 * Uses IntersectionObserver, fires only once, and is a no-op when the user
 * has prefers-reduced-motion enabled.
 */
export function Reveal({
  as: Tag = "div",
  className,
  delay = 0,
  id,
  children,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      id={id}
      style={delay && !shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-[700ms] ease-out motion-reduce:transition-none",
        shown
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-[0.98]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
