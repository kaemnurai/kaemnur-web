"use client";

import { useEffect, useState } from "react";

export const PAY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export type OrderStatusKey =
  | "BELUM_BAYAR"
  | "MENUNGGU_KONFIRMASI"
  | "SUDAH_DIBAYAR"
  | "DIBATALKAN";

export type OrderClient = {
  id: string;
  orderNumber: string;
  productName: string;
  productSlug: string | null;
  productLogoUrl: string | null;
  amount: number;
  status: OrderStatusKey;
  customerName: string;
  customerPhone: string;
  createdAt: string; // ISO
  licenseKey: string | null;
};

export const STATUS_META: Record<OrderStatusKey, { label: string; cls: string }> = {
  BELUM_BAYAR: { label: "Belum Bayar", cls: "bg-line text-fg-sub" },
  MENUNGGU_KONFIRMASI: { label: "Menunggu Konfirmasi", cls: "bg-accent/15 text-accent" },
  SUDAH_DIBAYAR: { label: "Sudah Dibayar", cls: "bg-success/15 text-success" },
  DIBATALKAN: { label: "Dibatalkan", cls: "bg-danger/15 text-danger" },
};

export function StatusBadge({ status }: { status: OrderStatusKey }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

/** Re-renders every second so countdowns stay live. Pass active=false to stop. */
export function useNow(active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/** ms → "HH:MM:SS" (clamped at 0). */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function tanggalID(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
