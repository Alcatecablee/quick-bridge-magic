import { Link } from "@tanstack/react-router";
import { ArrowRight, Home, RefreshCw } from "./icons";
import { AppHeader } from "@/components/quickbridge/Wordmark";
import { SiteNav } from "@/components/quickbridge/SiteNav";
import { SiteFooter } from "@/components/quickbridge/SiteFooter";
import { Button } from "@/components/ui/button";
import { PRIMARY_ROUTES, visible } from "@/lib/site-routes";

/**
 * Dedicated 404 page. Shares the marketing shell (AppHeader + SiteNav +
 * SiteFooter) so it feels like part of the site, not a stranded fallback.
 *
 * Surfaces the same inNav PRIMARY_ROUTES used elsewhere so a user who
 * mistyped a URL has an obvious next step.
 */
export function NotFound() {
  const primary = visible(PRIMARY_ROUTES);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            We couldn't find that page
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            The link may be broken or the page may have moved. Your files and
            connections are unaffected — nothing is ever stored on a server.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link to="/join">Join with a PIN</Link>
            </Button>
          </div>
        </div>

        {primary.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <p className="text-center text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or explore
            </p>
            <ul className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
              {primary.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-surface/60 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-surface"
                  >
                    <span>
                      <span className="block text-[14px] font-medium text-foreground">
                        {r.label}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                        {r.teaser}
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}

/**
 * Themed render-error fallback used as the route `errorComponent`. Kept in
 * the same file because it shares the same shell and intent: explain, offer
 * a clear way forward, never strand the user on an unstyled screen.
 */
export function RouteError({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader maxWidthClass="max-w-4xl" rightSlot={<SiteNav />} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-destructive">
            Something went wrong
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            This page hit a snag
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            An unexpected error stopped the page from loading. Try again, or
            head home — your transfers are unaffected.
          </p>

          {error?.message && (
            <pre className="mx-auto mt-6 max-w-md overflow-x-auto rounded-md border border-border bg-surface/60 px-3 py-2 text-left text-[12px] leading-relaxed text-muted-foreground">
              {error.message}
            </pre>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {reset && (
              <Button onClick={reset} size="lg" className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
