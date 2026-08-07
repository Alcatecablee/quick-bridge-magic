// Node identity for Phase 2 Trusted Devices.
//
// Each browser gets a stable ECDSA P-256 keypair generated once on first use
// and stored non-extractably in QuickBridgeDB. The private key never leaves
// the browser's secure key storage; the public key is shared as a JWK during
// session DataChannel handshakes so peers can verify future challenge responses.
//
// ECDSA P-256 is used rather than Ed25519 because P-256 has been in the Web
// Crypto spec since its first release (2014) and is guaranteed to be present
// in every browser that supports RTCPeerConnection. Ed25519 was only added to
// Web Crypto in Chrome 113 / Firefox 130 / Safari 17 and we want to avoid
// silent fallbacks on older devices in the field.
//
// The nodeId is a stable UUID stored in localStorage as a lightweight bootstrap
// pointer. The cryptographic material lives in IDB only.

import { openQbDb, IDENTITY_STORE } from "./qb-db";
import { readString, writeString, StorageKeys } from "./storage";
import type { DeviceKind } from "./device";

// Algorithm constants. Centralised here so sign/verify always agree.
const KEY_ALGO: EcKeyGenParams = { name: "ECDSA", namedCurve: "P-256" };
const SIGN_ALGO: EcdsaParams = { name: "ECDSA", hash: { name: "SHA-256" } };

// Internal record persisted in the identity object store.
type StoredIdentity = {
  id: "self";
  nodeId: string;
  // Non-extractable CryptoKey objects are structured-cloneable so they can be
  // stored directly in IndexedDB without ever leaving as raw bytes.
  privateKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
  createdAt: number;
};

// Public surface used by the rest of the app.
export type NodeIdentity = {
  nodeId: string;
  publicKeyJwk: JsonWebKey;
  createdAt: number;
};

// The data each device broadcasts when a DataChannel opens.
export type NodeHello = {
  nodeId: string;
  publicKeyJwk: JsonWebKey;
  nickname: string;
  deviceKind: DeviceKind;
};

// Module-level cache: after the first IDB read the identity is held in memory
// for the lifetime of the tab. This avoids repeated IDB round-trips on every
// DataChannel open and keeps the sign() path synchronous after first load.
let _cache: StoredIdentity | null = null;

// In-flight promise singleton: if multiple callers race to loadOrCreate before
// the first IDB write completes, they all wait on the same promise instead of
// each generating their own fresh keypair (which would leave the IDB in an
// inconsistent state with the one that actually won the write race).
let _inFlight: Promise<StoredIdentity> | null = null;

async function _doLoadOrCreate(): Promise<StoredIdentity> {
  if (_cache) return _cache;

  const db = await openQbDb();

  return new Promise<StoredIdentity>((resolve, reject) => {
    const tx = db.transaction(IDENTITY_STORE, "readwrite");
    // Reject on transaction-level failures (e.g. unexpected abort, quota
    // exceeded mid-read) in addition to request-level errors. Without these
    // handlers a transaction abort can leave the promise pending indefinitely.
    tx.onerror = () => reject(tx.error ?? new Error("Identity transaction error"));
    tx.onabort = () =>
      reject(tx.error ?? new DOMException("Identity transaction aborted", "AbortError"));

    const store = tx.objectStore(IDENTITY_STORE);
    const getReq = store.get("self");

    getReq.onsuccess = async () => {
      // Happy path: existing identity found.
      if (getReq.result) {
        _cache = getReq.result as StoredIdentity;
        resolve(_cache);
        return;
      }

      // First use: generate a new keypair and nodeId.
      try {
        const keyPair = await crypto.subtle.generateKey(
          KEY_ALGO,
          false, // non-extractable: private key cannot be exported as bytes
          ["sign", "verify"],
        );

        const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

        // Reuse an existing nodeId from localStorage if present (e.g. when the
        // user clears site data but not localStorage, or on a fresh IDB after a
        // browser profile reset). This keeps the nodeId stable across the common
        // case while still generating fresh cryptographic material.
        //
        // Validation: accept crypto.randomUUID() output (xxxxxxxx-xxxx-...) or
        // the timestamp-random fallback ("<base36>-<base36>"). Reject anything
        // that does not match these patterns — corrupted values (e.g. control
        // characters, paths, emoji) would be embedded in Supabase channel topic
        // strings and could cause unexpected channel naming collisions or rejections.
        const UUID_RE_LOCAL =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const FALLBACK_ID_RE_LOCAL = /^[0-9a-z]{4,}-[0-9a-z]{4,}$/i;
        // Initialize as string (not string | null) so TypeScript narrows
        // correctly after the validation block below. An empty string fails
        // the length check, so a null return from readString is handled.
        let nodeId: string = readString(StorageKeys.nodeId) ?? "";
        const nodeIdValid =
          nodeId.length >= 8 &&
          nodeId.length <= 64 &&
          (UUID_RE_LOCAL.test(nodeId) || FALLBACK_ID_RE_LOCAL.test(nodeId));
        if (!nodeIdValid) {
          nodeId =
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
          try {
            writeString(StorageKeys.nodeId, nodeId);
          } catch {
            // localStorage unavailable (quota exceeded, private browsing policy,
            // or browser security restriction). The nodeId is still valid for
            // this session; it just won't survive a page reload. This is a
            // graceful degradation — the user can still pair via QR/PIN.
          }
        }

        const record: StoredIdentity = {
          id: "self",
          nodeId,
          privateKey: keyPair.privateKey,
          publicKeyJwk,
          createdAt: Date.now(),
        };

        // Use a fresh read-write transaction; the outer one may have been
        // committed already if the getReq callback ran in a new microtask.
        const writeTx = db.transaction(IDENTITY_STORE, "readwrite");
        writeTx.objectStore(IDENTITY_STORE).put(record);
        // Resolve/reject on the transaction boundary rather than on the put
        // request's onsuccess. A storage-quota rollback fires after putReq.onsuccess
        // but before tx commit, which would otherwise falsely resolve the promise
        // and cache a record that was never actually written. The next page reload
        // would find an empty store, generate a fresh keypair, and break the
        // ECDSA challenge-response for all stored trusted peers.
        // This is the same pattern used in trusted-nodes-db.ts (upsertTrustedNode).
        writeTx.oncomplete = () => {
          _cache = record;
          resolve(record);
        };
        writeTx.onerror = () => reject(writeTx.error);
        writeTx.onabort = () =>
          reject(writeTx.error ?? new DOMException("Transaction aborted", "AbortError"));
      } catch (err) {
        reject(err);
      }
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

// Singleton gateway: all callers share one in-flight promise so concurrent
// first calls cannot each generate a separate keypair and race to write IDB.
async function loadOrCreate(): Promise<StoredIdentity> {
  if (_cache) return _cache;
  if (_inFlight) return _inFlight;
  _inFlight = _doLoadOrCreate().finally(() => {
    _inFlight = null;
  });
  return _inFlight;
}

// Returns the public-facing identity (no private key). Creates it on first
// call. Subsequent calls resolve from the in-memory cache with no IDB I/O.
export async function getOrCreateNodeIdentity(): Promise<NodeIdentity> {
  const stored = await loadOrCreate();
  return {
    nodeId: stored.nodeId,
    publicKeyJwk: stored.publicKeyJwk,
    createdAt: stored.createdAt,
  };
}

// Signs a challenge nonce with the local private key.
// The nonce is UTF-8 encoded before signing so both sides agree on the bytes.
// Returns a base64-encoded DER-format ECDSA signature.
export async function signChallenge(nonce: string): Promise<string> {
  const stored = await loadOrCreate();
  const data = new TextEncoder().encode(`qb-challenge:${nonce}`);
  const sigBuf = await crypto.subtle.sign(SIGN_ALGO, stored.privateKey, data);
  // Convert to base64 without using Buffer (not available in browser runtimes).
  // Use a loop instead of the spread-into-String.fromCharCode pattern: the
  // spread form pushes every byte as a separate argument and would throw
  // "Maximum call stack size exceeded" if sigBuf were ever larger than ~65 KB.
  // P-256 ECDSA always produces 64 bytes today, but the loop is unconditionally
  // safe and costs nothing.
  const bytes = new Uint8Array(sigBuf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// Verifies a peer's ECDSA signature against their public key.
// Returns true only when the signature is cryptographically valid.
// Any error (malformed key, bad base64, wrong curve) returns false rather
// than throwing so callers can treat it uniformly as "verification failed".
export async function verifyChallenge(
  nonce: string,
  signatureBase64: string,
  peerPublicKeyJwk: JsonWebKey,
): Promise<boolean> {
  try {
    const peerPublicKey = await crypto.subtle.importKey(
      "jwk",
      peerPublicKeyJwk,
      KEY_ALGO,
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`qb-challenge:${nonce}`);
    const sigBytes = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify(SIGN_ALGO, peerPublicKey, sigBytes, data);
  } catch {
    return false;
  }
}

// Generates a 32-byte cryptographically random hex nonce.
// Used by the session initiator (host) when challenging a trusted peer.
export function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Wipes the in-memory cache. Useful in tests or when the user explicitly
// clears their identity. Does not delete the IDB record.
export function clearNodeIdentityCache(): void {
  _cache = null;
}
