"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  badge?: string;
};

const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Has PRO tier" },
];

const PLATFORM_OPTIONS = [
  { value: "windows", label: "Windows" },
  { value: "mac", label: "macOS" },
  { value: "linux", label: "Linux" },
];

export function PublicSidebar({
  categories,
  installCount,
}: {
  categories: string[];
  installCount: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const currentCategory = params.get("category");

  const parseList = useCallback(
    (key: string) =>
      (params.get(key) ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [params]
  );
  const pricingValues = parseList("pricing");
  const platformValues = parseList("platform");

  // Toggle a value within a comma-separated multi-select param (Feature 19)
  const toggleParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = (next.get(key) ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length) next.set(key, updated.join(","));
      else next.delete(key);
      router.push(`/?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-[180px] shrink-0 overflow-y-auto border-r border-line bg-bg lg:block">
      <div className="flex flex-col gap-5 px-3 py-5 text-[13px]">
        {/* YOU */}
        <Section label="YOU">
          <SidebarLink href="/download" label="Library" icon="book" active={pathname === "/download"} />
          <SidebarLink
            href="/download"
            label="Installations"
            icon="download"
            badge={installCount > 0 ? String(installCount) : undefined}
            active={false}
          />
        </Section>

        {/* BROWSE */}
        <Section label="BROWSE">
          <SidebarLink href="/" label="All software" icon="grid" active={pathname === "/" && !currentCategory} />
          {categories.length === 0 ? (
            <p className="px-3 py-1.5 text-[12px] text-fg-muted">No categories yet</p>
          ) : (
            categories.map((cat) => (
              <SidebarLink
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}`}
                label={cat}
                icon="package"
                active={pathname === "/" && currentCategory === cat}
              />
            ))
          )}
        </Section>

        {/* FILTERS */}
        <Section label="FILTERS">
          <div className="px-3 py-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Pricing</p>
            <ul className="space-y-0.5">
              {PRICING_OPTIONS.map((opt) => {
                const checked = pricingValues.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label className={cn("flex cursor-pointer items-center gap-2 rounded-btn px-1 py-1 text-[12px] hover:bg-card/60", checked ? "text-fg" : "text-fg-sub")}>
                      <FilterCheckbox checked={checked} onChange={() => toggleParam("pricing", opt.value)} />
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
            {pricingValues.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {PRICING_OPTIONS.filter((o) => pricingValues.includes(o.value)).map((o) => (
                  <FilterTag key={o.value} label={o.label} onRemove={() => toggleParam("pricing", o.value)} />
                ))}
              </div>
            )}
          </div>
          <div className="px-3 py-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Platform</p>
            <ul className="space-y-0.5">
              {PLATFORM_OPTIONS.map((opt) => {
                const checked = platformValues.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label className={cn("flex cursor-pointer items-center gap-2 rounded-btn px-1 py-1 text-[12px] hover:bg-card/60", checked ? "text-fg" : "text-fg-sub")}>
                      <FilterCheckbox checked={checked} onChange={() => toggleParam("platform", opt.value)} />
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
            {platformValues.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {PLATFORM_OPTIONS.filter((o) => platformValues.includes(o.value)).map((o) => (
                  <FilterTag key={o.value} label={o.label} onRemove={() => toggleParam("platform", o.value)} />
                ))}
              </div>
            )}
          </div>
          {(pricingValues.length > 0 || platformValues.length > 0) && (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.delete("pricing");
                next.delete("platform");
                router.push(`/?${next.toString()}`);
              }}
              className="mx-3 mt-1 flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent-hover"
            >
              <Icon name="x" size={11} />
              Hapus semua filter
            </button>
          )}
        </Section>
      </div>
    </aside>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent/25"
    >
      {label}
      <Icon name="x" size={10} />
    </button>
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
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

function SidebarLink({ href, label, icon, badge, active }: Item & { active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={cn("relative flex items-center gap-2.5 rounded-btn px-3 py-1.5 transition-colors", active ? "bg-card text-fg" : "text-fg-sub hover:bg-card/60 hover:text-fg")}
      >
        {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-accent" />}
        <Icon name={icon} size={14} className={cn(active ? "text-fg" : "text-fg-sub")} />
        <span className="flex-1 truncate">{label}</span>
        {badge && (
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{badge}</span>
        )}
      </Link>
    </li>
  );
}
