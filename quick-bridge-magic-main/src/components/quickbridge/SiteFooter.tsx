import { Link } from "@tanstack/react-router";
import {
  COMPARE_ROUTES,
  HOW_TO_ROUTES,
  PRIMARY_ROUTES,
  VIDEO_ROUTE,
  PARTNERS_ROUTE,
  visible,
} from "@/lib/site-routes";

const WA_HREF = `https://wa.me/27650821001?text=${encodeURIComponent("Hi, I have a question about QuickBridge.")}`;

/**
 * Shared site-wide footer. Five columns at lg breakpoint:
 * Brand | Product | Trust | How-to | Compare
 *
 * How-to and Compare list every published page directly; this is the right
 * place for comprehensive link lists. The nav header links only to their hubs.
 */
export function SiteFooter() {
  const compares = visible(COMPARE_ROUTES);
  const howTos = visible(HOW_TO_ROUTES);
  const primary = visible(PRIMARY_ROUTES);

  return (
    <footer className="mt-20 border-t border-border pt-10 sm:mt-28">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand + status */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="text-[15px] font-semibold tracking-tight text-foreground">
            QuickBridge
          </div>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Peer-to-peer file, clipboard, and tab transfer. Browser-native,
            end-to-end encrypted, no accounts.
          </p>
        </div>

        {/* Product */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Product
          </p>
          <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/80">
            <li>
              <Link to="/" className="hover:text-foreground">
                Start a session
              </Link>
            </li>
            <li>
              <Link to="/join" className="hover:text-foreground">
                Join with PIN
              </Link>
            </li>
            {primary.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="hover:text-foreground">
                  {r.label}
                </a>
              </li>
            ))}
            <li>
              <a href={VIDEO_ROUTE.href} className="hover:text-foreground">
                {VIDEO_ROUTE.label}
              </a>
            </li>
            <li>
              <a href={PARTNERS_ROUTE.href} className="hover:text-foreground">
                {PARTNERS_ROUTE.label}
              </a>
            </li>
          </ul>
        </div>

        {/* Trust */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trust
          </p>
          <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/80">
            <li>WebRTC + DTLS encryption</li>
            <li>No server-side storage</li>
            <li>Free, forever</li>
            <li>Installable PWA</li>
          </ul>
        </div>

        {/* How-to guides */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            How-to
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-foreground/80">
            {howTos.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="hover:text-foreground">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Compare */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compare
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-foreground/80">
            {compares.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="hover:text-foreground">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} QuickBridge · End-to-end encrypted. Direct when possible, securely relayed when needed.
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/help"
            className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Help
          </Link>
          <Link
            to="/about"
            className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Privacy
          </Link>
          <Link
            to="/contact"
            className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
