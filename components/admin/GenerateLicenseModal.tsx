"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { buildLicenseDeliveryUrl } from "@/lib/utils";

type Product = { id: string; name: string };

export function GenerateLicenseModal({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setBuyerName("");
    setBuyerWhatsapp("");
    setProductId(products[0]?.id ?? "");
    setError("");
    setCreatedKey(null);
    setCopied(false);
  }

  function close() {
    setOpen(false);
    // Refresh the table if we created something.
    if (createdKey) router.refresh();
    setTimeout(reset, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!buyerName.trim() || !buyerWhatsapp.trim() || !productId) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/licenses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: buyerName.trim(), buyerWhatsapp: buyerWhatsapp.trim(), productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat lisensi.");
        return;
      }
      setCreatedKey(data.key);
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
      >
        <Icon name="plus" size={13} />
        Generate Lisensi Baru
      </button>

      <Modal
        open={open}
        onClose={close}
        title={createdKey ? "Lisensi Berhasil Dibuat" : "Generate Lisensi Baru"}
        subtitle={
          createdKey
            ? "Salin kunci di bawah, atau kirim langsung ke pembeli via WhatsApp."
            : "Buat kunci lisensi PRO yang ditandatangani secara offline."
        }
      >
        {createdKey ? (
          <div className="space-y-4">
            <div className="rounded-btn border border-line bg-bg p-4 text-center">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-muted">Kunci Lisensi</p>
              <p className="font-mono text-[18px] font-bold tracking-wide text-accent">{createdKey}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyKey}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-card text-[13px] font-medium text-fg hover:bg-card-hover"
              >
                <Icon name="copy" size={14} />
                {copied ? "Tersalin!" : "Salin Kunci"}
              </button>
              <a
                href={buildLicenseDeliveryUrl(buyerName, buyerWhatsapp, createdKey)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
              >
                <Icon name="send" size={14} />
                Kirim via WhatsApp
              </a>
            </div>
            <button
              type="button"
              onClick={close}
              className="w-full text-center text-[12px] text-fg-sub hover:text-fg"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="gen-name"
              label="Nama Pembeli"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="cth. Widia"
              required
            />
            <Input
              id="gen-wa"
              label="Nomor WhatsApp"
              value={buyerWhatsapp}
              onChange={(e) => setBuyerWhatsapp(e.target.value)}
              placeholder="cth. 081322118378"
              inputMode="tel"
              required
            />
            <Select
              id="gen-product"
              label="Produk"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              {products.length === 0 && <option value="">Belum ada produk</option>}
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            {error && <p className="text-[12px] text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? "Membuat…" : <><Icon name="key" size={14} /> Buat Lisensi</>}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
