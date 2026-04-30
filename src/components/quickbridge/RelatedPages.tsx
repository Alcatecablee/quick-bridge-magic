import { ArrowRight } from "./icons";
import {
  COMPARE_ROUTES,
  USE_CASE_ROUTES,
  visible,
  type SiteRoute,
} from "@/lib/site-routes";

interface RelatedPagesProps {
  /** Current page's href; excluded from results so a page never links to itself. */
  currentHref: string;
  /** Optional explicit list - overrides the auto-pick from the registry. */
  routes?: SiteRoute[];
  /** Section heading. */
  heading?: string;
  /** Max links to render. */
  limit?: number;
}

/**
 * Per-page Related strip - drop in at the bottom of any compare or use-case
 * page (above the footer). When `routes` is omitted, picks up to `limit`
 * shipped routes from the registry, always excluding the current page.
 *
 * Renders nothing when there are no related routes to show - keeps newly
 * scaffolded pages from displaying an empty section.
 */
export function RelatedPages({
  currentHref,
  routes,
  heading = "Related comparisons & guides",
  limit = 4,
}: RelatedPagesProps) {
  const pool =
    routes ??
    [...visible(COMPARE_ROUTES), ...visible(USE_CASE_ROUTES)].filter(
      (r) => r.href !== currentHref,
    );
  const items = pool.slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-16 border-t border-border pt-10"
    >
      <h2
        id="related-heading"
        className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {heading}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((r) => (
          <a
            key={r.href}
            href={r.href}
            className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card/40 px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-card/70"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-foreground">
                {r.label}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                {r.teaser}
              </span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </a>
        ))}
      </div>
    </section>
  );
}
