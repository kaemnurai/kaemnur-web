"use client";

import { useRouter } from "next/navigation";
import { LineChart } from "@/components/admin/LineChart";

type Period = "7d" | "30d" | "90d" | "ytd";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "ytd", label: "YTD" },
];

type Props = {
  data: number[];
  hasData: boolean;
  days: number;
  period: string;
};

export function DashboardChart({ data, hasData, period }: Props) {
  const router = useRouter();

  function switchPeriod(p: Period) {
    router.push(`/admin?period=${p}`);
  }

  return (
    <section className="rounded-card border border-line bg-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-fg">Downloads · selected period</p>
        <div className="flex items-center gap-1 rounded-btn bg-bg p-0.5 text-[11px]">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => switchPeriod(p.value)}
              className={
                period === p.value
                  ? "rounded bg-card px-2 py-1 font-semibold text-fg"
                  : "px-2 py-1 text-fg-sub hover:text-fg"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>
      {hasData ? (
        <LineChart data={data} yLabel={(v) => String(Math.round(v))} />
      ) : (
        <div className="flex h-[220px] items-center justify-center rounded-btn border border-dashed border-line text-[13px] text-fg-sub">
          No downloads yet — data will appear here once users download.
        </div>
      )}
      <footer className="mt-3 flex items-center justify-between text-[11px] text-fg-sub">
        <span>From DownloadLog table</span>
        <span className="text-accent">{data.reduce((s, v) => s + v, 0)} downloads in period</span>
      </footer>
    </section>
  );
}
