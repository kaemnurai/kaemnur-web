import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

// GET /api/community/topics?category=&page= — public
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || "1"));

  const where = category ? { category } : undefined;

  const [total, topics] = await Promise.all([
    prisma.topic.count({ where }),
    prisma.topic.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { comments: true } },
        mentionedProducts: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  const res = NextResponse.json({
    topics: topics.map((t) => ({
      ...t,
      bodyPreview: t.body.slice(0, 120) + (t.body.length > 120 ? "…" : ""),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.ceil(total / PAGE_SIZE),
  });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res;
}

// POST /api/community/topics — requires Supabase session
export async function POST(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        // POST route — we read cookies but don't need to set them
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { title, body: text, category, productIds = [] } = body;

  if (!title || title.trim().length < 5)
    return NextResponse.json({ error: "Title must be at least 5 characters." }, { status: 422 });
  if (!text || text.trim().length < 10)
    return NextResponse.json({ error: "Description must be at least 10 characters." }, { status: 422 });

  // Resolve authorName from session — never trust client-supplied name
  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  const validCategory = ["General", "Questions", "Bug Reports", "Suggestions"].includes(category)
    ? category
    : "General";

  const products =
    Array.isArray(productIds) && productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];

  // Ensure UserProfile row exists (lazy-create for users who sign up without OAuth callback)
  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      displayName,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    update: {},
  });

  const topic = await prisma.topic.create({
    data: {
      title: title.trim(),
      body: text.trim(),
      authorName: displayName,
      category: validCategory,
      userId: user.id,
      mentionedProducts:
        products.length > 0
          ? { connect: products.map((p) => ({ id: p.id })) }
          : undefined,
    },
    include: { mentionedProducts: { select: { id: true, name: true, slug: true } } },
  });

  type NotifInput = { type: string; topicId: string; message: string };
  const notifs: NotifInput[] = [
    { type: "new_topic", topicId: topic.id, message: `${displayName} started: "${title.trim()}"` },
    ...products.map((p) => ({
      type: "product_mention",
      topicId: topic.id,
      message: `${displayName} mentioned ${p.name} in: "${title.trim()}"`,
    })),
  ];
  await prisma.notification.createMany({ data: notifs });

  return NextResponse.json(topic, { status: 201 });
}
