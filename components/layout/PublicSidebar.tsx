"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import NProgress from "nprogress";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Has PRO tier" },
];

const PLATFORM_OPTIONS = [
  { value: "windows", label: "Windows" },
  { value: "mac", label: "macOS" },
  { value: "linux", label: "Linux" },
];

const BROWSE_ITEMS: {
  label: string;
  href: string;
  sort: string;
  icon: React.ComponentProps<typeof Icon>["name"];
}[] = [
  { label: "Top Seller", href: "/store?sort=top-seller", sort: "top-seller", icon: "trophy" },
  { label: "New Releases", href: "/store?sort=new", sort: "new", icon: "sparkles" },
  { label: "All Products", href: "/store", sort: "all", icon: "grid" },
];

function parseList(raw: string | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

export function PublicSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  const appliedPricing = parseList(params.get("pricing"));
  const appliedPlatform = parseList(params.get("platform"));

  // Pending (visual-only) selections — not applied until "Terapkan Filter".
  const [pendingPricing, setPendingPricing] = useState<string[]>(appliedPricing);
  const [pendingPlatform, setPendingPlatform] = useState<string[]>(appliedPlatform);

  // Re-sync pending state whenever the URL filters change (apply / navigation).
  useEffect(() => {
    setPendingPricing(parseList(params.get("pricing")));
    setPendingPlatform(parseList(params.get("platform")));
  }, [params]);

  // Hooks must run unconditionally — bail out (full-width pages) after them.
  if (pathname.startsWith("/products/")) return null;

  const currentSort = params.get("sort") || "all";
  const hasApplied = appliedPricing.length > 0 || appliedPlatform.length > 0;
  const dirty =
    !sameSet(pendingPricing, appliedPricing) || !sameSet(pendingPlatform, appliedPlatform);
  const pendingCount = pendingPricing.length + pendingPlatform.length;

  // Filters apply to the product grid: stay on / or /store, else go to /store.
  const filterBase = pathname === "/" || pathname === "/store" ? pathname : "/store";

  function togglePending(kind: "pricing" | "platform", value: string) {
    if (kind === "pricing") {
      setPendingPricing((cur) =>
        cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]
      );
    } else {
      setPendingPlatform((cur) =>
        cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]
      );
    }
  }

  function applyFilters() {
    if (!dirty) return;
    NProgress.start();
    const next = new URLSearchParams(params.toString());
    if (pendingPricing.length) next.set("pricing", pendingPricing.join(","));
    else next.delete("pricing");
    if (pendingPlatform.length) next.set("platform", pendingPlatform.join(","));
    else next.delete("platform");
    const qs = next.toString();
    router.push(qs ? `${filterBase}?${qs}` : filterBase);
  }

  function clearFilters() {
    NProgress.start();
    const next = new URLSearchParams(params.toString());
    next.delete("pricing");
    next.delete("platform");
    setPendingPricing([]);
    setPendingPlatform([]);
    const qs = next.toString();
    router.push(qs ? `${filterBase}?${qs}` : filterBase);
  }

  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-[200px] shrink-0 overflow-y-auto border-r border-line bg-bg lg:block">
      <div className="flex flex-col gap-5 px-3 py-5 text-[13px]">
        {/* BROWSE */}
        <Section label="BROWSE">
          <ul className="flex flex-col gap-0.5">
          {BROWSE_ITEMS.map((item) => {
            const active = pathname === "/store" && currentSort === item.sort;
            return (
              <li key={item.sort}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors",
                    active ? "bg-card text-fg" : "text-fg-sub hover:bg-card hover:text-fg"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon name={item.icon} size={14} className={active ? "text-accent" : "text-fg-sub"} />
                    {item.label}
                  </span>
                  <Icon name="chevron-right" size={13} className="text-fg-muted" />
                </Link>
              </li>
            );
          })}
          </ul>
        </Section>

        {/* FILTERS */}
        <Section label="FILTERS">
          <div className="px-3 py-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Pricing</p>
            <ul className="space-y-0.5">
              {PRICING_OPTIONS.map((opt) => {
                const checked = pendingPricing.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-btn px-1 py-1 text-[12px] hover:bg-card/60",
                        checked ? "text-fg" : "text-fg-sub"
                      )}
                    >
                      <FilterCheckbox checked={checked} onChange={() => togglePending("pricing", opt.value)} />
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-3 py-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Platform</p>
            <ul className="space-y-0.5">
              {PLATFORM_OPTIONS.map((opt) => {
                const checked = pendingPlatform.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-btn px-1 py-1 text-[12px] hover:bg-card/60",
                        checked ? "text-fg" : "text-fg-sub"
                      )}
                    >
                      <FilterCheckbox checked={checked} onChange={() => togglePending("platform", opt.value)} />
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Apply button — disabled until pending differs from applied */}
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={!dirty}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="filter" size={13} />
              Terapkan Filter{pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
            {hasApplied && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent-hover"
              >
                <Icon name="x" size={11} />
                Hapus semua filter
              </button>
            )}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function FilterCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => e.key === " " && onChange()}
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-sm border transition-colors",
        checked ? "border-accent bg-accent text-bg" : "border-line bg-bg"
      )}
    >
      {checked && <Icon name="check" size={11} strokeWidth={3} />}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">{label}</p>
      {children}
    </div>
  );
}
