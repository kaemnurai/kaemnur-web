"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Rating = {
  id: string;
  rating: number;
  createdAt: string;
  user: { displayName: string | null; email: string | null };
};

function formatDateID(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Stars({ value }: { value: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-accent" : "text-fg-muted/30"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function RatingsPanel({ productId }: { productId: string }) {
  const router = useRouter();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [overrideInput, setOverrideInput] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState("");

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/admin/products/${productId}/ratings`);
    if (res.ok) {
      const d = await res.json();
      setRatings(d.ratings);
      setAverage(d.average);
      setCount(d.count);
      setRatingOverride(d.ratingOverride);
      setOverrideInput(d.ratingOverride != null ? String(d.ratingOverride) : "");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function saveOverride(valueOverride?: string) {
    const val = (valueOverride ?? overrideInput).trim();
    const override = val === "" ? null : Number(val);
    if (override !== null && (isNaN(override) || override < 1 || override > 5)) {
      setOverrideMsg("Nilai harus antara 1.0–5.0 atau kosong untuk reset.");
      return;
    }
    setOverrideSaving(true);
    setOverrideMsg("");
    const res = await fetch(`/api/admin/products/${productId}/rating-override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ override }),
    });
    setOverrideSaving(false);
    if (res.ok) {
      const d = await res.json();
      setRatingOverride(d.ratingOverride);
      setOverrideMsg(override === null ? "Override direset." : `Override disimpan: ${d.ratingOverride}`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setOverrideMsg(d.error || "Gagal menyimpan.");
    }
    setTimeout(() => setOverrideMsg(""), 3000);
  }

  async function deleteRating(id: string) {
    if (!confirm("Hapus ulasan ini?")) return;
    const res = await fetch(`/api/admin/ratings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRatings((prev) => prev.filter((r) => r.id !== id));
      setCount((v) => Math.max(0, v - 1));
      const remaining = ratings.filter((r) => r.id !== id);
      if (remaining.length > 0) {
        const avg = remaining.reduce((s, r) => s + r.rating, 0) / remaining.length;
        setAverage(avg);
      } else {
        setAverage(null);
      }
      router.refresh();
    }
  }

  if (loading) {
    return <p className="text-[12px] text-fg-sub">Memuat data rating…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Override section */}
      <div>
        <p className="mb-1 text-[13px] font-semibold text-fg">Rating Override</p>
        <div className="mb-3 text-[12px] text-fg-sub">
          <span>Rata-rata saat ini: </span>
          {average !== null ? (
            <span className="font-semibold text-fg">{average.toFixed(1)}</span>
          ) : (
            <span className="italic">belum ada ulasan</span>
          )}
          <span className="text-fg-muted"> (dari {count} ulasan)</span>
          {ratingOverride !== null && (
            <span className="ml-3 rounded bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              Override Aktif: {ratingOverride}
            </span>
          )}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label htmlFor="override-input" className="text-[12px] font-medium text-fg">
              Set Override Rating
            </label>
            <input
              id="override-input"
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              placeholder="contoh: 4.5"
              className="w-full rounded-btn border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <button
            type="button"
            onClick={() => void saveOverride()}
            disabled={overrideSaving}
            className="h-10 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            {overrideSaving ? "Menyimpan…" : "Simpan Override"}
          </button>
          <button
            type="button"
            onClick={() => { setOverrideInput(""); void saveOverride(""); }}
            disabled={overrideSaving || ratingOverride === null}
            className={cn(
              "h-10 rounded-btn border px-3 text-[12px] font-medium transition-colors disabled:opacity-40",
              "border-line text-fg-sub hover:border-fg-muted hover:text-fg"
            )}
          >
            Reset ke Rata-rata Asli
          </button>
        </div>
        {overrideMsg && (
          <p className={cn("mt-1 text-[11px]", overrideMsg.includes("Gagal") || overrideMsg.includes("harus") ? "text-danger" : "text-success")}>
            {overrideMsg}
          </p>
        )}
      </div>

      {/* Ratings list */}
      <div>
        <p className="mb-3 text-[13px] font-semibold text-fg">Daftar Ulasan User</p>
        {ratings.length === 0 ? (
          <p className="rounded-btn border border-dashed border-line px-3 py-4 text-center text-[12px] text-fg-sub">
            Belum ada ulasan untuk produk ini
          </p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Rating</th>
                <th className="py-2 pr-4 font-medium">Tanggal</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ratings.map((r) => (
                <tr key={r.id} className="hover:bg-card-hover">
                  <td className="py-2.5 pr-4 text-fg">
                    {r.user.displayName ?? r.user.email ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="flex items-center gap-1.5">
                      <Stars value={r.rating} />
                      <span className="text-[11px] text-fg-sub">{r.rating}/5</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-[12px] text-fg-sub">
                    {formatDateID(r.createdAt)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => deleteRating(r.id)}
                      className="inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium text-danger hover:bg-danger/10"
                    >
                      <Icon name="trash" size={11} />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
