import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/community/topics/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { body: text, authorName, adminSecret } = body;

  if (!text || text.trim().length < 1)
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 422 });
  if (!authorName || authorName.trim().length < 2)
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 422 });

  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    select: { id: true, title: true },
  });
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  // Validate admin
  const isAdmin = typeof adminSecret === "string" && adminSecret === sessionToken();

  const comment = await prisma.comment.create({
    data: {
      topicId: params.id,
      body: text.trim(),
      authorName: isAdmin ? "Kaemnur Team" : authorName.trim(),
      isAdmin,
    },
  });

  // Notify
  await prisma.notification.create({
    data: {
      type: "new_comment",
      topicId: params.id,
      message: `${comment.authorName} replied in: "${topic.title}"`,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
