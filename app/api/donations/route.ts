import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/donations — trakteer link + approved donations leaderboard (top 10).
export async function GET() {
  const [settings, donations] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "singleton" }, select: { trakteerUrl: true } }),
    prisma.donation.findMany({
      where: { isApproved: true },
      orderBy: { amount: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    trakteerUrl: settings?.trakteerUrl ?? null,
    donations: donations.map((d) => ({
      id: d.id,
      donorName: d.donorName,
      amount: d.amount,
      message: d.message,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}
