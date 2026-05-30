import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { CommentForm } from "@/components/community/CommentForm";
import { AdminReplyForm } from "@/components/community/AdminReplyForm";
import { AdminDeleteComment, AdminDeleteTopic } from "@/components/community/AdminDeleteControls";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

export const dynamic = "force-dynamic";

function relativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const topic = await prisma.topic.findUnique({ where: { id: params.id }, select: { title: true } });
  if (!topic) return { title: "Not found" };
  return { title: `${topic.title} — Community` };
}

export default async function TopicPage({ params }: { params: { id: string } }) {
  const [topic, recentTopics] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: params.id },
      include: {
        mentionedProducts: { select: { id: true, name: true, slug: true } },
        comments: { orderBy: { createdAt: "asc" } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.topic.findMany({
      where: { id: { not: params.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { comments: true } } },
    }),
  ]);

  if (!topic) notFound();

  const avatarBg = getAvatarColor(topic.authorName);
  const avatarFg = getAvatarTextColor(avatarBg);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-fg-sub">
        <Link href="/community" className="hover:text-fg">Community</Link>
        <Icon name="chevron-right" size={12} className="text-fg-muted" />
        <span className="text-fg-sub">{topic.category}</span>
        <Icon name="chevron-right" size={12} className="text-fg-muted" />
        <span className="max-w-xs truncate text-fg">{topic.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Left column */}
        <div className="min-w-0 space-y-4">
          {/* Original post */}
          <div className="rounded-card border border-line bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded text-[15px] font-bold" style={{ backgroundColor: avatarBg, color: avatarFg }}>
                {getInitial(topic.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-fg">{topic.authorName}</span>
                  <span className="rounded bg-line px-2 py-0.5 text-[10px] font-semibold text-fg-sub">Original Post</span>
                  <span className="text-[11px] text-fg-muted">{relativeTime(topic.createdAt)}</span>
                  <AdminDeleteTopic topicId={topic.id} />
                </div>
                {topic.mentionedProducts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {topic.mentionedProducts.map((p) => (
                      <Link key={p.id} href={`/products/${p.slug}`} className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent hover:bg-accent/25">
                        <Icon name="tag" size={10} />@{p.name}
                      </Link>
                    ))}
                  </div>
                )}
                <h1 className="mt-3 text-[20px] font-bold text-fg">{topic.title}</h1>
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-fg-sub">{topic.body}</p>
              </div>
            </div>
          </div>

          {/* Comments count */}
          <p className="text-[12px] text-fg-sub">
            Showing {topic._count.comments} {topic._count.comments === 1 ? "comment" : "comments"}
          </p>

          {/* Comments */}
          {topic.comments.map((comment) => {
            if (comment.isAdmin) {
              return (
                <div key={comment.id} className="rounded-card border-l-2 border-accent bg-[#1A1200] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-accent text-[12px] font-bold text-bg">K</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-fg">{comment.authorName}</span>
                        <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Kaemnur Team</span>
                        <span className="text-[11px] text-fg-muted">{relativeTime(comment.createdAt)}</span>
                        <AdminDeleteComment commentId={comment.id} topicId={topic.id} />
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-fg-sub">{comment.body}</p>
                    </div>
                  </div>
                </div>
              );
            }
            const bg = getAvatarColor(comment.authorName);
            const fg = getAvatarTextColor(bg);
            return (
              <div key={comment.id} className="rounded-card border border-line bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded text-[12px] font-bold" style={{ backgroundColor: bg, color: fg }}>
                    {getInitial(comment.authorName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-fg">{comment.authorName}</span>
                      <span className="text-[11px] text-fg-muted">{relativeTime(comment.createdAt)}</span>
                      <AdminDeleteComment commentId={comment.id} topicId={topic.id} />
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-fg-sub">{comment.body}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Comment form */}
          <CommentForm topicId={topic.id} />

          {/* Admin reply form — only visible when localStorage flag is set */}
          <AdminReplyForm topicId={topic.id} />
        </div>

        {/* Right column */}
        <aside className="self-start">
          <div className="sticky top-16 rounded-card border border-line bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-fg">More discussions</p>
              <Link href="/community" className="text-[11px] text-accent hover:underline">View all</Link>
            </div>
            {recentTopics.length === 0 ? (
              <p className="text-[12px] text-fg-sub">No other discussions yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentTopics.map((t) => (
                  <li key={t.id}>
                    <Link href={`/community/${t.id}`} className="group block">
                      <p className="text-[13px] font-medium text-fg group-hover:text-accent">{t.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-sub">
                        <Icon name="message-square" size={11} />
                        <span>{t._count.comments} replies</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
