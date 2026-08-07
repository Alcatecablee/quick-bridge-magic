import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "./icons";
import { readJSON, writeJSON, removeKey, StorageKeys } from "@/lib/storage";

interface ContactDraft {
  name: string;
  email: string;
  message: string;
  savedAt: number;
}

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_DEBOUNCE_MS = 800;

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function ensureTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("ssr"));
    if (window.turnstile) return resolve();
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("script load failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("script load failed")), { once: true });
    document.head.appendChild(script);
  });
}

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
  }, [open]);

  useEffect(() => {
    if (!open || restoredRef.current) return;
    restoredRef.current = true;
    if (name || email || message) return;
    const draft = readJSON<ContactDraft | null>(StorageKeys.contactDraft, null);
    if (!draft || typeof draft !== "object") return;
    if (typeof draft.savedAt !== "number" || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      removeKey(StorageKeys.contactDraft);
      return;
    }
    let restored = false;
    if (typeof draft.name === "string" && draft.name) {
      setName(draft.name);
      restored = true;
    }
    if (typeof draft.email === "string" && draft.email) {
      setEmail(draft.email);
      restored = true;
    }
    if (typeof draft.message === "string" && draft.message) {
      setMessage(draft.message);
      restored = true;
    }
    if (restored) setDraftRestored(true);
  }, [open, name, email, message]);

  useEffect(() => {
    if (!open || status === "sending" || status === "success") return;
    if (!name && !email && !message) return;
    const t = setTimeout(() => {
      writeJSON<ContactDraft>(StorageKeys.contactDraft, {
        name,
        email,
        message,
        savedAt: Date.now(),
      });
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [open, status, name, email, message]);

  function discardDraft() {
    setName("");
    setEmail("");
    setMessage("");
    setDraftRestored(false);
    removeKey(StorageKeys.contactDraft);
  }

  useEffect(() => {
    if (!open || !TURNSTILE_SITE_KEY || status === "success") return;
    let cancelled = false;

    ensureTurnstileScript()
      .then(() => {
        if (cancelled) return;
        if (!window.turnstile || !turnstileContainerRef.current) return;
        if (turnstileWidgetIdRef.current) return;
        try {
          const id = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "dark",
            size: "flexible",
            callback: (token: string) => {
              if (!cancelled) {
                setTurnstileToken(token);
                setTurnstileReady(true);
              }
            },
            "error-callback": () => {
              if (!cancelled) {
                setTurnstileToken("");
                setTurnstileReady(false);
              }
            },
            "expired-callback": () => {
              if (!cancelled) {
                setTurnstileToken("");
                setTurnstileReady(false);
              }
            },
          });
          turnstileWidgetIdRef.current = id;
        } catch {
          // widget render failed - leave form usable; server will reject if secret is set
        }
      })
      .catch(() => {
        // script failed to load; leave form usable
      });

    return () => {
      cancelled = true;
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
      }
      turnstileWidgetIdRef.current = null;
      setTurnstileToken("");
      setTurnstileReady(false);
    };
  }, [open, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorText("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          company,
          startedAt: startedAtRef.current ?? Date.now(),
          turnstileToken: turnstileToken || undefined,
        }),
      });
      if (!res.ok) {
        let serverMessage = "Something went wrong. Please try again.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body && typeof body.error === "string") serverMessage = body.error;
        } catch {
          // response wasn't JSON; keep generic message
        }
        throw new Error(serverMessage);
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
      setDraftRestored(false);
      removeKey(StorageKeys.contactDraft);
    } catch (err: unknown) {
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
      }
      setTurnstileToken("");
      setTurnstileReady(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setStatus("idle");
      setErrorText("");
      startedAtRef.current = null;
      restoredRef.current = false;
      setDraftRestored(false);
    }
    onOpenChange(open);
  }

  const submitDisabled =
    status === "sending" || (Boolean(TURNSTILE_SITE_KEY) && !turnstileReady);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get in touch</DialogTitle>
          <DialogDescription>
            Send a message and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="h-10 w-10 text-success" />
            <p className="text-sm font-medium text-foreground">Message sent!</p>
            <p className="text-xs text-muted-foreground">
              Thanks for reaching out. Check your inbox for a confirmation, and we'll reply shortly.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
            >
              <label htmlFor="contact-company">Company (leave blank)</label>
              <input
                id="contact-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {draftRestored && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span>Restored unsent draft from your last visit.</span>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Discard
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={status === "sending"}
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === "sending"}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                placeholder="How can we help?"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={status === "sending"}
              />
            </div>

            {TURNSTILE_SITE_KEY && (
              <div ref={turnstileContainerRef} className="flex justify-center" />
            )}

            {status === "error" && (
              <p className="text-xs text-destructive">{errorText}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitDisabled}>
              {status === "sending" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send message"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
