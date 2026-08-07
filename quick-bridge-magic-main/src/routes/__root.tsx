import { useEffect } from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { initPwa } from "@/lib/pwa";
import { QbBackground } from "@/components/quickbridge/QbBackground";
import { NotFound, RouteError } from "@/components/quickbridge/NotFound";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
});

function RootComponent() {
  useEffect(() => {
    initPwa();
  }, []);
  return (
    <>
      {/* overflow-hidden is intentionally absent: it breaks position:sticky.
          Horizontal overflow is prevented by max-w-* on page content and by
          QbBackground's own absolute inset-0 overflow-hidden wrapper. */}
      <div className="relative min-h-screen bg-background">
        <QbBackground />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.12), transparent)",
          }}
          aria-hidden
        />
        <Outlet />
      </div>
      <Toaster position="top-center" visibleToasts={3} />
      {import.meta.env.PROD && <Analytics />}
    </>
  );
}
