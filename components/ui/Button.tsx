import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-ink hover:bg-accent-hover",
  secondary: "bg-ink text-white hover:bg-black",
  ghost: "bg-transparent text-text hover:bg-black/5",
  outline:
    "border border-white/20 bg-transparent text-text-inverse hover:bg-white/5 hover:border-white/40",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

type ButtonOwnProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
};

export type ButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(rest as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
