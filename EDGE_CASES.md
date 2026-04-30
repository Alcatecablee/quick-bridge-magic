# QuickBridge - Edge Cases

A working list of edge cases to consider for QuickBridge. Some are already
handled, some are partially covered, and some are still open. Grouped by area.

## Pairing & signaling
- Same QR scanned by two phones at the same time → two "guests" race for the host. Right now first-write wins; second guest sees a confused state.
- Guest opens `/s/<id>` before the host page is ever opened → infinite "Waiting for the host…" with no hint that the host doesn't exist.
- Host refreshes the home page mid-pairing → new session id is generated, the QR the guest scanned is now dead.
- PIN collision: 6-digit PINs derived from session ids will eventually collide for two simultaneous hosts on the same Supabase project.
- Supabase outage / hits free-tier rate limit → no signaling, no pairing, no fallback path or user-visible diagnosis.
- Browser extensions injecting into `<head>` (already observed) cause hydration re-renders that delay channel setup.

## Network / WebRTC
- Strict symmetric NAT or corporate firewall → no direct ICE candidates, falls through to TURN; if TURN isn't configured or is rate-limited, connection silently stalls.
- IPv6-only or captive-portal networks (hotel Wi-Fi, airline Wi-Fi).
- VPN on one side that blocks UDP entirely → forces TCP TURN, which may not be available.
- Mobile network switching mid-transfer (Wi-Fi → 4G hand-off) → ICE restart needed; partial transfers don't resume today.
- Long-lived connections being killed by mobile OSes when the browser tab backgrounds.
- Both peers behind the same NAT but Supabase is in a far region → high RTT for signaling.

## Files & transfers
- Single file > 2 GB cap (already gated, but the UX could be friendlier - drag a folder of small files and one giant one, only the giant one is rejected).
- iOS Safari memory limits when receiving large files without the streaming-to-disk API (Safari doesn't support `showSaveFilePicker`).
- Receiver hits "Cancel" on the save-file dialog mid-stream - the sender needs to stop, not just drop chunks.
- Tab/page refresh mid-transfer → all in-flight files are lost with no resume.
- Filename with special characters / RTL / very long names / reserved Windows names (`CON`, `PRN`, etc.).
- Identical filenames sent in succession overwrite each other in the receiver's downloads folder.
- Backpressure: very fast LAN saturating the data channel buffer if we don't pause on `bufferedAmountLow`.

## Clipboard & text
- Browser denies clipboard permission silently - auto-paste/auto-copy fails with no toast.
- Clipboard contains non-text (image, file) - currently only text is shipped.
- Auto-clipboard preference on a public/shared computer is a privacy footgun. ✅ Warning now shown in toggle description.
- Very large pasted text (e.g., 10 MB log file) sent over the text channel instead of as a file. ✅ 512 KB hard cap in sendText; manual send shows toast suggesting .txt file.

## Security & privacy
- `localStorage` retains `deviceName`, history, and the active-session marker on a shared device - anyone next at that PC could resume the bridge.
- SAS code is shown but users won't actually compare it; no enforced verification step.
- PIN entry has no rate limiting → brute force possible (1M attempts).
- Pair URL contains the full session id, so anyone who sees it (over-the-shoulder, screenshot, screen-share) can join.
- No upper bound on session lifetime - a forgotten host page stays joinable indefinitely.

## Multi-tab / multi-device
- User opens two tabs of the same session on the same device - duplicate `host` presence, ICE renegotiation churn.
- Active-session resume banner on a shared device shows the previous user's session id.
- Browser back/forward through `/`, `/s/<id>`, `/session/<id>` produces unexpected re-subscribes.

## Browser / platform
- Safari's stricter autoplay policy → connect/notification sounds don't play until user gesture.
- Firefox's tracking protection can block Supabase WebSockets in some configs.
- PWA installed mode vs browser tab → notification + install prompt behaviors differ.
- Old browsers without WebRTC data-channel support or `crypto.subtle` (PIN derivation). ✅ Feature-detection banner shown on home page for unsupported browsers.

## State & storage
- localStorage quota exceeded (history is unbounded as written).
- User clears site data mid-session → keys, history, active-session marker all vanish; reconnect impossible.
- Two browser windows sharing localStorage stomp on each other's `qb:hostSessionId`.

## UX gaps
- No "End bridge" button - only way to leave is closing the tab or clicking back, which is exactly why the resume banner exists.
- No way for the host to kick the guest or rotate credentials mid-session.
- No feedback when the peer's tab is backgrounded / network quality drops to zero - they just appear frozen.
