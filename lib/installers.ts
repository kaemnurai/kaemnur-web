import type { Platform } from "@prisma/client";

const SHA256_RE = /^[a-f0-9]{64}$/i;
const PLATFORMS: Platform[] = ["WINDOWS", "MAC", "LINUX"];

export function isValidSha256(value: string): boolean {
  return SHA256_RE.test(value.trim());
}

export function isValidPlatform(value: string): value is Platform {
  return (PLATFORMS as string[]).includes(value.toUpperCase());
}

export function normalizeSha256(value: string): string {
  return value.trim().toLowerCase();
}

// Canonical ordering for "which installer is the latest" — newest upload wins.
// Used by the update-check endpoint, the public download buttons and the admin
// release list so every surface agrees on the same release.
export const LATEST_INSTALLER_ORDER = { createdAt: "desc" as const };

// Given a list of installers already sorted newest-first (LATEST_INSTALLER_ORDER),
// return only the latest installer for each platform. Pure/isomorphic so it can
// run in both server and client components.
export function pickLatestPerPlatform<T extends { platform: Platform }>(installers: T[]): T[] {
  const byPlatform = new Map<Platform, T>();
  for (const inst of installers) {
    if (!byPlatform.has(inst.platform)) byPlatform.set(inst.platform, inst);
  }
  return Array.from(byPlatform.values());
}
