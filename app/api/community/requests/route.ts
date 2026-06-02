import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/community/requests?sort=popular|new
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sort = req.nextUrl.searchParams.get("sort");
  const orderBy: Prisma.AppRequestOrderByWithRelationInput[] =
    sort === "new"
      ? [{ createdAt: "desc" }]
      : [{ voteCount: "desc" }, { createdAt: "desc" }];

  const requests = await prisma.appRequest.findMany({
    orderBy,
    include: { user: { select: { displayName: true } } },
  });

  const releasedIds = requests
    .map((r) => r.releasedProductId)
    .filter((x): x is string => Boolean(x));
  const products = releasedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: releasedIds } },
        select: { id: true, slug: true, name: true },
      })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  let votedIds = new Set<string>();
  if (user) {
    const votes = await prisma.appRequestVote.findMany({
      where: { userId: user.id, appRequestId: { in: requests.map((r) => r.id) } },
      select: { appRequestId: true },
    });
    votedIds = new Set(votes.map((v) => v.appRequestId));
  }

  return NextResponse.json(
    requests.map((r) => {
      const p = r.releasedProductId ? productMap.get(r.releasedProductId) : null;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        voteCount: r.voteCount,
        voted: votedIds.has(r.id),
        authorName: r.user.displayName ?? "User",
        createdAt: r.createdAt.toISOString(),
        releasedProductSlug: p?.slug ?? null,
        releasedProductName: p?.name ?? null,
      };
    })
  );
}
