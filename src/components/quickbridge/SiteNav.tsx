import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  COMPARE_ROUTES,
  HOW_TO_ROUTES,
  PRIMARY_ROUTES,
  USE_CASE_ROUTES,
  visible,
  type SiteRoute,
} from "@/lib/site-routes";

/**
 * Site-wide navigation - appears in AppHeader rightSlot on every marketing
 * page. Desktop: inline links + Compare/Use cases dropdowns. Mobile: hamburger
 * sheet. Routes come from the SITE_ROUTES registry and are filtered by their
 * `inNav` flag, so launching a new page is a one-line registry change.
 */
export function SiteNav() {
  const compares = visible(COMPARE_ROUTES);
  const useCases = visible(USE_CASE_ROUTES);
  const howTos = visible(HOW_TO_ROUTES);
  const primary = visible(PRIMARY_ROUTES);

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 text-[13px] text-muted-foreground md:flex">
        {primary.map((r) => (
          <NavLink key={r.href} route={r} />
        ))}
        {howTos.length > 0 && <NavDropdown label="How-to" routes={howTos} />}
        {compares.length > 0 && <NavDropdown label="Compare" routes={compares} />}
        {useCases.length > 0 && <NavDropdown label="Use cases" routes={useCases} />}
      </nav>

      {/* Mobile hamburger */}
      <MobileNav primary={primary} howTos={howTos} compares={compares} useCases={useCases} />
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

function NavDropdown({ label, routes }: { label: string; routes: SiteRoute[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 outline-none transition-colors hover:bg-card/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[320px] max-w-[calc(100vw-2rem)]"
      >
        {routes.map((r) => (
          <DropdownMenuItem key={r.href} asChild>
            <a
              href={r.href}
              className="flex flex-col items-start gap-0.5 px-3 py-2.5"
            >
              <span className="text-[13px] font-medium text-foreground">{r.label}</span>
              <span className="text-[11.5px] leading-snug text-muted-foreground">
                {r.teaser}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({
  primary,
  howTos,
  compares,
  useCases,
}: {
  primary: SiteRoute[];
  howTos: SiteRoute[];
  compares: SiteRoute[];
  useCases: SiteRoute[];
}) {
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
          <MobileGroup title="Pages" routes={[
            { href: "/", label: "Home", teaser: "Start a transfer.", inNav: true },
            ...primary,
          ]} onNavigate={close} />
          {howTos.length > 0 && (
            <MobileGroup title="How-to guides" routes={howTos} onNavigate={close} />
          )}
          {compares.length > 0 && (
            <MobileGroup title="Compare" routes={compares} onNavigate={close} />
          )}
          {useCases.length > 0 && (
            <MobileGroup title="Use cases" routes={useCases} onNavigate={close} />
          )}
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
