import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

// GET /api/community/topics?category=&page=
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || "1"));

  const where = category ? { category } : undefined;

  const [total, topics] = await Promise.all([
    prisma.topic.count({ where }),
    prisma.topic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { comments: true } },
        mentionedProducts: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return NextResponse.json({
    topics: topics.map((t) => ({
      ...t,
      bodyPreview: t.body.slice(0, 120) + (t.body.length > 120 ? "…" : ""),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.ceil(total / PAGE_SIZE),
  });
}

// POST /api/community/topics
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { title, body: text, authorName, category, productIds = [] } = body;

  if (!title || title.trim().length < 5)
    return NextResponse.json({ error: "Title must be at least 5 characters." }, { status: 422 });
  if (!text || text.trim().length < 10)
    return NextResponse.json({ error: "Description must be at least 10 characters." }, { status: 422 });
  if (!authorName || authorName.trim().length < 2)
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 422 });

  const validCategory = ["General", "Questions", "Bug Reports", "Suggestions"].includes(category)
    ? category
    : "General";

  // Validate productIds exist
  const products = Array.isArray(productIds) && productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];

  const topic = await prisma.topic.create({
    data: {
      title: title.trim(),
      body: text.trim(),
      authorName: authorName.trim(),
      category: validCategory,
      mentionedProducts: products.length > 0 ? { connect: products.map((p) => ({ id: p.id })) } : undefined,
    },
    include: { mentionedProducts: { select: { id: true, name: true, slug: true } } },
  });

  // Create notifications
  type NotifInput = { type: string; topicId: string; message: string };
  const notifs: NotifInput[] = [
    { type: "new_topic", topicId: topic.id, message: `${authorName.trim()} started: "${title.trim()}"` },
    ...products.map((p) => ({
      type: "product_mention",
      topicId: topic.id,
      message: `${authorName.trim()} mentioned ${p.name} in: "${title.trim()}"`,
    })),
  ];
  await prisma.notification.createMany({ data: notifs });

  return NextResponse.json(topic, { status: 201 });
}
