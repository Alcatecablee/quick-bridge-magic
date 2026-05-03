import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { InfinityIcon, Lock, ShieldCheck, Smartphone } from "./icons";
import {
  COMPARE_ROUTES,
  PRIMARY_ROUTES,
  USE_CASE_ROUTES,
  visible,
} from "@/lib/site-routes";
import { ContactModal } from "@/components/quickbridge/ContactModal";

/**
 * Shared site-wide footer - used on every marketing page (home, why,
 * airdrop-alt, and all forthcoming /compare/* and /use/*).
 *
 * Internal-linking surface: every shipped marketing route has at least one
 * link from every other marketing route via this footer. That's the bare
 * minimum SEO crawl-graph hygiene.
 */
export function SiteFooter() {
  const compares = visible(COMPARE_ROUTES);
  const useCases = visible(USE_CASE_ROUTES);
  const primary = visible(PRIMARY_ROUTES);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="mt-20 border-t border-border pt-10 sm:mt-28">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + status */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="text-[15px] font-semibold tracking-tight text-foreground">
            QuickBridge
          </div>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Peer-to-peer file, clipboard, and message transfer. Browser-native,
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
          </ul>
        </div>

        {/* Trust */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trust
          </p>
          <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/80">
            <li className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-primary" /> WebRTC + DTLS encryption
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> No server-side storage
            </li>
            <li className="flex items-center gap-2">
              <InfinityIcon className="h-3.5 w-3.5 text-primary" /> Free, forever
            </li>
            <li className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-primary" /> Installable PWA
            </li>
          </ul>
        </div>

        {/* Resources - Compare + Use cases lists, fed by the registry. Empty
            until the first compare or use-case page flips inNav. */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Resources
          </p>
          {compares.length === 0 && useCases.length === 0 ? (
            <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/80">
              <li>
                <Link to="/why-quickbridge" className="hover:text-foreground">
                  Why QuickBridge
                </Link>
              </li>
              <li>
                <Link to="/airdrop-alternative" className="hover:text-foreground">
                  AirDrop alternative
                </Link>
              </li>
            </ul>
          ) : (
            <div className="mt-3 space-y-4">
              {compares.length > 0 && (
                <FooterColumn heading="Compare" routes={compares} />
              )}
              {useCases.length > 0 && (
                <FooterColumn heading="Use cases" routes={useCases} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-6 opacity-50">
        <a
          href="https://www.producthunt.com/products/quickbridge?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-quickbridge"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt="QuickBridge - Move files between your phone and PC instantly. No apps. | Product Hunt"
            width="250"
            height="54"
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1138210&theme=dark&t=1777841949536"
          />
        </a>
        <a
          href="https://startupfa.me/s/quickbridge?utm_source=quickbridge.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://startupfa.me/badges/featured/dark-small-rounded.webp"
            alt="QuickBridge - Featured on Startup Fame"
            width="240"
            height="37"
          />
        </a>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground sm:flex-row">
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
            to="/privacy"
            className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Privacy
          </Link>
          <button
            onClick={() => setContactOpen(true)}
            className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Contact
          </button>
        </div>
      </div>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </footer>
  );
}

function FooterColumn({
  heading,
  routes,
}: {
  heading: string;
  routes: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {heading}
      </p>
      <ul className="mt-1.5 space-y-1.5 text-[13px] text-foreground/80">
        {routes.map((r) => (
          <li key={r.href}>
            <a href={r.href} className="hover:text-foreground">
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
