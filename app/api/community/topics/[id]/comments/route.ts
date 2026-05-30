import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/community/topics/[id]/comments
// Regular comments require a Supabase session.
// Admin replies bypass this via adminSecret (localStorage token).
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { body: text, adminSecret } = body;

  if (!text || text.trim().length < 1)
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 422 });

  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    select: { id: true, title: true },
  });
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  // ── Admin path: validate adminSecret, bypass session check ──────────
  if (typeof adminSecret === "string" && adminSecret.length > 0) {
    const isAdmin = adminSecret === sessionToken();
    if (!isAdmin) {
      return NextResponse.json({ error: "Invalid admin token." }, { status: 401 });
    }
    const comment = await prisma.comment.create({
      data: { topicId: params.id, body: text.trim(), authorName: "Kaemnur Team", isAdmin: true },
    });
    await prisma.notification.create({
      data: { type: "new_comment", topicId: params.id, message: `Kaemnur Team replied in: "${topic.title}"` },
    });
    return NextResponse.json(comment, { status: 201 });
  }

  // ── Regular comment: must have a valid Supabase session ─────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  // Resolve authorName from session
  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  // Ensure UserProfile exists
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

  const comment = await prisma.comment.create({
    data: {
      topicId: params.id,
      body: text.trim(),
      authorName: displayName,
      isAdmin: false,
      userId: user.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "new_comment",
      topicId: params.id,
      message: `${displayName} replied in: "${topic.title}"`,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
