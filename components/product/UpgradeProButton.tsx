"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

// Creates a PRO order for the product, then sends the user to its checkout
// page. Redirects to login (and back) when the user is not signed in.
export function UpgradeProButton({
  productId,
  slug,
  className,
  children,
}: {
  productId: string;
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        router.push(`/login?redirect=/products/${slug}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Gagal membuat pesanan.", "error");
        return;
      }
      router.push(`/transaksi/${data.orderId}`);
    } catch {
      toast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handle} disabled={loading} className={className}>
      {loading ? "Memproses…" : children}
    </button>
  );
}
