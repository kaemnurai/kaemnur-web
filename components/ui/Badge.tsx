import { cn } from "@/lib/utils";

type Variant = "free" | "pro" | "new" | "neutral";

const variants: Record<Variant, string> = {
  free: "bg-emerald-100 text-emerald-800",
  pro: "bg-accent/20 text-[#8a6d00]",
  new: "bg-blue-100 text-blue-800",
  neutral: "bg-black/5 text-text-muted",
};

const labels: Record<Variant, string> = {
  free: "FREE",
  pro: "PRO",
  new: "NEW",
  neutral: "",
};

type BadgeProps = {
  variant: Variant;
  className?: string;
  children?: React.ReactNode;
};

export function Badge({ variant, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        variants[variant],
        className
      )}
    >
      {children ?? labels[variant]}
    </span>
  );
}
