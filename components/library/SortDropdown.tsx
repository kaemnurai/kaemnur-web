"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const OPTIONS = [
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "downloads", label: "Terpopuler" },
];

export function SortDropdown({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "az") next.delete("sort");
    else next.set("sort", value);
    const qs = next.toString();
    router.push(qs ? `/download?${qs}` : "/download");
  }

  return (
    <label className="flex h-9 items-center gap-2 rounded-btn border border-line bg-card px-3 text-[12px] text-fg-sub">
      <span className="shrink-0">Sort by</span>
      <span className="relative flex items-center">
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="cursor-pointer appearance-none bg-transparent pr-5 font-medium text-fg outline-none"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-card text-fg">
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={12} className="pointer-events-none absolute right-0 text-fg-muted" />
      </span>
    </label>
  );
}
