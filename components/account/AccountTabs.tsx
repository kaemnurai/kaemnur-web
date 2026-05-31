"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

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
  status: "aktif" | "expired" | "belum";
  expiry: string;
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

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={13}
          className={i <= value ? "text-accent" : "text-line"}
        />
      ))}
    </span>
  );
}

// Square product logo: deterministic colored initial.
function Logo({ name }: { name: string }) {
  const bg = getAvatarColor(name);
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-btn text-[14px] font-bold"
      style={{ backgroundColor: bg, color: getAvatarTextColor(bg) }}
    >
      {getInitial(name)}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  action,
  children,
  id,
}: {
  title: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-card border border-line bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          <Icon name={icon} size={16} className="text-accent" />
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Empty({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-btn border border-dashed border-line bg-bg px-4 py-8 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-line/50 text-fg-muted">
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-3 text-[13px] font-medium text-fg">{title}</p>
      {children}
    </div>
  );
}

export function AccountTabs({
  installs,
  licenses,
  reviews,
  waLink,
}: {
  installs: InstallItem[];
  licenses: LicenseItem[];
  reviews: ReviewItem[];
  waLink?: string;
}) {
  // Local copy so deletes reflect instantly without a page reload
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

  return (
    <div className="space-y-4">
      {/* ── Instalasi Saya ── */}
      <SectionCard
        id="downloads"
        title="Instalasi Saya"
        icon="download"
        action={
          items.length > 0 ? (
            confirmAll ? (
              <span className="flex items-center gap-2 text-[12px]">
                <span className="text-danger">Hapus semua?</span>
                <button
                  type="button"
                  onClick={deleteAll}
                  disabled={busy}
                  className="font-semibold text-danger hover:underline disabled:opacity-50"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAll(false)}
                  className="text-fg-muted hover:text-fg"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAll(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-fg-sub transition-colors hover:text-danger"
              >
                <Icon name="trash" size={13} />
                Hapus Semua
              </button>
            )
          ) : null
        }
      >
        {items.length === 0 ? (
          <Empty icon="download" title="Belum ada riwayat instalasi">
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
            >
              Cari aplikasi untuk diunduh
              <Icon name="arrow-right" size={12} />
            </Link>
          </Empty>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-btn border border-line bg-bg px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Logo name={it.name} />
                  <div className="min-w-0">
                    <Link
                      href={`/products/${it.slug}`}
                      className="block truncate text-[14px] font-semibold text-fg hover:text-accent"
                    >
                      {it.name}
                    </Link>
                    <p className="truncate text-[12px] text-fg-sub">
                      v{it.version} · {it.date}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {confirmId === it.id ? (
                    <span className="flex items-center gap-2 text-[12px]">
                      <span className="text-danger">Hapus?</span>
                      <button
                        type="button"
                        onClick={() => deleteOne(it.id)}
                        disabled={busy}
                        className="font-semibold text-danger hover:underline disabled:opacity-50"
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="text-fg-muted hover:text-fg"
                      >
                        Batal
                      </button>
                    </span>
                  ) : (
                    <>
                      <span className="hidden rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub sm:inline">
                        {it.platform}
                      </span>
                      <Link
                        href={`/products/${it.slug}`}
                        className="inline-flex h-8 items-center gap-1 rounded-btn border border-accent/40 px-2.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/10"
                      >
                        <Icon name="download" size={12} />
                        Unduh Lagi
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmId(it.id)}
                        title="Hapus dari riwayat"
                        className="grid h-8 w-8 place-items-center rounded-btn text-fg-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ── Lisensi Saya ── */}
      <SectionCard title="Lisensi Saya" icon="key">
        {licenses.length === 0 ? (
          <Empty icon="key" title="Belum ada lisensi tertaut">
            <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-fg-sub">
              Lisensi PRO akan muncul di sini setelah tim Kaemnur menautkan kunci ke akun Anda.
            </p>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-4 text-[12px] font-semibold text-bg transition-colors hover:bg-accent-hover"
              >
                <Icon name="message-circle" size={14} />
                Hubungi Lisensi
              </a>
            )}
          </Empty>
        ) : (
          <ul className="space-y-2">
            {licenses.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-btn border border-line bg-bg px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Logo name={l.productName} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-fg">{l.productName}</p>
                    <p className="truncate font-mono text-[12px] text-fg-sub">{l.maskedKey}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {l.status === "expired" ? (
                    <span className="inline-flex items-center gap-1.5 rounded bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
                      <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                      Expired
                    </span>
                  ) : l.status === "aktif" ? (
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
                  <span className="text-[11px] text-fg-muted">{l.expiry}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ── Ulasan Saya ── */}
      <SectionCard title="Ulasan Saya" icon="star">
        {reviews.length === 0 ? (
          <Empty icon="star" title="Belum ada ulasan">
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
            >
              Jelajahi produk untuk dinilai
              <Icon name="arrow-right" size={12} />
            </Link>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-btn border border-line bg-bg px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Logo name={r.name} />
                    <div className="min-w-0">
                      <Link
                        href={`/products/${r.slug}`}
                        className="block truncate text-[14px] font-semibold text-fg hover:text-accent"
                      >
                        {r.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="text-[11px] text-fg-muted">{r.date}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/products/${r.slug}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-btn border border-line px-2.5 text-[11px] font-medium text-fg-sub transition-colors hover:border-fg-muted hover:text-fg"
                  >
                    <Icon name="edit" size={11} />
                    Edit
                  </Link>
                </div>
                {r.reviewText && (
                  <p className="mt-2 text-[13px] leading-relaxed text-fg-sub">{r.reviewText}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
