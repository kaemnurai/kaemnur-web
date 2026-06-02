"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

type AdminRequest = {
  id: string;
  title: string;
  description: string;
  status: string;
  voteCount: number;
  authorName: string;
  createdAt: string;
  releasedProductId: string | null;
};
type ProductOpt = { id: string; name: string };

const STATUSES = ["OPEN", "PLANNED", "IN_PROGRESS", "RELEASED", "REJECTED"];

export function RequestsManager({
  requests: initial,
  products,
}: {
  requests: AdminRequest[];
  products: ProductOpt[];
}) {
  const [requests, setRequests] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function update(id: string, patch: { status?: string; releasedProductId?: string | null }) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Gagal menyimpan.");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: d.status ?? r.status, releasedProductId: d.releasedProductId ?? null } : r
        )
      );
      toast("Tersimpan.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function notify(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}/notify`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Gagal.");
      toast(`${d.notified ?? 0} voter dinotifikasi.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-[13px] text-fg-sub">
        Belum ada request aplikasi.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-card border border-line bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-btn bg-accent/10 text-accent">
              <span className="flex flex-col items-center leading-none">
                <span className="text-[15px] font-bold">{r.voteCount}</span>
                <span className="text-[9px]">votes</span>
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold text-fg">{r.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-fg-sub">{r.description}</p>
              <p className="mt-1 text-[11px] text-fg-muted">oleh {r.authorName}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={r.status}
              onChange={(e) => update(r.id, { status: e.target.value })}
              disabled={busyId === r.id}
              className="h-9 rounded-btn border border-line bg-bg px-2 text-[12px] text-fg focus:border-accent focus:outline-none disabled:opacity-50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {r.status === "RELEASED" && (
              <>
                <select
                  value={r.releasedProductId ?? ""}
                  onChange={(e) => update(r.id, { releasedProductId: e.target.value })}
                  disabled={busyId === r.id}
                  className="h-9 rounded-btn border border-line bg-bg px-2 text-[12px] text-fg focus:border-accent focus:outline-none disabled:opacity-50"
                >
                  <option value="">— pilih produk —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => notify(r.id)}
                  disabled={busyId === r.id || !r.releasedProductId}
                  className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-50"
                >
                  {busyId === r.id ? <Spinner className="h-4 w-4" /> : <Icon name="send" size={13} />}
                  Notify Voters
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
