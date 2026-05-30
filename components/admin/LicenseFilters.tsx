"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type Product = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
  { value: "expired", label: "Expired" },
];

export function LicenseFilters({ products }: { products: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const firstRender = useRef(true);

  const currentStatus = params.get("status") || "all";
  const currentProduct = params.get("product") || "";

  function pushWith(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page"); // reset to page 1 on any filter change
    router.push(`/admin/licenses?${next.toString()}`);
  }

  // Debounced search → URL
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      pushWith((next) => {
        if (query.trim()) next.set("q", query.trim());
        else next.delete("q");
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Search — full width */}
      <label className="flex h-9 flex-1 items-center gap-2 rounded-btn border border-line bg-bg px-3 text-[13px] focus-within:border-accent/60">
        <Icon name="search" size={14} className="shrink-0 text-fg-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, email, nomor WhatsApp, atau license key…"
          className="flex-1 bg-transparent text-fg outline-none placeholder:text-fg-muted"
        />
      </label>

      {/* Product filter */}
      <select
        value={currentProduct}
        onChange={(e) =>
          pushWith((next) => {
            if (e.target.value) next.set("product", e.target.value);
            else next.delete("product");
          })
        }
        className="h-9 rounded-btn border border-line bg-bg px-3 text-[12px] text-fg outline-none focus:border-accent/60"
      >
        <option value="">Semua Produk</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) =>
          pushWith((next) => {
            if (e.target.value !== "all") next.set("status", e.target.value);
            else next.delete("status");
          })
        }
        className="h-9 rounded-btn border border-line bg-bg px-3 text-[12px] text-fg outline-none focus:border-accent/60"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() =>
          pushWith((next) => {
            if (query.trim()) next.set("q", query.trim());
            else next.delete("q");
          })
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line px-4 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
      >
        <Icon name="filter" size={13} />
        Filter
      </button>
    </div>
  );
}
