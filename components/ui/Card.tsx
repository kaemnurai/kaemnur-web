import { cn } from "@/lib/utils";

type CardProps = {
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({ hover = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-card shadow-card border border-black/5",
        hover && "transition-shadow transition-transform hover:shadow-card-hover hover:-translate-y-0.5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
