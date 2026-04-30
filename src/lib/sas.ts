// Short Authentication String (SAS) verification.
//
// Each peer extracts the DTLS fingerprint from its local and remote SDP,
// concatenates them in sorted order, hashes with SHA-256, and maps the first
// few bytes to a 4-word phrase + matching emoji set. Both peers MUST see the
// same phrase if no man-in-the-middle is rewriting signaling.

// 64 short, distinctive English words - index by 6 bits.
const WORDS = [
  "amber", "anchor", "apple", "arrow", "atlas", "axis", "bacon", "badge",
  "banjo", "basil", "beach", "berry", "birch", "bison", "blaze", "bloom",
  "boat", "bolt", "brick", "brook", "bugle", "cabin", "cactus", "cadet",
  "candy", "canyon", "cargo", "carrot", "cedar", "chess", "chime", "cobra",
  "comet", "coral", "crane", "crayon", "cyan", "daisy", "delta", "denim",
  "diver", "dolphin", "ember", "falcon", "fern", "fjord", "forest", "frost",
  "garnet", "ginger", "glacier", "harbor", "honey", "ivory", "jolly", "kayak",
  "lemon", "marble", "meadow", "olive", "panda", "quartz", "raven", "saffron",
];

// 64 emoji aligned with the words for a glanceable comparison.
const EMOJI = [
  "🟠", "⚓", "🍎", "➡️", "🗺️", "🧭", "🥓", "🎖️",
  "🪕", "🌿", "🏖️", "🍒", "🌳", "🦬", "🔥", "🌸",
  "⛵", "⚡", "🧱", "🌊", "🎺", "🏚️", "🌵", "🎓",
  "🍬", "🏞️", "📦", "🥕", "🌲", "♟️", "🔔", "🐍",
  "☄️", "🪸", "🦢", "🖍️", "🟦", "🌼", "🔺", "👖",
  "🤿", "🐬", "🌑", "🦅", "🍀", "🏔️", "🌴", "❄️",
  "💎", "🫚", "🧊", "🚢", "🍯", "🦷", "😄", "🛶",
  "🍋", "⚪", "🌾", "🫒", "🐼", "🟪", "🐦‍⬛", "🌻",
];

export interface SasCode {
  words: string[]; // 4 words
  emoji: string[]; // 4 emoji
}

export function extractFingerprint(sdp: string): string | null {
  // Match e.g.  a=fingerprint:sha-256 9C:8F:...:AB
  const m = sdp.match(/^a=fingerprint:[a-zA-Z0-9-]+\s+([0-9A-Fa-f:]+)\s*$/m);
  if (!m) return null;
  return m[1].toUpperCase();
}

export async function deriveSas(localFp: string, remoteFp: string): Promise<SasCode> {
  const sorted = [localFp, remoteFp].sort().join("|");
  const data = new TextEncoder().encode(sorted);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  const idx = [bytes[0] & 0x3f, bytes[1] & 0x3f, bytes[2] & 0x3f, bytes[3] & 0x3f];
  return {
    words: idx.map((i) => WORDS[i]),
    emoji: idx.map((i) => EMOJI[i]),
  };
}
