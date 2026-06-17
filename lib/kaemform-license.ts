import { prisma } from "@/lib/prisma";

export type KaemFormLicenseType = "free" | "trial" | "pro";

export interface KaemFormLicenseInfo {
  type: KaemFormLicenseType;
  expiresAt: Date | null;
  trialClaimed: boolean;
}

const FREE: KaemFormLicenseInfo = { type: "free", expiresAt: null, trialClaimed: false };

/**
 * Derive a user's KaemForm license type from the existing `License` table
 * (no `type`/`metadata` columns exist) — same rules as
 * supabase/functions/_shared/license.ts:
 *  - newest "kaemform" row, not expired, isActivated=true  -> pro
 *  - newest "kaemform" row, not expired, isActivated=false -> trial
 *  - otherwise                                              -> free
 */
export async function getKaemformLicenseInfo(
  productId: string,
  userId: string
): Promise<KaemFormLicenseInfo> {
  const license = await prisma.license.findFirst({
    where: { productId, userId },
    orderBy: { createdAt: "desc" },
  });
  if (!license) return FREE;

  const active = license.expiresAt === null || license.expiresAt > new Date();
  if (!active) return { type: "free", expiresAt: null, trialClaimed: true };

  return {
    type: license.isActivated ? "pro" : "trial",
    expiresAt: license.expiresAt,
    trialClaimed: true,
  };
}
