import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/products/[slug]/rate
// Body: { rating: 1-5, reviewText?: string (max 500 chars) }
// Requires an authenticated Supabase session. Upserts one rating per user per product.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required to rate." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const rating = Number(body?.rating);
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be an integer 1–5." }, { status: 400 });
  }

  const rawReview = typeof body?.reviewText === "string" ? body.reviewText.trim() : "";
  const reviewText = rawReview.slice(0, 500) || null; // enforce max 500

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Ensure UserProfile exists
  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      displayName: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    update: {},
  });

  const createData: Prisma.ProductRatingUncheckedCreateInput = {
    productId: product.id,
    userId: user.id,
    rating,
    reviewText,
  };
  const updateData: Prisma.ProductRatingUncheckedUpdateInput = {
    rating,
    reviewText,
  };

  const upserted = await prisma.productRating.upsert({
    where: { productId_userId: { productId: product.id, userId: user.id } },
    create: createData,
    update: updateData,
    include: { user: { select: { displayName: true, avatarUrl: true } } },
  });

  const agg = await prisma.productRating.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return NextResponse.json({
    userRating: upserted.rating,
    userReviewText: upserted.reviewText ?? null,
    average: agg._avg.rating ?? null,
    count: agg._count.rating,
  });
}
