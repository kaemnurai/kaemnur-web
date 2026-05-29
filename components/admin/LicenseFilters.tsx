"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Belum Diaktifkan" },
];

export function LicenseFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") || "all";
  const [query, setQuery] = useState(params.get("q") || "");
  const firstRender = useRef(true);

  function pushParams(next: URLSearchParams) {
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
      const next = new URLSearchParams(params.toString());
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");
      pushParams(next);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function setStatus(status: string) {
    const next = new URLSearchParams(params.toString());
    if (status === "all") next.delete("status");
    else next.set("status", status);
    pushParams(next);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="flex h-9 w-full max-w-xs items-center gap-2 rounded-btn border border-line bg-bg px-3">
        <Icon name="search" size={14} className="text-fg-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama pembeli atau WhatsApp…"
          className="flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-muted"
        />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 rounded-btn bg-bg p-0.5 text-[12px]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded px-3 py-1.5 font-medium transition-colors",
              currentStatus === tab.value ? "bg-card text-fg" : "text-fg-sub hover:text-fg"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
