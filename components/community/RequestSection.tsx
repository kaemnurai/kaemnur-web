"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type AppRequest = {
  id: string;
  title: string;
  description: string;
  status: string;
  voteCount: number;
  voted: boolean;
  authorName: string;
  createdAt: string;
  releasedProductSlug: string | null;
  releasedProductName: string | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open", cls: "bg-line text-fg-sub" },
  PLANNED: { label: "Planned", cls: "bg-info/15 text-info" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-accent/15 text-accent" },
  RELEASED: { label: "Released", cls: "bg-success/15 text-success" },
  REJECTED: { label: "Rejected", cls: "bg-danger/15 text-danger" },
};

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  if (s < 604800) return `${Math.floor(s / 86400)}h lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { month: "short", day: "numeric" });
}

export function RequestSection({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [requests, setRequests] = useState<AppRequest[]>([]);
  const [sort, setSort] = useState<"popular" | "new">("popular");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const load = useCallback(async (s: "popular" | "new") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/requests?sort=${s}`);
      if (res.ok) setRequests(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(sort);
  }, [load, sort]);

  async function vote(r: AppRequest) {
    if (!userId) {
      router.push("/login?redirect=/community");
      return;
    }
    setVotingId(r.id);
    try {
      const res = await fetch(`/api/community/requests/${r.id}/vote`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Gagal vote.");
      setRequests((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, voted: d.voted, voteCount: d.voteCount } : x))
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal vote.", "error");
    } finally {
      setVotingId(null);
    }
  }

  async function submit() {
    if (title.trim().length < 2 || description.trim().length < 5) {
      toast("Lengkapi nama & deskripsi aplikasi.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Gagal mengirim.");
      toast("Request terkirim!", "success");
      setModalOpen(false);
      setTitle("");
      setDescription("");
      load(sort);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengirim.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function openModal() {
    if (!userId) {
      router.push("/login?redirect=/community");
      return;
    }
    setModalOpen(true);
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Request</p>
          <h2 className="mt-1 text-xl font-bold text-fg">Request Aplikasi</h2>
          <p className="mt-1 text-[13px] text-fg-sub">
            Usulkan aplikasi baru & vote yang paling Anda butuhkan.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-10 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover active:opacity-70"
        >
          <Icon name="plus" size={16} />
          Request Aplikasi Baru
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {([
          ["popular", "Terpopuler"],
          ["new", "Terbaru"],
        ] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setSort(v)}
            className={cn(
              "h-8 rounded-btn border px-3 text-[12px] font-medium transition-colors",
              sort === v ? "border-accent bg-accent/10 text-accent" : "border-line text-fg-sub hover:text-fg"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-[13px] text-fg-sub">Memuat…</div>
      ) : requests.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-card p-8 text-center text-[13px] text-fg-sub">
          Belum ada request. Jadilah yang pertama!
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.OPEN;
            return (
              <div key={r.id} className="flex gap-3 rounded-card border border-line bg-card p-4">
                <button
                  type="button"
                  onClick={() => vote(r)}
                  disabled={votingId === r.id}
                  aria-pressed={r.voted}
                  className={cn(
                    "flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-btn border transition-colors active:opacity-70 disabled:opacity-60",
                    r.voted
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-fg-sub hover:border-fg-muted hover:text-fg"
                  )}
                >
                  <Icon name="arrow-up" size={16} />
                  <span className="text-[13px] font-bold">{r.voteCount}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-fg">{r.title}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.cls)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[13px] text-fg-sub">{r.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
                    <span>oleh {r.authorName}</span>
                    <span>· {relativeTime(r.createdAt)}</span>
                    {r.status === "RELEASED" && r.releasedProductSlug && (
                      <Link
                        href={`/products/${r.releasedProductSlug}`}
                        className="font-medium text-accent hover:underline"
                      >
                        Lihat Aplikasi →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => (submitting ? undefined : setModalOpen(false))}
        title="Request Aplikasi Baru"
        subtitle="Usulkan aplikasi yang Anda butuhkan."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="req-title" className="mb-1 block text-[12px] font-medium text-fg-sub">
              Nama aplikasi yang diinginkan
            </label>
            <input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth. Aplikasi Invoice"
              className="h-10 w-full rounded-btn border border-line bg-bg px-3 text-[14px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="req-desc" className="mb-1 block text-[12px] font-medium text-fg-sub">
              Jelaskan fungsi / alasan
            </label>
            <textarea
              id="req-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Untuk apa aplikasi ini & kenapa Anda butuh?"
              className="w-full rounded-btn border border-line bg-bg px-3 py-2 text-[14px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? <Spinner className="h-4 w-4" /> : <Icon name="send" size={14} />}
            Kirim Request
          </button>
        </div>
      </Modal>
    </section>
  );
}
