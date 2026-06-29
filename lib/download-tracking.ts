import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import type { Platform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Derive a privacy-preserving, salted hash of the client IP. We never store the
// raw address — only a truncated SHA-256 so repeat downloads can be grouped
// without being personally identifiable.
function hashIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  if (!ip) return null;
  const salt = process.env.LICENSE_SECRET ?? "kaemnur";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

// Record a single REAL download event (one click → one row) and keep the
// denormalized Product.downloadCount in lockstep. This is the only place that
// increments the counter, so downloadCount always equals COUNT(DownloadLog).
export async function recordDownloadEvent(
  req: NextRequest,
  { productId, installerId, platform }: { productId: string; installerId: string; platform: Platform }
): Promise<void> {
  // Best-effort auth — never blocks the download.
  let userId: string | null = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* anonymous download */
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 255) ?? null;
  const ipHash = hashIp(req);

  await prisma.$transaction([
    prisma.downloadLog.create({
      data: { productId, installerId, platform, userId, userAgent, ipHash },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { downloadCount: { increment: 1 } },
    }),
  ]);
}
