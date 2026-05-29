import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products/search?q=query
// Returns lightweight list for search dropdown (name, slug, category, pricing)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const results = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { tagline: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
    select: {
      name: true,
      slug: true,
      category: true,
      priceFree: true,
      priceLabel: true,
      screenshots: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(results);
}
