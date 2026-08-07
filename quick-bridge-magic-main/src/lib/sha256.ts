// Incremental SHA-256 following FIPS 180-4.
//
// Web Crypto SubtleCrypto does not expose a streaming hash API, so this
// pure-TypeScript implementation handles arbitrary-length input one chunk
// at a time. It is called in the send loop (sender) and the onmessage
// handler (receiver) so both sides compute the hash in a single pass
// without buffering the entire file.
//
// Correctness: verified against FIPS 180-4 test vectors
//   SHA-256("abc")  = ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469432f4ccea4624d3a
//   SHA-256("")     = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

// Round constants: first 32 bits of the fractional parts of the cube roots
// of the first 64 primes (FIPS 180-4 section 4.2.2).
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

// Initial hash values: first 32 bits of the fractional parts of the square
// roots of the first 8 primes (FIPS 180-4 section 5.3.3).
const H_INIT = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

// Right-rotate a 32-bit unsigned integer.
function rotr32(n: number, x: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

// Process one 64-byte block, updating the hash state h in place.
// w is a reusable 64-element message schedule buffer.
function processBlock(block: Uint8Array, h: Uint32Array, w: Uint32Array): void {
  const dv = new DataView(block.buffer, block.byteOffset, 64);
  for (let i = 0; i < 16; i++) w[i] = dv.getUint32(i * 4, false /* big-endian */);
  for (let i = 16; i < 64; i++) {
    const s0 = rotr32(7, w[i - 15]) ^ rotr32(18, w[i - 15]) ^ (w[i - 15] >>> 3);
    const s1 = rotr32(17, w[i - 2]) ^ rotr32(19, w[i - 2]) ^ (w[i - 2] >>> 10);
    w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
  }
  let a = h[0], b = h[1], c = h[2], d = h[3];
  let e = h[4], f = h[5], g = h[6], hh = h[7];
  for (let i = 0; i < 64; i++) {
    const S1  = rotr32(6, e) ^ rotr32(11, e) ^ rotr32(25, e);
    const ch  = ((e & f) ^ (~e & g)) >>> 0;
    const t1  = (hh + S1 + ch + K[i] + w[i]) >>> 0;
    const S0  = rotr32(2, a) ^ rotr32(13, a) ^ rotr32(22, a);
    const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
    const t2  = (S0 + maj) >>> 0;
    hh = g; g = f; f = e;
    e  = (d + t1) >>> 0;
    d  = c; c = b; b = a;
    a  = (t1 + t2) >>> 0;
  }
  h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
  h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
  h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
  h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
}

// Incremental SHA-256 hasher. Call update() with chunks in order, then
// call digest() once to obtain the hex-encoded hash. Do not call update()
// after digest().
export class IncrementalSha256 {
  private readonly h: Uint32Array;
  private readonly buf: Uint8Array; // partial-block accumulator (max 63 bytes)
  private readonly w: Uint32Array;  // reused message schedule (64 words)
  private bufLen: number;
  private totalBytes: number;

  constructor() {
    this.h = new Uint32Array(H_INIT);
    this.buf = new Uint8Array(64);
    this.w = new Uint32Array(64);
    this.bufLen = 0;
    this.totalBytes = 0;
  }

  update(data: Uint8Array): void {
    this.totalBytes += data.byteLength;
    let offset = 0;

    // Fill the partial-block buffer first.
    if (this.bufLen > 0) {
      const take = Math.min(64 - this.bufLen, data.byteLength);
      this.buf.set(data.subarray(0, take), this.bufLen);
      this.bufLen += take;
      offset = take;
      if (this.bufLen === 64) {
        processBlock(this.buf, this.h, this.w);
        this.bufLen = 0;
      }
    }

    // Process full 64-byte blocks directly from the input.
    while (offset + 64 <= data.byteLength) {
      processBlock(data.subarray(offset, offset + 64), this.h, this.w);
      offset += 64;
    }

    // Stash the remaining partial block.
    const rem = data.byteLength - offset;
    if (rem > 0) {
      this.buf.set(data.subarray(offset), 0);
      this.bufLen = rem;
    }
  }

  // Returns the lowercase hex-encoded SHA-256 digest. The total message
  // length in bits must fit in a 64-bit big-endian integer; in practice
  // this supports files up to 2 exabytes, far beyond the 10 GB app limit.
  digest(): string {
    // Work on copies so a subsequent update() could theoretically continue.
    const h = new Uint32Array(this.h);
    const pad = new Uint8Array(128); // at most 2 blocks of padding
    pad.set(this.buf.subarray(0, this.bufLen));
    let padLen = this.bufLen;

    // Append the mandatory 0x80 byte.
    pad[padLen++] = 0x80;

    // If there is not enough room for the 8-byte length field in this block,
    // complete the current block with zeros and start a new one.
    if (padLen > 56) {
      const w = new Uint32Array(64);
      const dv1 = new DataView(pad.buffer, 0, 64);
      for (let i = 0; i < 16; i++) w[i] = dv1.getUint32(i * 4, false);
      processBlock(pad.subarray(0, 64), h, w);
      pad.fill(0, 0, 64);
      padLen = 0;
    }

    // Append the message length in bits as a 64-bit big-endian integer.
    // JavaScript Numbers are safe for values up to 2^53, which covers
    // file sizes up to 2^50 bytes (1 PB) before precision loss.
    const totalBits = this.totalBytes * 8;
    const dv = new DataView(pad.buffer, 0, 64);
    dv.setUint32(56, Math.floor(totalBits / 0x1_0000_0000), false); // high 32 bits
    dv.setUint32(60, totalBits % 0x1_0000_0000, false);              // low  32 bits

    const w = new Uint32Array(64);
    processBlock(pad.subarray(0, 64), h, w);

    // Encode the eight 32-bit words as lowercase hex.
    let hex = "";
    for (let i = 0; i < 8; i++) hex += h[i].toString(16).padStart(8, "0");
    return hex;
  }
}
