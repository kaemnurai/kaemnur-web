import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products/[slug]/reviews
// ?userId=<uid>   → return the single rating for that user (for ReviewForm pre-fill)
// (no params)     → return all ratings with user profiles for ReviewList
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = req.nextUrl.searchParams.get("userId");

  if (userId) {
    // Single user lookup — used by ReviewForm to pre-fill existing review
    const rating = await prisma.productRating.findUnique({
      where: { productId_userId: { productId: product.id, userId } },
    });
    return NextResponse.json(rating ?? null);
  }

  // All reviews, newest first, with user profile
  const ratings = await prisma.productRating.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(ratings);
}
