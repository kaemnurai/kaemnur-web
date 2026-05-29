import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { Icon } from "@/components/ui/Icon";

export function ProductSection({
  eyebrow,
  title,
  subtitle,
  seeAllHref,
  products,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-[22px] font-bold text-fg">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] text-fg-sub">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
          >
            See all
            <Icon name="arrow-right" size={12} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
