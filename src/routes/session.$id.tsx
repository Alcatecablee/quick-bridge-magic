import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SessionSkeleton } from "@/components/quickbridge/SessionSkeleton";

const Session = lazy(() =>
  import("@/components/quickbridge/Session").then((m) => ({ default: m.Session }))
);

export const Route = createFileRoute("/session/$id")({
  component: HostSession,
  head: () => ({
    meta: [
      { title: "Session - QuickBridge" },
      { name: "description", content: "Active QuickBridge session." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function HostSession() {
  const { id } = Route.useParams();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader
        maxWidthClass="max-w-3xl"
        rightSlot={
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            New session
          </Link>
        }
      />
      <main className="relative mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <Suspense fallback={<SessionSkeleton />}>
          <Session sessionId={id} isInitiator={true} />
        </Suspense>
      </main>
    </div>
  );
}
