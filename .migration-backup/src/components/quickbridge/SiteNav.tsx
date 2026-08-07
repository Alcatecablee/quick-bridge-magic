import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "./icons";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PRIMARY_ROUTES,
  visible,
  type SiteRoute,
} from "@/lib/site-routes";

/**
 * Site-wide navigation. Desktop: inline flat links. Mobile: hamburger sheet.
 * How-to and Compare link to their hub pages only — individual pages are
 * listed in the footer where 10+ items are appropriate.
 */
export function SiteNav() {
  const primary = visible(PRIMARY_ROUTES);

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 text-[13px] text-muted-foreground md:flex">
        {primary.map((r) => (
          <NavLink key={r.href} route={r} />
        ))}
        <a
          href="/how-to"
          className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-card/60 hover:text-foreground"
        >
          How-to
        </a>
        <a
          href="/compare"
          className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-card/60 hover:text-foreground"
        >
          Compare
        </a>
      </nav>

      {/* Mobile hamburger */}
      <MobileNav primary={primary} />
    </div>
  );
}

function NavLink({ route }: { route: SiteRoute }) {
  return (
    <a
      href={route.href}
      className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-card/60 hover:text-foreground"
    >
      {route.label}
    </a>
  );
}

function MobileNav({ primary }: { primary: SiteRoute[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card/60 text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px]">
        <div className="flex items-center justify-between pb-3">
          <SheetTitle className="text-sm font-semibold">Menu</SheetTitle>
          <SheetClose
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card/60 hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </SheetClose>
        </div>
        <div className="space-y-5 overflow-y-auto pb-6">
          <MobileGroup
            title="Pages"
            routes={[
              { href: "/", label: "Home", teaser: "Start a transfer.", inNav: true },
              ...primary,
              { href: "/how-to", label: "How-to guides", teaser: "All transfer guides.", inNav: true },
              { href: "/compare", label: "Compare", teaser: "QuickBridge vs alternatives.", inNav: true },
            ]}
            onNavigate={close}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileGroup({
  title,
  routes,
  onNavigate,
}: {
  title: string;
  routes: SiteRoute[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {routes.map((r) => (
          <li key={r.href}>
            {r.href === "/" ? (
              <Link
                to="/"
                onClick={onNavigate}
                className="block rounded-md px-2 py-1.5 text-[13.5px] text-foreground hover:bg-card/60"
              >
                {r.label}
              </Link>
            ) : (
              <a
                href={r.href}
                onClick={onNavigate}
                className="block rounded-md px-2 py-1.5 text-[13.5px] text-foreground hover:bg-card/60"
              >
                {r.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
