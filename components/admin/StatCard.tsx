import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Tone = "orange" | "emerald" | "accent" | "violet" | "success" | "warning" | "danger";

// Explicit class maps so Tailwind's JIT scanner picks them up — never build
// classnames at runtime.
const TONE_TILE: Record<Tone, string> = {
  orange: "bg-chip-orange/15 text-chip-orange",
  emerald: "bg-chip-emerald/15 text-chip-emerald",
  accent: "bg-accent/15 text-accent",
  violet: "bg-chip-violet/15 text-chip-violet",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

type Props = {
  label: string;
  value: string;
  trend?: { direction: "up" | "down"; text: string };
  note?: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  tone?: Tone;
};

export function StatCard({ label, value, trend, note, icon, tone = "accent" }: Props) {
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
          {label}
        </p>
        {icon && (
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-btn", TONE_TILE[tone])}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <p className="mt-2 text-[26px] font-bold leading-tight text-fg">{value}</p>
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
