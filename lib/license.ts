import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────
// License key generation — MUST stay byte-for-byte compatible with
// tools/keygen.js and the KaemDocs desktop app's licenseManager.
//
// Key format: KAEM-XXXX-XXXX-CCCC
//   KAEM  = fixed prefix
//   XXXX  = 4-char group from the unambiguous alphabet (×2)
//   CCCC  = first 4 hex chars (uppercase) of
//           HMAC-SHA256("KAEM-XXXX-XXXX", LICENSE_SECRET)
// ─────────────────────────────────────────────────────────────────────────

// Avoid visually ambiguous characters (0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Expected length of the canonical secret (32 chars).
// If @next/env's dotenv-expand mangles the value (e.g. strips $nR7qW4 because
// the .env is missing the \$ escape), the length drops to 25. Catching that
// here produces a clear error at startup rather than silently wrong keys.
const EXPECTED_SECRET_LENGTH = 32;

function getSecret(): string {
  // LICENSE_SECRET is the canonical name; LICENSE_HMAC_SECRET is an accepted
  // alias. BOTH must hold the exact same value as tools/keygen.js and the
  // KaemDocs desktop app, or generated keys will fail offline validation.
  const secret = process.env.LICENSE_SECRET ?? process.env.LICENSE_HMAC_SECRET;
  if (!secret) {
    throw new Error("LICENSE_SECRET (or LICENSE_HMAC_SECRET) is not set in .env");
  }
  if (secret.length !== EXPECTED_SECRET_LENGTH) {
    throw new Error(
      `LICENSE_SECRET has wrong length (${secret.length}, expected ${EXPECTED_SECRET_LENGTH}). ` +
      "Ensure the $ in the value is escaped as \\$ in .env so dotenv-expand does not strip it."
    );
  }
  return secret;
}

function randomGroup(len: number): string {
  const buf = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

function computeChecksum(p1: string, p2: string): string {
  const payload = `KAEM-${p1}-${p2}`;
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")
    .toUpperCase()
    .slice(0, 4);
}

export function generateLicenseKey(): string {
  const p1 = randomGroup(4);
  const p2 = randomGroup(4);
  const c = computeChecksum(p1, p2);
  return `KAEM-${p1}-${p2}-${c}`;
}

/** Verify a key's checksum locally (same logic the desktop app uses). */
export function verifyLicenseKey(key: string): boolean {
  const match = /^KAEM-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-F0-9]{4})$/.exec(
    key.trim().toUpperCase()
  );
  if (!match) return false;
  const [, p1, p2, checksum] = match;
  return computeChecksum(p1, p2) === checksum;
}

/**
 * Mask a key for display in the admin table: keep prefix + first group,
 * hide the rest. "KAEM- AB CD-EFGH-1A2B" → "KAEM-ABCD-****-****".
 */
export function maskLicenseKey(key: string): string {
  const parts = key.split("-");
  if (parts.length !== 4) return key;
  return `${parts[0]}-${parts[1]}-****-****`;
}
