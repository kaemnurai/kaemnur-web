import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/products/[id]/ratings — list all ratings for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ratings = await prisma.productRating.findMany({
    where: { productId: params.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { displayName: true, email: true } } },
  });

  const agg = await prisma.productRating.aggregate({
    where: { productId: params.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { ratingOverride: true },
  });

  return NextResponse.json({
    ratings,
    average: agg._avg.rating ?? null,
    count: agg._count.rating,
    ratingOverride: product?.ratingOverride ?? null,
  });
}

// PATCH /api/admin/products/[id]/ratings — set or clear ratingOverride
// Body: { ratingOverride: 4.5 } or { ratingOverride: null }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const override = body?.ratingOverride;

  const ratingOverride =
    override === null || override === undefined
      ? null
      : Math.min(5, Math.max(1, Number(override)));

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { ratingOverride: ratingOverride ?? null },
    select: { ratingOverride: true },
  });

  return NextResponse.json({ ratingOverride: updated.ratingOverride });
}
