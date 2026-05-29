import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/community/topics/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    include: {
      mentionedProducts: { select: { id: true, name: true, slug: true } },
      comments: { orderBy: { createdAt: "asc" } },
      _count: { select: { comments: true } },
    },
  });

  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(topic);
}
