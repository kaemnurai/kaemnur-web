import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pseudoViews } from "@/lib/community";

export const dynamic = "force-dynamic";

// GET /api/community/stats — aggregate community metrics + top contributors.
export async function GET() {
  const [topics, commentCount, members, topicAuthors, commentAuthors] =
    await Promise.all([
      prisma.topic.findMany({
        select: { id: true, _count: { select: { comments: true } } },
      }),
      prisma.comment.count(),
      prisma.userProfile.count(),
      prisma.topic.groupBy({ by: ["authorName"], _count: { _all: true } }),
      prisma.comment.groupBy({ by: ["authorName"], _count: { _all: true } }),
    ]);

  const totalViews = topics.reduce(
    (sum, t) => sum + pseudoViews(t.id, t._count.comments),
    0
  );

  // Merge topic + comment authorship into a single "posts" tally per user.
  const tally = new Map<string, number>();
  for (const a of topicAuthors) {
    tally.set(a.authorName, (tally.get(a.authorName) ?? 0) + a._count._all);
  }
  for (const a of commentAuthors) {
    tally.set(a.authorName, (tally.get(a.authorName) ?? 0) + a._count._all);
  }
  const contributors = Array.from(tally.entries())
    .map(([name, posts]) => ({ name, posts }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 5);

  const res = NextResponse.json({
    topics: topics.length,
    members,
    posts: topics.length + commentCount,
    views: totalViews,
    contributors,
  });
  res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res;
}
