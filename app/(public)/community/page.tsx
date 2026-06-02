"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NewTopicModal } from "@/components/community/NewTopicModal";
import { RequestSection } from "@/components/community/RequestSection";
import { DonationSection } from "@/components/community/DonationSection";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";
import { CATEGORY_STYLE, pseudoViews } from "@/lib/community";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Topic = {
  id: string;
  title: string;
  bodyPreview: string;
  authorName: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  mentionedProducts: { id: string; name: string; slug: string }[];
  _count: { comments: number };
};

const CATEGORIES = ["All", "General", "Questions", "Bug Reports", "Suggestions"];

const TAB_ICONS: Record<string, string> = {
  All: "layout-dashboard",
  General: "message-square",
  Questions: "help-circle",
  "Bug Reports": "alert-triangle",
  Suggestions: "sparkles",
};

const SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "popular", label: "Paling Ramai" },
];

function relativeTime(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  if (s < 604800) return `${Math.floor(s / 86400)}h lalu`;
  return new Date(date).toLocaleDateString("id-ID", { month: "short", day: "numeric" });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function CommunityPage() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const categoryParam = params.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"list" | "grid">("list");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    setIsAdmin(localStorage.getItem("kaemnur_admin") === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function togglePin(id: string) {
    setPinningId(id);
    try {
      const res = await fetch(`/api/admin/community/topics/${id}/pin`, { method: "PUT" });
      if (res.ok) {
        await fetchTopics(activeCategory, page);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Gagal menyematkan postingan.");
      }
    } finally {
      setPinningId(null);
    }
  }

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
    setPage(data.page);
    setPageCount(data.pageCount);
    setLoading(false);
  }

  useEffect(() => {
    fetchTopics(activeCategory, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectCategory(cat: string) {
    setActiveCategory(cat);
    fetchTopics(cat, 1);
  }

  // Client-side search + sort over the current page of topics.
  const visibleTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = topics;
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    const sorted = [...list].sort((a, b) => {
      if (sort === "popular") return b._count.comments - a._count.comments;
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });
    // Pinned always float to the top regardless of sort.
    return sorted.sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  }, [topics, search, sort]);

  const pinnedTopics = visibleTopics.filter((t) => t.isPinned);
  const regularTopics = visibleTopics.filter((t) => !t.isPinned);

  function renderRow(topic: Topic) {
    const bg = getAvatarColor(topic.authorName);
    const fg = getAvatarTextColor(bg);
    const cat = CATEGORY_STYLE[topic.category] ?? CATEGORY_STYLE.General;
    const views = pseudoViews(topic.id, topic._count.comments);
    return (
      <div
        key={topic.id}
        className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-card-hover"
      >
        {/* Avatar */}
        <span
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[14px] font-bold"
          style={{ backgroundColor: bg, color: fg }}
        >
          {getInitial(topic.authorName)}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/community/${topic.id}`}
              className="truncate text-[14px] font-semibold text-fg hover:text-accent"
            >
              {topic.title}
            </Link>
            {topic.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                <Icon name="pin" size={10} />
                Disematkan
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold",
                cat.bg,
                cat.text
              )}
            >
              <Icon name={cat.icon as never} size={10} />
              {topic.category}
            </span>
            <span className="text-fg-sub">
              oleh <span className="text-fg-sub">{topic.authorName}</span>
            </span>
            {topic.mentionedProducts.slice(0, 2).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="rounded bg-accent/10 px-1.5 py-0.5 font-semibold text-accent hover:bg-accent/20"
              >
                @{p.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Meta stats */}
        <div className="hidden shrink-0 items-center gap-5 text-[11px] text-fg-sub sm:flex">
          <span className="flex w-12 flex-col items-center gap-0.5">
            <Icon name="message-square" size={14} className="text-fg-muted" />
            <span className="font-semibold text-fg">{topic._count.comments}</span>
          </span>
          <span className="flex w-12 flex-col items-center gap-0.5">
            <Icon name="eye" size={14} className="text-fg-muted" />
            <span className="font-semibold text-fg">{formatCount(views)}</span>
          </span>
          <span className="flex w-20 flex-col items-end gap-0.5 text-right">
            <span className="flex items-center gap-1 text-fg-muted">
              <Icon name="clock" size={11} />
              {relativeTime(topic.createdAt)}
            </span>
            <span className="truncate text-fg-sub">{topic.authorName}</span>
          </span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => togglePin(topic.id)}
            disabled={pinningId === topic.id}
            title={topic.isPinned ? "Lepas sematan" : "Sematkan"}
            className={cn(
              "shrink-0 rounded p-1.5 transition-colors disabled:opacity-50",
              topic.isPinned ? "text-accent hover:bg-accent/10" : "text-fg-muted hover:bg-card hover:text-fg"
            )}
          >
            <Icon name="pin" size={14} />
          </button>
        )}
      </div>
    );
  }

  function renderCard(topic: Topic) {
    const bg = getAvatarColor(topic.authorName);
    const fg = getAvatarTextColor(bg);
    const cat = CATEGORY_STYLE[topic.category] ?? CATEGORY_STYLE.General;
    const views = pseudoViews(topic.id, topic._count.comments);
    return (
      <Link
        key={topic.id}
        href={`/community/${topic.id}`}
        className="flex flex-col gap-3 rounded-card border border-line bg-card p-4 transition-colors hover:border-accent/40 hover:bg-card-hover"
      >
        <div className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[13px] font-bold"
            style={{ backgroundColor: bg, color: fg }}
          >
            {getInitial(topic.authorName)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
              cat.bg,
              cat.text
            )}
          >
            <Icon name={cat.icon as never} size={10} />
            {topic.category}
          </span>
          {topic.isPinned && <Icon name="pin" size={12} className="ml-auto text-accent" />}
        </div>
        <p className="line-clamp-2 text-[14px] font-semibold text-fg">{topic.title}</p>
        <p className="line-clamp-2 text-[12px] text-fg-sub">{topic.bodyPreview}</p>
        <div className="mt-auto flex items-center gap-4 text-[11px] text-fg-sub">
          <span className="flex items-center gap-1">
            <Icon name="message-square" size={12} /> {topic._count.comments}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="eye" size={12} /> {formatCount(views)}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Icon name="clock" size={11} /> {relativeTime(topic.createdAt)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Community</p>
          <h1 className="mt-1 text-2xl font-bold text-fg">Discussions</h1>
          <p className="mt-1.5 text-[13px] text-fg-sub">
            Diskusi, tanya jawab, dan berbagi informasi seputar aplikasi Kaemnur.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewDiscussion}
          className="inline-flex h-10 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover"
        >
          <Icon name="plus" size={16} />
          Start a New Discussion
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => selectCategory(cat)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
              activeCategory === cat
                ? "border-accent text-fg"
                : "border-transparent text-fg-sub hover:text-fg"
            )}
          >
            <Icon name={TAB_ICONS[cat] as never} size={14} />
            {cat}
          </button>
        ))}
      </div>

      {/* Discussions — full width */}
      <div>
          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 appearance-none rounded-btn border border-line bg-card pl-3 pr-8 text-[13px] text-fg outline-none focus:border-accent"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
              />
            </div>

            <div className="relative min-w-0 flex-1">
              <Icon
                name="search"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari diskusi…"
                className="h-9 w-full rounded-btn border border-line bg-card pl-9 pr-3 text-[13px] text-fg placeholder:text-fg-muted outline-none focus:border-accent"
              />
            </div>

            <div className="flex h-9 items-center gap-0.5 rounded-btn border border-line bg-card p-0.5">
              {(["list", "grid"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  title={v === "list" ? "Tampilan daftar" : "Tampilan grid"}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded transition-colors",
                    view === v ? "bg-accent text-bg" : "text-fg-muted hover:text-fg"
                  )}
                >
                  <Icon name={v === "list" ? "menu" : "grid"} size={14} />
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[13px] text-fg-sub">Memuat…</div>
          ) : visibleTopics.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-card p-10 text-center">
              <p className="text-[13px] text-fg-sub">
                {search ? "Tidak ada diskusi yang cocok." : "Belum ada diskusi."}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={handleNewDiscussion}
                  className="mt-3 text-[13px] font-medium text-accent hover:underline"
                >
                  Jadilah yang pertama memulai →
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2">{visibleTopics.map(renderCard)}</div>
          ) : (
            <div className="space-y-4">
              {pinnedTopics.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    📌 Disematkan
                  </p>
                  <div className="divide-y divide-line overflow-hidden rounded-card border border-accent/30 bg-card">
                    {pinnedTopics.map(renderRow)}
                  </div>
                </div>
              )}
              {regularTopics.length > 0 && (
                <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
                  {regularTopics.map(renderRow)}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchTopics(activeCategory, page - 1)}
                className="inline-flex h-8 items-center gap-1 rounded-btn border border-line px-3 text-[12px] text-fg-sub hover:bg-card disabled:opacity-40"
              >
                <Icon name="arrow-left" size={13} /> Sebelumnya
              </button>
              <span className="text-[12px] text-fg-sub">
                Halaman {page} dari {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => fetchTopics(activeCategory, page + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-btn border border-line px-3 text-[12px] text-fg-sub hover:bg-card disabled:opacity-40"
              >
                Berikutnya <Icon name="arrow-right" size={13} />
              </button>
            </div>
          )}
        </div>

      {/* Request Aplikasi + Donasi (donasi hanya muncul jika trakteerUrl diisi) */}
      <RequestSection userId={userId} />
      <DonationSection />

      <NewTopicModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
