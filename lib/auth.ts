import crypto from "crypto";
import { cookies } from "next/headers";

// Simple single-password admin gate (per spec — no complex auth).
// The cookie stores an HMAC of the admin password so the raw password is
// never persisted client-side, and the value can't be forged without the env.

export const ADMIN_COOKIE = "kaemnur_admin";

function adminToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return crypto.createHmac("sha256", password).update("kaemnur-admin").digest("hex");
}

/** Constant-time string comparison that is safe against length mismatch. */
function safeEqual(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  return safeEqual(input, expected);
}

/** Both username and password must match the env-configured values. */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;
  // Evaluate both (no short-circuit) to avoid leaking which field was wrong.
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}

export function sessionToken(): string {
  return adminToken();
}

/** Server-side check used by admin layout / API routes. */
export function isAdminAuthed(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = adminToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
