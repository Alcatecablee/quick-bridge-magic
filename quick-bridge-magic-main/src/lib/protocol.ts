// QuickBridge Protocol: version constants and strict message validators.
//
// Every packet that crosses the DataChannel or a presence/broadcast channel
// is parsed here before reaching business logic. Treat every message as
// input from the public internet: validate the shape, types, and value
// ranges before trusting any field.
//
// Protocol version history:
//   v1  Initial Phase 2 release. ECDSA P-256 challenge/verify, node-hello,
//       per-node presence channels, trusted-connect broadcast.
//
// Adding a non-breaking field: add it as optional to the validator and the
// type; old clients that omit it still parse successfully.
//
// Breaking change (mandatory new field, removed field, changed semantics):
// bump QB_PROTO_VERSION, add a compat path for clients on the old version.

export const QB_PROTO_VERSION = 1;

// ---------------------------------------------------------------------------
// Primitive validators (not exported; used only inside this module)
// ---------------------------------------------------------------------------

// Standard crypto.randomUUID() produces xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.
// The timestamp-random fallback in node-identity.ts produces <base36>-<base36>
// where the left segment is Date.now().toString(36) (~8 chars) and the right
// segment is Math.random().toString(36).slice(2) (~10+ chars), so the shortest
// possible value is around 11 chars. We require at least 4 chars per segment
// to reject trivially spoofed IDs like "a-b" while remaining permissive enough
// for any realistic output of the fallback generator.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FALLBACK_ID_RE = /^[0-9a-z]{4,}-[0-9a-z]{4,}$/i;

function isValidNodeId(v: unknown): v is string {
  if (typeof v !== "string" || v.length > 64) return false;
  return UUID_RE.test(v) || FALLBACK_ID_RE.test(v);
}

// Session IDs come from generateSessionId() which uses alphanumeric nanoid-style output.
const SESSION_ID_RE = /^[a-z0-9]{6,32}$/i;

function isValidSessionId(v: unknown): v is string {
  return typeof v === "string" && SESSION_ID_RE.test(v);
}

// Nonces are 64 lowercase hex chars (32 bytes from crypto.getRandomValues).
const NONCE_RE = /^[0-9a-f]{64}$/;

function isValidNonce(v: unknown): v is string {
  return typeof v === "string" && NONCE_RE.test(v);
}

// ECDSA P-256 via WebCrypto uses IEEE P1363 format: r || s, each 32 bytes =
// 64 bytes total. base64(64 bytes) = 88 characters (padding included).
// We allow 84-92 to absorb any implementation variation (e.g. stripped padding).
const SIG_B64_RE = /^[A-Za-z0-9+/]+=*$/;

function isValidSignatureBase64(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.length >= 84 &&
    v.length <= 92 &&
    SIG_B64_RE.test(v)
  );
}

// P-256 JWK public key: kty="EC", crv="P-256", x and y are 43-char base64url
// strings (encoding exactly 32 bytes each). The private key field "d" must be
// absent: we never accept a private key from a peer.
const B64URL_43_RE = /^[A-Za-z0-9_-]{43}$/;

function isValidP256PublicJwk(v: unknown): v is JsonWebKey {
  if (typeof v !== "object" || v === null) return false;
  const k = v as Record<string, unknown>;
  return (
    k.kty === "EC" &&
    k.crv === "P-256" &&
    typeof k.x === "string" &&
    B64URL_43_RE.test(k.x) &&
    typeof k.y === "string" &&
    B64URL_43_RE.test(k.y) &&
    !("d" in k) // reject private keys
  );
}

const DEVICE_KINDS = ["phone", "tablet", "computer"] as const;
type DeviceKind = (typeof DEVICE_KINDS)[number];
const MAX_NICKNAME_LEN = 80;

// ---------------------------------------------------------------------------
// DataChannel message validators
// ---------------------------------------------------------------------------

export type ValidatedNodeHello = {
  t: "node-hello";
  /** Protocol version. Defaults to 1 for pre-versioning clients. */
  v: number;
  nodeId: string;
  publicKeyJwk: JsonWebKey;
  nickname: string;
  deviceKind: DeviceKind;
};

/**
 * Validates an incoming `node-hello` DataChannel message.
 * Returns the validated, normalised object or null on any validation failure.
 */
export function validateNodeHello(msg: unknown): ValidatedNodeHello | null {
  if (typeof msg !== "object" || msg === null) return null;
  const m = msg as Record<string, unknown>;
  if (m.t !== "node-hello") return null;
  // v is optional for backward compat with pre-versioning clients.
  if (m.v !== undefined && (typeof m.v !== "number" || !Number.isInteger(m.v) || m.v < 1)) {
    return null;
  }
  if (!isValidNodeId(m.nodeId)) return null;
  if (!isValidP256PublicJwk(m.publicKeyJwk)) return null;
  if (typeof m.nickname !== "string" || m.nickname.trim().length === 0) return null;
  const deviceKind: DeviceKind =
    typeof m.deviceKind === "string" &&
    (DEVICE_KINDS as readonly string[]).includes(m.deviceKind)
      ? (m.deviceKind as DeviceKind)
      : "computer";
  return {
    t: "node-hello",
    v: typeof m.v === "number" ? m.v : QB_PROTO_VERSION,
    nodeId: m.nodeId as string,
    publicKeyJwk: m.publicKeyJwk as JsonWebKey,
    nickname: m.nickname.trim().slice(0, MAX_NICKNAME_LEN),
    deviceKind,
  };
}

export type ValidatedNodeChallenge = {
  t: "node-challenge";
  nonce: string;
};

/**
 * Validates an incoming `node-challenge` DataChannel message.
 * The nonce must be exactly 64 lowercase hex chars (32 bytes).
 */
export function validateNodeChallenge(msg: unknown): ValidatedNodeChallenge | null {
  if (typeof msg !== "object" || msg === null) return null;
  const m = msg as Record<string, unknown>;
  if (m.t !== "node-challenge") return null;
  if (!isValidNonce(m.nonce)) return null;
  return { t: "node-challenge", nonce: m.nonce as string };
}

export type ValidatedNodeVerify = {
  t: "node-verify";
  nodeId: string;
  signature: string;
};

/**
 * Validates an incoming `node-verify` DataChannel message.
 * Signature must be base64-encoded P1363 ECDSA output (64 bytes = 88 chars).
 */
export function validateNodeVerify(msg: unknown): ValidatedNodeVerify | null {
  if (typeof msg !== "object" || msg === null) return null;
  const m = msg as Record<string, unknown>;
  if (m.t !== "node-verify") return null;
  if (!isValidNodeId(m.nodeId)) return null;
  if (!isValidSignatureBase64(m.signature)) return null;
  return {
    t: "node-verify",
    nodeId: m.nodeId as string,
    signature: m.signature as string,
  };
}

// ---------------------------------------------------------------------------
// Presence broadcast validators
// ---------------------------------------------------------------------------

export type ValidatedTrustedConnect = {
  fromNodeId: string;
  targetNodeId: string;
  sessionId: string;
};

/**
 * Validates an incoming `trusted-connect` presence broadcast payload.
 * All three fields are required. sessionId must match generateSessionId() output.
 */
export function validateTrustedConnect(payload: unknown): ValidatedTrustedConnect | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (!isValidNodeId(p.fromNodeId)) return null;
  if (!isValidNodeId(p.targetNodeId)) return null;
  if (!isValidSessionId(p.sessionId)) return null;
  return {
    fromNodeId: p.fromNodeId as string,
    targetNodeId: p.targetNodeId as string,
    sessionId: p.sessionId as string,
  };
}

// ---------------------------------------------------------------------------
// JWK comparison helper
// ---------------------------------------------------------------------------

/**
 * Returns true when two P-256 JWKs represent different public keys.
 * Compares only x and y (the public point on the curve); other fields are
 * metadata that do not affect the cryptographic identity.
 *
 * Used to detect the key-reset scenario: same nodeId, different public key
 * material, which almost always means the peer cleared their browser storage.
 */
export function p256JwksDiffer(a: JsonWebKey, b: JsonWebKey): boolean {
  return a.x !== b.x || a.y !== b.y;
}
