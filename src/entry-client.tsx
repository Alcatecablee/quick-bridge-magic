import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

startTransition(() => {
  document
    .querySelectorAll('head script[src^="chrome-extension://"]')
    .forEach((el) => el.remove());

  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError: (error: unknown) => {
        const msg =
          error instanceof Error ? error.message : String(error);
        if (
          msg.includes("Hydration failed") ||
          msg.includes("hook call") ||
          msg.includes("Minified React error")
        ) {
          return;
        }
        console.error(error);
      },
    },
  );
});
