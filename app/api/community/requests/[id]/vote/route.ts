import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/community/requests/[id]/vote — toggle the current user's vote.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";
  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email ?? null, displayName, avatarUrl: user.user_metadata?.avatar_url ?? null },
    update: {},
  });

  const request = await prisma.appRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "Request tidak ditemukan." }, { status: 404 });

  const existing = await prisma.appRequestVote.findUnique({
    where: { appRequestId_userId: { appRequestId: params.id, userId: user.id } },
  });

  let voted: boolean;
  if (existing) {
    await prisma.appRequestVote.delete({ where: { id: existing.id } });
    voted = false;
  } else {
    await prisma.appRequestVote.create({ data: { appRequestId: params.id, userId: user.id } });
    voted = true;
  }

  const voteCount = await prisma.appRequestVote.count({ where: { appRequestId: params.id } });
  await prisma.appRequest.update({ where: { id: params.id }, data: { voteCount } });

  return NextResponse.json({ voted, voteCount });
}
