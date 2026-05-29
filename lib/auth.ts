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

export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  // constant-time compare
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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
