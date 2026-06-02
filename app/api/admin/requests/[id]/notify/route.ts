import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/requests/[id]/notify — notify all voters that it released.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.appRequest.findUnique({
    where: { id: params.id },
    include: { votes: { select: { userId: true } } },
  });
  if (!request) return NextResponse.json({ error: "Request tidak ditemukan." }, { status: 404 });

  let link: string | null = null;
  if (request.releasedProductId) {
    const product = await prisma.product.findUnique({
      where: { id: request.releasedProductId },
      select: { slug: true },
    });
    link = product ? `/products/${product.slug}` : null;
  }

  const message = `Aplikasi yang Anda request '${request.title}' sudah rilis! Lihat sekarang.`;
  const voterIds = Array.from(new Set(request.votes.map((v) => v.userId)));

  if (voterIds.length > 0) {
    await prisma.notification.createMany({
      data: voterIds.map((userId) => ({ type: "request_released", userId, message, link })),
    });
  }

  return NextResponse.json({ notified: voterIds.length });
}
