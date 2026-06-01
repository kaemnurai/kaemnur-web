"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { formatRupiah, isValidIndonesianPhone, normalizeWhatsapp } from "@/lib/utils";
import {
  StatusBadge,
  useNow,
  formatRemaining,
  tanggalID,
  PAY_WINDOW_MS,
  type OrderClient,
} from "./shared";

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const greenBtn =
  "flex h-11 w-full items-center justify-center gap-2 rounded-btn bg-[#25D366] text-[14px] font-semibold text-white transition-opacity hover:opacity-90";

export function TransaksiDetail({
  order,
  qrisImageUrl,
  adminWhatsapp,
}: {
  order: OrderClient;
  qrisImageUrl: string | null;
  adminWhatsapp: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(order.customerPhone);
  const [showQris, setShowQris] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const now = useNow(order.status === "BELUM_BAYAR");
  const remaining = new Date(order.createdAt).getTime() + PAY_WINDOW_MS - now;
  const expired = order.status === "BELUM_BAYAR" && remaining <= 0;

  const waBase = `https://wa.me/${normalizeWhatsapp(adminWhatsapp)}`;
  const template1 =
    `Halo Admin Kaemnur\n\n` +
    `Saya sudah melakukan pembayaran untuk pesanan berikut:\n\n` +
    `No. Pesanan: ${order.orderNumber}\n` +
    `Produk: ${order.productName}\n` +
    `Nominal: Rp ${order.amount.toLocaleString("id-ID")}\n` +
    `Nama: ${order.customerName}\n` +
    `WhatsApp: ${order.customerPhone}\n\n` +
    `Mohon dicek dan dikonfirmasi. Terima kasih.`;
  const template2 =
    `Halo Admin Kaemnur\n\n` +
    `Saya butuh bantuan terkait pesanan berikut:\n\n` +
    `No. Pesanan: ${order.orderNumber}\n` +
    `Produk: ${order.productName}\n\n` +
    `Kendala saya:\n(tulis pertanyaan/kendala Anda di sini)\n\n` +
    `Terima kasih.`;

  function startPay() {
    if (!isValidIndonesianPhone(phone)) {
      toast("Masukkan nomor WhatsApp yang valid (cth. 08xxxxxxxxxx).", "error");
      return;
    }
    setShowQris(true);
  }

  async function confirmPaid() {
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerPhone: phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal memproses pembayaran.");
      toast("Pembayaran dikirim. Menunggu konfirmasi admin.", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan.", "error");
    } finally {
      setPaying(false);
    }
  }

  async function cancelOrder() {
    if (!window.confirm("Batalkan pesanan ini?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan pesanan.");
      toast("Pesanan dibatalkan.", "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan.", "error");
    } finally {
      setCancelling(false);
    }
  }

  async function copyAmount() {
    await navigator.clipboard.writeText(String(order.amount));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <Link href="/transaksi" className="inline-flex items-center gap-1.5 text-[13px] text-fg-sub hover:text-fg">
        <Icon name="arrow-left" size={14} />
        Kembali ke Transaksi
      </Link>

      {/* Summary */}
      <div className="rounded-card border border-line bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {order.productLogoUrl ? (
              <Image
                src={order.productLogoUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-btn bg-bg object-contain"
              />
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-btn bg-bg text-[18px] font-bold text-accent">
                {order.productName[0]}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-bold text-fg">{order.productName}</h1>
              <p className="text-[12px] text-fg-sub">{order.orderNumber}</p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-y-2 border-t border-line pt-4 text-[13px]">
          <span className="text-fg-sub">Tanggal</span>
          <span className="text-right text-fg">{tanggalID(order.createdAt)}</span>
          <span className="text-fg-sub">Nominal</span>
          <span className="text-right font-bold text-accent">{formatRupiah(order.amount)}</span>
        </div>
      </div>

      {/* ── BELUM_BAYAR ── */}
      {order.status === "BELUM_BAYAR" && (
        <div className="rounded-card border border-line bg-card p-5">
          <p className="text-[13px]">
            {expired ? (
              <span className="font-medium text-danger">Waktu pembayaran habis</span>
            ) : (
              <span className="text-fg-sub">
                Sisa waktu bayar:{" "}
                <span className="font-mono text-[15px] font-bold text-fg">{formatRemaining(remaining)}</span>
              </span>
            )}
          </p>

          {!showQris ? (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="phone" className="mb-1 block text-[12px] font-medium text-fg-sub">
                  Nomor WhatsApp
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  inputMode="tel"
                  className="h-10 w-full rounded-btn border border-line bg-bg px-3 text-[14px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={startPay}
                  disabled={expired}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-accent text-[14px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="zap" size={15} />
                  Bayar Sekarang
                </button>
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="flex h-11 items-center justify-center gap-2 rounded-btn border border-danger/50 px-4 text-[14px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                >
                  {cancelling ? <Spinner className="h-4 w-4" /> : "Batalkan Pesanan"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* QRIS */}
              {qrisImageUrl ? (
                <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-bg p-4">
                  <Image
                    src={qrisImageUrl}
                    alt="QRIS"
                    width={260}
                    height={260}
                    className="h-auto w-[260px] max-w-full rounded-md bg-white object-contain"
                  />
                  <p className="text-center text-[12px] text-fg-sub">
                    Scan QR menggunakan aplikasi DANA / e-wallet / m-banking
                  </p>
                </div>
              ) : (
                <div className="rounded-card border border-dashed border-line bg-bg p-6 text-center text-[13px] text-fg-sub">
                  Pembayaran belum tersedia, hubungi admin.
                </div>
              )}

              {/* Amount + copy */}
              <div className="rounded-card border border-line bg-bg p-4 text-center">
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">Nominal Pembayaran</p>
                <p className="mt-1 text-[28px] font-extrabold text-accent">{formatRupiah(order.amount)}</p>
                <button
                  type="button"
                  onClick={copyAmount}
                  className="mx-auto mt-2 inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg transition-colors hover:bg-card-hover"
                >
                  <Icon name="copy" size={13} />
                  {copied ? "Tersalin!" : "Salin Nominal"}
                </button>
              </div>

              {/* Reminder */}
              <div className="flex items-start gap-2.5 rounded-card border border-accent/30 bg-accent/10 p-3.5 text-[12px] text-fg">
                <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0 text-accent" />
                <p>
                  <span className="font-semibold text-accent">PENTING:</span> Masukkan nominal PERSIS{" "}
                  {formatRupiah(order.amount)} saat membayar. Salin angka di atas agar tidak salah.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={confirmPaid}
                  disabled={paying || expired}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-accent text-[14px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paying ? <Spinner className="h-4 w-4" /> : <Icon name="check" size={15} />}
                  Saya Sudah Bayar
                </button>
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="flex h-11 items-center justify-center gap-2 rounded-btn border border-danger/50 px-4 text-[14px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                >
                  {cancelling ? <Spinner className="h-4 w-4" /> : "Batalkan Pesanan"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MENUNGGU_KONFIRMASI ── */}
      {order.status === "MENUNGGU_KONFIRMASI" && (
        <div className="rounded-card border border-line bg-card p-5 space-y-4">
          <div className="flex items-start gap-2.5 rounded-card border border-accent/30 bg-accent/10 p-3.5 text-[13px] text-fg">
            <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-accent" />
            <p>Pembayaran Anda sedang diverifikasi admin (maks 1x24 jam).</p>
          </div>
          <a href={`${waBase}?text=${encodeURIComponent(template1)}`} target="_blank" rel="noopener noreferrer" className={greenBtn}>
            <WhatsAppIcon />
            Hubungi Admin
          </a>
        </div>
      )}

      {/* ── SUDAH_DIBAYAR ── */}
      {order.status === "SUDAH_DIBAYAR" && (
        <div className="rounded-card border border-line bg-card p-5 space-y-4">
          <div className="flex items-start gap-2.5 rounded-card border border-success/30 bg-success/10 p-3.5 text-[13px] text-fg">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
            <p>Pembayaran terkonfirmasi. Terima kasih! Lisensi PRO Anda sudah aktif.</p>
          </div>
          {order.licenseKey && (
            <div className="rounded-card border border-line bg-bg p-4 text-center">
              <p className="text-[11px] uppercase tracking-wide text-fg-muted">Kunci Lisensi</p>
              <p className="mt-1 font-mono text-[16px] font-bold tracking-wide text-accent">{order.licenseKey}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/account?tab=lisensi"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-accent text-[14px] font-semibold text-bg transition-colors hover:bg-accent-hover"
            >
              <Icon name="key" size={15} />
              Cek Lisensi
            </Link>
            <a
              href={`${waBase}?text=${encodeURIComponent(template2)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-[#25D366] text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <WhatsAppIcon />
              Hubungi Admin
            </a>
          </div>
        </div>
      )}

      {/* ── DIBATALKAN ── */}
      {order.status === "DIBATALKAN" && (
        <div className="rounded-card border border-line bg-card p-5 space-y-4 text-center">
          <p className="text-[14px] font-medium text-fg">Pesanan dibatalkan.</p>
          <Link
            href={order.productSlug ? `/products/${order.productSlug}` : "/store"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-accent px-5 text-[14px] font-semibold text-bg transition-colors hover:bg-accent-hover"
          >
            <Icon name="arrow-right" size={15} />
            Beli Lagi
          </Link>
        </div>
      )}
    </div>
  );
}
