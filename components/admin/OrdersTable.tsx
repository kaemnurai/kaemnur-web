"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { formatRupiah, normalizeWhatsapp } from "@/lib/utils";
import { StatusBadge, tanggalID, type OrderStatusKey } from "@/components/transaksi/shared";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  productSlug: string | null;
  productLogoUrl: string | null;
  amount: number;
  status: OrderStatusKey;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  paidClickedAt: string | null;
  approvedBy: string | null;
  licenseKey: string | null;
};

const PAY_WINDOW_H = 24;

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function AgeBadge({ o }: { o: AdminOrder }) {
  if (o.status !== "BELUM_BAYAR") return <span className="text-fg-muted">—</span>;
  const h = hoursSince(o.createdAt);
  if (h >= PAY_WINDOW_H) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
        ⚠️ Lewat 24 jam
      </span>
    );
  }
  const left = Math.max(1, Math.ceil(PAY_WINDOW_H - h));
  return (
    <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
      ⏳ {left} jam lagi
    </span>
  );
}

function buildWhatsappUrl(o: AdminOrder): string {
  const phone = normalizeWhatsapp(o.customerPhone);
  const message =
    `Halo ${o.customerName}\n\n` +
    `Terima kasih telah membeli ${o.productName}.\n\n` +
    `Berikut lisensi Anda:\n${o.licenseKey ?? ""}\n\n` +
    `Cara aktivasi:\n` +
    `1. Buka aplikasi ${o.productName}\n` +
    `2. Masukkan lisensi di menu aktivasi\n` +
    `3. Lisensi berlaku seumur hidup\n\n` +
    `Lisensi juga tersimpan di akun Anda: https://kaemnur.com/account\n\n` +
    `Butuh bantuan? Balas pesan ini.\n` +
    `Tim Kaemnur`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminOrder[]>(orders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, force] = useState(0);

  // Keep local rows in sync when the server re-renders with fresh data.
  useEffect(() => setRows(orders), [orders]);
  // Refresh age badges roughly every minute.
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  function patchRow(id: string, patch: Partial<AdminOrder>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function approve(o: AdminOrder) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal menyetujui pesanan.");
      patchRow(o.id, { status: "SUDAH_DIBAYAR", licenseKey: data.licenseKey });
      toast("Pesanan disetujui. Lisensi dibuat.", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function reject(o: AdminOrder, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}/reject`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan pesanan.");
      patchRow(o.id, { status: "DIBATALKAN" });
      toast("Pesanan dibatalkan.", "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="overflow-x-auto rounded-card border border-line bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-fg-sub">Tidak ada transaksi.</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">No. Pesanan</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Umur</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-card-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{o.customerName}</p>
                    <p className="text-[11px] text-fg-sub">{o.customerPhone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-fg">{o.productName}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-fg-sub">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-semibold text-accent">{formatRupiah(o.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3"><AgeBadge o={o} /></td>
                  <td className="px-4 py-3 text-[12px] text-fg-sub">{tanggalID(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-btn border border-line px-2.5 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal
        open={selected !== null}
        onClose={() => (busy ? undefined : setSelectedId(null))}
        title={selected ? `Pesanan ${selected.orderNumber}` : ""}
        subtitle="Detail transaksi pelanggan"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.status} />
              <span className="text-[15px] font-bold text-accent">{formatRupiah(selected.amount)}</span>
            </div>

            <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
              <dt className="text-fg-sub">Produk</dt>
              <dd className="text-fg">{selected.productName}</dd>
              <dt className="text-fg-sub">Nama</dt>
              <dd className="text-fg">{selected.customerName}</dd>
              <dt className="text-fg-sub">WhatsApp</dt>
              <dd className="text-fg">{selected.customerPhone || "—"}</dd>
              <dt className="text-fg-sub">Dibuat</dt>
              <dd className="text-fg">{tanggalID(selected.createdAt)}</dd>
              <dt className="text-fg-sub">Klik Bayar</dt>
              <dd className="text-fg">{selected.paidClickedAt ? tanggalID(selected.paidClickedAt) : "—"}</dd>
              {selected.approvedBy && (
                <>
                  <dt className="text-fg-sub">Disetujui oleh</dt>
                  <dd className="text-fg">{selected.approvedBy}</dd>
                </>
              )}
            </dl>

            {selected.status === "SUDAH_DIBAYAR" && selected.licenseKey && (
              <div className="rounded-btn border border-line bg-bg p-4 text-center">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-muted">Kunci Lisensi</p>
                <p className="font-mono text-[16px] font-bold tracking-wide text-accent">{selected.licenseKey}</p>
              </div>
            )}

            {/* Actions */}
            {selected.status === "MENUNGGU_KONFIRMASI" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => approve(selected)}
                  disabled={busy}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-btn bg-[#16a34a] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? <Spinner className="h-4 w-4" /> : <Icon name="check" size={14} />}
                  Approve &amp; Generate Lisensi
                </button>
                <button
                  type="button"
                  onClick={() => reject(selected, "Tolak pesanan ini?")}
                  disabled={busy}
                  className="flex h-10 items-center justify-center gap-2 rounded-btn border border-danger/50 px-4 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                >
                  Tolak
                </button>
              </div>
            )}

            {selected.status === "SUDAH_DIBAYAR" && (
              <a
                href={buildWhatsappUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-[#25D366] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Icon name="send" size={14} />
                Kirim ke WhatsApp
              </a>
            )}

            {selected.status === "BELUM_BAYAR" && hoursSince(selected.createdAt) >= PAY_WINDOW_H && (
              <button
                type="button"
                onClick={() => reject(selected, "Batalkan pesanan yang lewat 24 jam ini?")}
                disabled={busy}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-danger/50 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                {busy ? <Spinner className="h-4 w-4" /> : "Batalkan (Lewat 24 jam)"}
              </button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
