"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NewTopicModal } from "@/components/community/NewTopicModal";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Topic = {
  id: string;
  title: string;
  bodyPreview: string;
  authorName: string;
  category: string;
  createdAt: string;
  mentionedProducts: { id: string; name: string; slug: string }[];
  _count: { comments: number };
};

const CATEGORIES = ["All", "General", "Questions", "Bug Reports", "Suggestions"];

function relativeTime(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CommunityPage() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const categoryParam = params.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [subforumCounts, setSubforumCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNewDiscussion() {
    if (!userId) {
      router.push("/login?redirect=/community");
      return;
    }
    setModalOpen(true);
  }

  async function fetchTopics(cat: string, pg: number) {
    setLoading(true);
    const query = new URLSearchParams();
    if (cat !== "All") query.set("category", cat);
    query.set("page", String(pg));
    const res = await fetch(`/api/community/topics?${query}`);
    const data = await res.json();
    setTopics(data.topics);
    setTotal(data.total);
    setPage(data.page);
    setPageCount(data.pageCount);
    setLoading(false);
  }

  async function fetchCounts() {
    const cats = CATEGORIES.filter((c) => c !== "All");
    const counts: Record<string, number> = {};
    await Promise.all(cats.map(async (cat) => {
      const res = await fetch(`/api/community/topics?category=${encodeURIComponent(cat)}&page=1`);
      const d = await res.json();
      counts[cat] = d.total;
    }));
    setSubforumCounts(counts);
  }

  useEffect(() => {
    fetchTopics(activeCategory, 1);
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // intentional: only fetch on mount, category changes handled by selectCategory

  function selectCategory(cat: string) {
    setActiveCategory(cat);
    fetchTopics(cat, 1);
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Community</p>
          <h1 className="mt-1 text-2xl font-bold text-fg">Discussions</h1>
        </div>
        <button
          type="button"
          onClick={handleNewDiscussion}
          className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover"
        >
          <Icon name="plus" size={14} />
          Start a New Discussion
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_200px]">
        {/* Main topic list */}
        <div>
          {/* Filter tabs */}
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line pb-px">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => selectCategory(cat)}
                className={cn(
                  "shrink-0 border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                  activeCategory === cat
                    ? "border-accent text-fg"
                    : "border-transparent text-fg-sub hover:text-fg"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <p className="mb-3 text-[12px] text-fg-sub">Showing {total} active {total === 1 ? "topic" : "topics"}</p>

          {loading ? (
            <div className="py-12 text-center text-[13px] text-fg-sub">Loading…</div>
          ) : topics.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-card p-10 text-center">
              <p className="text-[13px] text-fg-sub">No discussions yet.</p>
              <button type="button" onClick={() => setModalOpen(true)} className="mt-3 text-[13px] font-medium text-accent hover:underline">
                Be the first to start one →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-line rounded-card border border-line bg-card">
              {topics.map((topic) => {
                const bg = getAvatarColor(topic.authorName);
                const fg = getAvatarTextColor(bg);
                return (
                  <div key={topic.id} className="flex gap-3 p-4 hover:bg-card-hover">
                    {/* Avatar */}
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded text-[13px] font-bold" style={{ backgroundColor: bg, color: fg }}>
                      {getInitial(topic.authorName)}
                    </span>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <Link href={`/community/${topic.id}`} className="group">
                        <p className="text-[14px] font-semibold text-fg group-hover:text-accent">{topic.title}</p>
                      </Link>
                      {/* Product mention badges */}
                      {topic.mentionedProducts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {topic.mentionedProducts.map((p) => (
                            <Link key={p.id} href={`/products/${p.slug}`} className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/25">
                              @{p.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-fg-sub">
                        by <span className="text-fg">{topic.authorName}</span> · <span className="rounded bg-line px-1.5 py-0.5 text-fg-muted">{topic.category}</span>
                      </p>
                    </div>
                    {/* Meta */}
                    <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-fg-sub">
                      <span>{relativeTime(topic.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Icon name="message-square" size={11} />
                        {topic._count.comments}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => { fetchTopics(activeCategory, page - 1); }} className="h-8 rounded-btn border border-line px-3 text-[12px] text-fg-sub hover:bg-card disabled:opacity-40">
                ← Prev
              </button>
              <span className="text-[12px] text-fg-sub">Page {page} of {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => { fetchTopics(activeCategory, page + 1); }} className="h-8 rounded-btn border border-line px-3 text-[12px] text-fg-sub hover:bg-card disabled:opacity-40">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Sub-forums panel */}
        <aside>
          <div className="sticky top-16 rounded-card border border-line bg-card p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">Sub-Forums</p>
            <ul className="space-y-2">
              {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                <li key={cat}>
                  <button type="button" onClick={() => selectCategory(cat)} className="flex w-full items-center justify-between gap-2 text-[13px]">
                    <span className={cn(activeCategory === cat ? "font-semibold text-accent" : "text-fg-sub hover:text-fg")}>
                      {cat}
                    </span>
                    <span className="text-[11px] text-fg-muted">{subforumCounts[cat] ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <NewTopicModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
