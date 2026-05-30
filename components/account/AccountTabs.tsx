"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type InstallItem = {
  id: string;
  name: string;
  slug: string;
  platform: string;
  version: string;
  date: string;
};

export type LicenseItem = {
  id: string;
  maskedKey: string;
  productName: string;
  status: "aktif" | "belum";
  date: string;
};

export type ReviewItem = {
  id: string;
  name: string;
  slug: string;
  rating: number;
  reviewText: string | null;
  date: string;
};

type TabKey = "instalasi" | "lisensi" | "ulasan";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[14px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-accent" : "text-fg-muted/30"}>
          ★
        </span>
      ))}
    </span>
  );
}

function Empty({ icon, title, children }: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-btn border border-dashed border-line bg-bg px-4 py-10 text-center">
      <Icon name={icon} size={24} className="mx-auto text-fg-muted" />
      <p className="mt-3 text-[13px] font-medium text-fg">{title}</p>
      {children}
    </div>
  );
}

export function AccountTabs({
  installs,
  licenses,
  reviews,
}: {
  installs: InstallItem[];
  licenses: LicenseItem[];
  reviews: ReviewItem[];
}) {
  const [tab, setTab] = useState<TabKey>("instalasi");

  // Local copy so deletes reflect instantly without a page reload (Feature 7)
  const [items, setItems] = useState<InstallItem[]>(installs);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteOne(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/account/downloads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setConfirmId(null);
      } else {
        alert("Gagal menghapus riwayat. Coba lagi.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    setBusy(true);
    try {
      const res = await fetch(`/api/account/downloads`, { method: "DELETE" });
      if (res.ok) {
        setItems([]);
        setConfirmAll(false);
      } else {
        alert("Gagal menghapus semua riwayat. Coba lagi.");
      }
    } finally {
      setBusy(false);
    }
  }

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "instalasi", label: "Instalasi", count: items.length },
    { key: "lisensi", label: "Lisensi", count: licenses.length },
    { key: "ulasan", label: "Ulasan Saya", count: reviews.length },
  ];

  return (
    <div className="rounded-card border border-line bg-card">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "relative -mb-px flex items-center gap-1.5 border-b-2 px-3 pb-3 pt-1.5 text-[13px] font-medium transition-colors",
              tab === t.key
                ? "border-accent text-fg"
                : "border-transparent text-fg-sub hover:text-fg"
            )}
          >
            {t.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              tab === t.key ? "bg-accent/15 text-accent" : "bg-line text-fg-muted"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ── Instalasi ── */}
        {tab === "instalasi" && (
          items.length === 0 ? (
            <Empty icon="download" title="Belum ada riwayat instalasi">
              <Link href="/" className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline">
                Cari aplikasi untuk diunduh →
              </Link>
            </Empty>
          ) : (
            <>
              {/* Hapus Semua */}
              <div className="mb-2 flex items-center justify-end">
                {confirmAll ? (
                  <span className="flex items-center gap-2 text-[12px]">
                    <span className="text-red-400">Hapus semua riwayat?</span>
                    <button type="button" onClick={deleteAll} disabled={busy} className="font-semibold text-red-400 hover:underline disabled:opacity-50">
                      Ya, Hapus
                    </button>
                    <button type="button" onClick={() => setConfirmAll(false)} className="text-fg-muted hover:text-fg">
                      Batal
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmAll(true)} className="text-[12px] font-medium text-red-400 hover:underline">
                    Hapus Semua
                  </button>
                )}
              </div>
              <ul className="divide-y divide-line">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-btn bg-bg text-[13px] font-bold text-fg-sub">
                        {it.name[0]}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/products/${it.slug}`} className="text-[14px] font-semibold text-fg hover:text-accent">
                          {it.name}
                        </Link>
                        <p className="text-[12px] text-fg-sub">v{it.version} · {it.date}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {confirmId === it.id ? (
                        <span className="flex items-center gap-2 text-[12px]">
                          <span className="text-red-400">Hapus?</span>
                          <button type="button" onClick={() => deleteOne(it.id)} disabled={busy} className="font-semibold text-red-400 hover:underline disabled:opacity-50">
                            Ya, Hapus
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="text-fg-muted hover:text-fg">
                            Batal
                          </button>
                        </span>
                      ) : (
                        <>
                          <span className="rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">{it.platform}</span>
                          <Link href={`/products/${it.slug}`} className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-accent hover:bg-accent/10">
                            <Icon name="download" size={11} />
                            Unduh Lagi
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmId(it.id)}
                            title="Hapus dari riwayat"
                            className="text-fg-muted transition-colors hover:text-red-400"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        )}

        {/* ── Lisensi ── */}
        {tab === "lisensi" && (
          licenses.length === 0 ? (
            <Empty icon="key" title="Belum ada lisensi">
              <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-fg-sub">
                Lisensi PRO akan muncul di sini setelah tim Kaemnur menautkan kunci ke akun Anda.
              </p>
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {licenses.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-fg">{l.productName}</p>
                    <p className="font-mono text-[12px] text-fg-sub">{l.maskedKey}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11px] text-fg-muted">{l.date}</span>
                    {l.status === "aktif" ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">
                        <span className="h-1.5 w-1.5 rounded-full bg-fg-muted" />
                        Belum Aktif
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {/* ── Ulasan Saya ── */}
        {tab === "ulasan" && (
          reviews.length === 0 ? (
            <Empty icon="star" title="Belum memberikan ulasan">
              <Link href="/" className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline">
                Jelajahi produk untuk dinilai →
              </Link>
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/products/${r.slug}`} className="text-[14px] font-semibold text-fg hover:text-accent">
                      {r.name}
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                      <Stars value={r.rating} />
                      <Link href={`/products/${r.slug}`} className="text-[11px] font-medium text-accent hover:underline">
                        Ubah
                      </Link>
                    </div>
                  </div>
                  {r.reviewText && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-sub">{r.reviewText}</p>
                  )}
                  <p className="mt-1 text-[11px] text-fg-muted">{r.date}</p>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
