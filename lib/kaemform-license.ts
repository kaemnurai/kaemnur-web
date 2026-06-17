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
 *  - newest "kaemform" row, not expired, paid order       -> pro
 *  - newest "kaemform" row, not expired, isActivated=true -> pro
 *  - newest "kaemform" row, not expired, otherwise        -> trial
 *  - otherwise                                              -> free
 */
export async function getKaemformLicenseInfo(
  productId: string,
  userId: string
): Promise<KaemFormLicenseInfo> {
  const license = await prisma.license.findFirst({
    where: { productId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      isActivated: true,
      expiresAt: true,
      order: { select: { status: true } },
    },
  });
  if (!license) return FREE;

  const active = license.expiresAt === null || license.expiresAt > new Date();
  if (!active) return { type: "free", expiresAt: null, trialClaimed: true };

  const paidProOrder = license.order?.status === "SUDAH_DIBAYAR";

  return {
    type: paidProOrder || license.isActivated ? "pro" : "trial",
    expiresAt: license.expiresAt,
    trialClaimed: true,
  };
}
