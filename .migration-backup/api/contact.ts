import { Resend } from "resend";
import { z } from "zod";

const OWNER_EMAIL = "clivemakazhu@gmail.com";
const FROM_ADDRESS = "QuickBridge Contact <contact@quickbridge.app>";
const UNSUBSCRIBE_MAILTO = "unsubscribe@quickbridge.app";
const SITE_ORIGIN = "https://quickbridge.app";
const MAX_BODY_BYTES = 10_000;
const MIN_FILL_MS = 2_500;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(2000),
  company: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.number().int().positive().optional(),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

const rateLimit = new Map<string, number[]>();

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }
  try {
    const resp = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!resp.ok) {
      return { ok: false, reason: `verify_http_${resp.status}` };
    }
    const data = (await resp.json()) as TurnstileVerifyResponse;
    if (data.success) return { ok: true };
    const codes = (data["error-codes"] ?? []).join(",") || "unknown";
    return { ok: false, reason: codes };
  } catch {
    return { ok: false, reason: "verify_network_error" };
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  const real = req.headers["x-real-ip"];
  if (typeof real === "string") return real;
  return "unknown";
}

function isAllowedOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const candidates: string[] = [];
  if (typeof origin === "string") candidates.push(origin);
  if (typeof referer === "string") candidates.push(referer);
  if (candidates.length === 0) {
    return false;
  }
  return candidates.some(
    (c) => c === SITE_ORIGIN || c.startsWith(`${SITE_ORIGIN}/`),
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateLimit.get(ip) ?? []).filter((t) => t > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimit.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateLimit.set(ip, recent);
  if (rateLimit.size > 5000) {
    for (const [k, ts] of rateLimit) {
      const pruned = ts.filter((t) => t > cutoff);
      if (pruned.length === 0) rateLimit.delete(k);
      else rateLimit.set(k, pruned);
    }
  }
  return true;
}

function renderOwnerHtml(name: string, email: string, message: string): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  const previewText = `New contact message from ${safeName}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>QuickBridge contact</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0b0d12;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0d12;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#151821;border:1px solid #262a36;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#f3f4f6;">
                      <img src="https://quickbridge.app/icon-192.png" width="32" height="32" alt="QuickBridge" style="display:inline-block;vertical-align:middle;width:32px;height:32px;border-radius:8px;margin-right:10px;" />
                      <span style="vertical-align:middle;"><span style="color:#22d3ee;">Quick</span><span style="color:#f3f4f6;">Bridge</span></span>
                    </td>
                    <td valign="middle" align="right" style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#22d3ee;">
                      New message
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#f3f4f6;letter-spacing:-0.01em;">
                  Contact form submission
                </h1>
                <p style="margin:6px 0 0 0;font-size:13.5px;line-height:1.5;color:#9ca3af;">
                  Someone just reached out through the contact form on quickbridge.app.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1218;border:1px solid #262a36;border-radius:10px;">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #262a36;">
                      <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;">From</div>
                      <div style="margin-top:4px;font-size:15px;font-weight:600;color:#f3f4f6;">${safeName}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;">Email</div>
                      <div style="margin-top:4px;font-size:15px;">
                        <a href="mailto:${safeEmail}" style="color:#22d3ee;text-decoration:none;font-weight:500;">${safeEmail}</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Message</div>
                <div style="background-color:#0f1218;border:1px solid #262a36;border-radius:10px;padding:16px;font-size:14.5px;line-height:1.6;color:#f3f4f6;white-space:pre-wrap;">${safeMessage}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px 32px;">
                <a href="mailto:${safeEmail}?subject=Re%3A%20your%20QuickBridge%20message" style="display:inline-block;background-color:#22d3ee;color:#0b0d12;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:8px;letter-spacing:-0.005em;">
                  Reply to ${safeName}
                </a>
                <span style="display:inline-block;margin-left:12px;font-size:12.5px;color:#9ca3af;">
                  Or just hit reply &mdash; this email&#39;s reply-to is set to the sender.
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #262a36;background-color:#0f1218;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:12px;color:#9ca3af;">
                      Sent from the contact form on
                      <a href="https://quickbridge.app" style="color:#22d3ee;text-decoration:none;">quickbridge.app</a>
                    </td>
                    <td align="right" style="font-size:12px;color:#9ca3af;">
                      P2P file transfer &middot; No accounts
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:11.5px;color:#6b7280;">
            You&#39;re receiving this because you own the QuickBridge contact inbox.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderOwnerText(name: string, email: string, message: string): string {
  return [
    "QuickBridge - new contact form submission",
    "",
    `From:    ${name}`,
    `Email:   ${email}`,
    "",
    "Message:",
    message,
    "",
    "--",
    "Reply directly to respond - reply-to is set to the sender.",
    "Sent from the contact form on https://quickbridge.app",
  ].join("\n");
}

function renderAckHtml(name: string, message: string): string {
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  const previewText = `Got your message ${safeName} - we'll be in touch soon`;
  const unsubscribeHref = `mailto:${UNSUBSCRIBE_MAILTO}?subject=Unsubscribe`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>We got your message</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0b0d12;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0d12;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#151821;border:1px solid #262a36;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#f3f4f6;">
                      <img src="https://quickbridge.app/icon-192.png" width="32" height="32" alt="QuickBridge" style="display:inline-block;vertical-align:middle;width:32px;height:32px;border-radius:8px;margin-right:10px;" />
                      <span style="vertical-align:middle;"><span style="color:#22d3ee;">Quick</span><span style="color:#f3f4f6;">Bridge</span></span>
                    </td>
                    <td valign="middle" align="right" style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#22d3ee;">
                      Confirmation
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#f3f4f6;letter-spacing:-0.01em;">
                  Hi ${safeName}, we got your message
                </h1>
                <p style="margin:8px 0 0 0;font-size:14px;line-height:1.55;color:#d1d5db;">
                  Thanks for reaching out through quickbridge.app. We&#39;ll get back to you at the email you provided as soon as we can &mdash; usually within a business day.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Your message</div>
                <div style="background-color:#0f1218;border:1px solid #262a36;border-radius:10px;padding:16px;font-size:14px;line-height:1.6;color:#d1d5db;white-space:pre-wrap;">${safeMessage}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 28px 32px;">
                <a href="https://quickbridge.app" style="display:inline-block;background-color:#22d3ee;color:#0b0d12;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:8px;letter-spacing:-0.005em;">
                  Back to QuickBridge
                </a>
                <span style="display:inline-block;margin-left:12px;font-size:12.5px;color:#9ca3af;">
                  Need to add something? Just reply to this email.
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #262a36;background-color:#0f1218;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:12px;color:#9ca3af;">
                      <a href="https://quickbridge.app" style="color:#22d3ee;text-decoration:none;">quickbridge.app</a>
                      &middot; P2P file transfer
                    </td>
                    <td align="right" style="font-size:12px;color:#9ca3af;">
                      No accounts &middot; Nothing stored
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:11.5px;color:#6b7280;line-height:1.5;">
            You&#39;re receiving this confirmation because you submitted the contact form on quickbridge.app.
            <br/>
            Don&#39;t want these confirmations?
            <a href="${unsubscribeHref}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            &middot; we&#39;ll honour it within one business day.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderAckText(name: string, message: string): string {
  return [
    `Hi ${name},`,
    "",
    "Thanks for reaching out through quickbridge.app. We got your message and will get back to you at the email you provided as soon as we can - usually within a business day.",
    "",
    "Your message:",
    message,
    "",
    "Need to add something? Just reply to this email.",
    "",
    "--",
    "QuickBridge - P2P file transfer",
    "https://quickbridge.app",
    "",
    `Don't want these confirmations? Email ${UNSUBSCRIBE_MAILTO} with subject "Unsubscribe" and we'll honour it within one business day.`,
  ].join("\n");
}

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ error: "Forbidden origin" });
    return;
  }

  let raw: unknown = req.body;
  if (typeof raw === "string") {
    if (raw.length > MAX_BODY_BYTES) {
      res.status(413).json({ error: "Payload too large" });
      return;
    }
    try {
      raw = JSON.parse(raw);
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
  } else if (raw && typeof raw === "object") {
    try {
      const serialized = JSON.stringify(raw);
      if (serialized.length > MAX_BODY_BYTES) {
        res.status(413).json({ error: "Payload too large" });
        return;
      }
    } catch {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
  }

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid input",
      details: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  const { name, email, message, company, startedAt, turnstileToken } = parsed.data;

  if (typeof company === "string" && company.length > 0) {
    res.status(200).json({ ok: true });
    return;
  }

  if (typeof startedAt === "number") {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_FILL_MS) {
      res.status(200).json({ ok: true });
      return;
    }
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    res.setHeader("Retry-After", "3600");
    res.status(429).json({
      error: "Too many submissions. Please try again later.",
    });
    return;
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!turnstileToken) {
      res.status(400).json({
        error: "Verification required. Please complete the challenge.",
      });
      return;
    }
    const verdict = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
    if (!verdict.ok) {
      res.status(400).json({
        error: "Verification failed. Please refresh and try again.",
      });
      return;
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Contact form is not configured." });
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const { error: ownerError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: OWNER_EMAIL,
      replyTo: email,
      subject: `QuickBridge contact from ${name}`,
      text: renderOwnerText(name, email, message),
      html: renderOwnerHtml(name, email, message),
    });

    if (ownerError) {
      res.status(502).json({ error: "Failed to send message. Please try again." });
      return;
    }
  } catch {
    res.status(502).json({ error: "Failed to send message. Please try again." });
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      replyTo: OWNER_EMAIL,
      subject: "We got your message - QuickBridge",
      text: renderAckText(name, message),
      html: renderAckHtml(name, message),
      headers: {
        "List-Unsubscribe": `<mailto:${UNSUBSCRIBE_MAILTO}?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Auto-Submitted": "auto-replied",
      },
    });
  } catch {
    // Acknowledgment failure is non-fatal: the owner notification already succeeded.
  }

  res.status(200).json({ ok: true });
}
