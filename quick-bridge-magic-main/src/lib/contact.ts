import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  message: z.string().min(1).max(2000),
});

export type ContactPayload = z.infer<typeof ContactSchema>;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailHtml(name: string, email: string, message: string): string {
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

export function renderEmailText(name: string, email: string, message: string): string {
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
