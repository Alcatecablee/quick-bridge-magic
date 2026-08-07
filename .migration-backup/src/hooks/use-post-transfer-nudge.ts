import { useRef } from "react";
import { toast } from "sonner";

const SESSION_KEY = "qb:nudge-shown";

export function usePostTransferNudge(openContactModal: () => void) {
  const shownRef = useRef(false);

  function maybeNudge() {
    if (shownRef.current) return;
    if (
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(SESSION_KEY)
    )
      return;
    shownRef.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");

    setTimeout(() => {
      let acted = false;

      toast("That worked. Mind helping us?", {
        description: "Report a bug or leave a quick review.",
        duration: 14000,
        action: {
          label: "Leave a review",
          onClick: () => {
            acted = true;
            window.open(
              "https://www.producthunt.com/products/quickbridge",
              "_blank",
              "noopener,noreferrer",
            );
          },
        },
        cancel: {
          label: "Report a bug",
          onClick: () => {
            acted = true;
            openContactModal();
          },
        },
        onDismiss: () => {
          if (!acted) scheduleShareNudge();
        },
        onAutoClose: () => {
          if (!acted) scheduleShareNudge();
        },
      });
    }, 2500);
  }

  function scheduleShareNudge() {
    setTimeout(() => {
      toast("No problem. Share with a friend?", {
        description: "Help someone else discover QuickBridge.",
        duration: 12000,
        action: {
          label: "Share",
          onClick: shareApp,
        },
      });
    }, 600);
  }

  function shareApp() {
    const url = "https://quickbridge.app";
    const text =
      "Send files between your phone and PC in seconds. No app, no account, just scan a QR code.";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({ title: "QuickBridge", text, url })
        .catch(() => copyLink(url));
    } else {
      copyLink(url);
    }
  }

  function copyLink(url: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => {});
  }

  return { maybeNudge };
}
