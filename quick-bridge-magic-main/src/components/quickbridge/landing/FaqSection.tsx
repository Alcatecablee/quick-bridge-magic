import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Where do my files go?",
    a: "Nowhere except the other device. Files travel directly between your two browsers over a WebRTC data channel encrypted with DTLS. No copy is stored on any QuickBridge server.",
  },
  {
    q: "What does Supabase see, then?",
    a: "Only the signaling handshake: the SDP offer/answer and ICE candidates needed for the two browsers to find each other. No file contents, no message bodies, no metadata about what you sent.",
  },
  {
    q: "Is there a file size limit?",
    a: "Up to 10 GB per file when the receiver enables auto-save (saves directly to disk); 2 GB per file otherwise so the receiver's tab doesn't run out of memory. The transfer uses 16 KB chunks with an 8 MB backpressure threshold so big files stream smoothly.",
  },
  {
    q: "What if my devices are on different networks?",
    a: "We use STUN to discover your public IP and traverse most NATs automatically. For stricter setups, including CGNAT (common on mobile carriers) and corporate firewalls, we fall back to a TURN relay server. When that happens, files route through the relay before reaching the other device. The relay only forwards encrypted bytes and cannot read your files. You will see a banner inside the session if a relay is active.",
  },
  {
    q: "Can I use QuickBridge with Discord, Slack, or iMessage?",
    a: "Yes. Paste the session link into any chat app and the other person clicks it to open QuickBridge in their browser. The transfer runs directly between the two browsers from there. No Discord file size cap, no WhatsApp compression, no Slack upload limit.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. QuickBridge runs entirely in the browser. You can optionally install it as a PWA for one-tap access, but it's never required.",
  },
  {
    q: "What happens if the connection drops?",
    a: "QuickBridge automatically reconnects with exponential backoff (up to 6 attempts). Active outgoing transfers are flagged so you can resume after recovery.",
  },
  {
    q: "What is QuickBridge?",
    a: "QuickBridge is a browser-based way to send files, text, links, and clipboard content between your devices. It works without apps, cables, accounts, or upload steps. Just open the page, scan a QR code, and your devices connect directly. Transfers are peer-to-peer, end-to-end encrypted, and never stored on a server. It supports cross-platform sharing between phones, PCs, Macs, Linux, Android, and iPhone, and works in any modern browser. You can send large files up to 10 GB with auto-save enabled, or 2 GB otherwise. It also includes auto-reconnect, TURN fallback for tricky networks, and optional clipboard syncing.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
        <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Questions, answered honestly.
        </h2>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          Don't see what you're looking for? The whole product fits in your browser tab. Try it.
        </p>
      </div>
      <div className="lg:col-span-3">
        <div className="flex flex-col border-y border-border divide-y divide-border">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className="py-1">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-4 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14.5px] font-medium text-foreground transition-colors hover:text-foreground/80">
                    {item.q}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
