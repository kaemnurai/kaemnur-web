import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  trend?: { direction: "up" | "down"; text: string };
  note?: string;
};

export function StatCard({ label, value, trend, note }: Props) {
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
        {label}
      </p>
      <p className="mt-1 text-[26px] font-bold leading-tight text-fg">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              trend.direction === "up" ? "text-success" : "text-danger"
            )}
          >
            <Icon
              name={trend.direction === "up" ? "arrow-up-right" : "arrow-right"}
              size={11}
            />
            {trend.text}
          </span>
        )}
        {note && <span className="text-fg-sub">{note}</span>}
      </div>
    </div>
  );
}
