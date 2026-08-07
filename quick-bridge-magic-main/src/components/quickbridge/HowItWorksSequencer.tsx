import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "./icons";
import { Card } from "@/components/ui/card";

interface Step {
  n: string;
  title: string;
  body: string;
  video: string;
}

interface Props {
  steps: Step[];
}

export function HowItWorksSequencer({ steps }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const el = sectionRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) {
      setActive(0);
      videoRefs.current.forEach((v) => {
        if (!v) return;
        v.pause();
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
      });
    }
  }, [inView]);

  const playing = hovered !== null ? hovered : active;

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === playing && (inView || hovered !== null)) {
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => undefined);
      } else {
        v.pause();
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    });
  }, [playing, inView, hovered]);

  const handleEnded = (i: number) => {
    if (hovered !== null) return;
    setActive((i + 1) % steps.length);
  };

  return (
    <div ref={sectionRef} className="mt-10 grid gap-5 sm:grid-cols-3">
      {steps.map((step, i) => {
        const isActive = playing === i;
        return (
          <Card
            key={step.n}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            className={
              "relative overflow-hidden border-border bg-card p-0 transition-all duration-300 " +
              (isActive
                ? "border-primary/60 shadow-[0_0_0_1px_var(--color-primary)]/30"
                : "opacity-90 hover:opacity-100")
            }
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-elevated">
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className={
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 " +
                  (isActive ? "opacity-100" : "opacity-55")
                }
                src={step.video}
                muted
                loop={false}
                playsInline
                preload="metadata"
                onEnded={() => handleEnded(i)}
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-card to-transparent" />
              {!isActive && (
                <div className="pointer-events-none absolute inset-0 bg-card/30" aria-hidden />
              )}
            </div>
            <div className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={
                    "font-mono text-[11px] font-semibold tracking-wider transition-colors " +
                    (isActive ? "text-primary" : "text-muted-foreground")
                  }
                >
                  STEP {step.n}
                </span>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground/50 sm:block" />
                )}
              </div>
              <h3 className="text-[16px] font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
