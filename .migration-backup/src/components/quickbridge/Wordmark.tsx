import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className = "h-9 w-9" }: WordmarkProps) {
  return (
    <img
      src="/brand/quickbridge-logo.png"
      alt="QuickBridge"
      className={`${className} qb-logo-shimmy object-contain`}
      draggable={false}
    />
  );
}

interface AppHeaderProps {
  rightSlot?: ReactNode;
  maxWidthClass?: string;
  /**
   * Whether to render the text wordmark image next to the logo icon.
   * Defaults to `false` so most pages show only the icon (a calmer
   * header). Set to `true` on the homepage where the full mark anchors
   * the brand. Anywhere the mark is hidden, the link still has an
   * accessible name via aria-label.
   */
  showWordmark?: boolean;
}

export function AppHeader({
  rightSlot,
  maxWidthClass = "max-w-6xl",
  showWordmark = false,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className={`mx-auto flex ${maxWidthClass} items-center justify-between px-4 py-3 sm:px-6 sm:py-4`}>
        <Link
          to="/"
          aria-label="QuickBridge home"
          className="group flex items-center gap-1.5 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Wordmark className="h-8 w-8 sm:h-9 sm:w-9" />
          {showWordmark && (
            <img
              src="/brand/quickbridge-wordmark.png"
              alt="QuickBridge"
              className="h-5 w-auto sm:h-6"
              draggable={false}
            />
          )}
        </Link>
        {rightSlot}
      </div>
    </header>
  );
}
