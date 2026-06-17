import { cn, productAccent } from "@/lib/utils";

type ProductLogoSize = "sm" | "md" | "lg";

type ProductLogoProps = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  size?: ProductLogoSize;
  className?: string;
};

const SIZE_CLASSES: Record<ProductLogoSize, string> = {
  sm: "h-8 w-8",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

export function ProductLogo({
  name,
  slug,
  logoUrl,
  size = "md",
  className,
}: ProductLogoProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-card border border-line bg-bg",
        SIZE_CLASSES[size],
        className
      )}
    >
      {logoUrl ? (
        // Plain <img>: R2 public dev URLs can trip next/image's server fetch,
        // while browser loading works reliably for public product assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <ProductLogoFallback name={name} slug={slug} size={size} />
      )}
    </span>
  );
}

function ProductLogoFallback({
  name,
  slug,
  size,
}: {
  name: string;
  slug: string;
  size: ProductLogoSize;
}) {
  const normalized = slug.toLowerCase();
  const small = size === "sm";
  const compact = size !== "lg";

  if (normalized === "kaemexcel") {
    return (
      <span className="relative grid h-full w-full place-items-center bg-[#123f2a]">
        {!small && (
          <>
            <span className="absolute left-2 top-2 h-8 w-8 rounded-sm bg-[#1f6f43] shadow-card" />
            <span className="absolute right-2 top-3 grid grid-cols-3 gap-0.5 opacity-70">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="h-1.5 w-2 rounded-[1px] bg-white/35" />
              ))}
            </span>
          </>
        )}
        <span
          className={cn(
            "relative font-black leading-none text-white",
            small ? "text-[17px]" : compact ? "text-[27px]" : "text-[34px]"
          )}
        >
          X
        </span>
      </span>
    );
  }

  if (normalized === "kaemform") {
    return (
      <span className="relative grid h-full w-full place-items-center bg-[#4b3710]">
        <span className={cn("absolute rounded-full bg-accent/90", small ? "inset-x-2 top-2 h-0.5" : "inset-x-3 top-3 h-1")} />
        <span className="grid gap-1.5">
          {(small ? [0, 1] : [0, 1, 2]).map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={cn("rounded-sm border border-accent bg-accent/15", small ? "h-1.5 w-1.5" : "h-2 w-2")} />
              <span className={cn("rounded-full bg-white/55", small ? "h-1 w-3.5" : compact ? "h-1.5 w-6" : "h-1.5 w-8")} />
            </span>
          ))}
        </span>
      </span>
    );
  }

  if (normalized === "kaempdf") {
    return (
      <span className="relative grid h-full w-full place-items-center bg-[#4b1517]">
        {!small && (
          <span className="absolute left-1/2 top-2 h-10 w-8 -translate-x-1/2 rounded-sm bg-white shadow-card">
            <span className="absolute right-0 top-0 h-3 w-3 rounded-bl-sm bg-[#f2c4c6]" />
            <span className="absolute left-1.5 top-4 h-0.5 w-5 rounded-full bg-[#d92d35]/70" />
            <span className="absolute left-1.5 top-6 h-0.5 w-4 rounded-full bg-[#d92d35]/50" />
          </span>
        )}
        <span
          className={cn(
            "relative mt-8 rounded-sm bg-[#d92d35] px-1.5 py-0.5 font-black leading-none text-white",
            small ? "mt-0 text-[9px]" : compact ? "text-[11px]" : "text-[13px]"
          )}
        >
          PDF
        </span>
      </span>
    );
  }

  const accent = productAccent(slug);
  return <span className={cn("font-extrabold", compact ? "text-[26px]" : "text-4xl", accent.fg)}>{name[0]}</span>;
}
