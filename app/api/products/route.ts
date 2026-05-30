import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public: list products (lightweight) for any external consumer.
export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      category: true,
      version: true,
      isFeatured: true,
      downloadCount: true,
      createdAt: true,
    },
  });
  const res = NextResponse.json(products);
  res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res;
}
