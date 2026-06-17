import Link from "next/link";
import { ProductLogo } from "@/components/product/ProductLogo";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/utils";

export type TopProduct = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  category: string;
  downloadCount: number;
};

export function TopDownloaded({ products }: { products: TopProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-card">
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="trophy" size={14} className="text-accent" />
            <span className="text-[14px] font-semibold text-fg">Top 10 Aplikasi Terpopuler</span>
          </div>
          <Link href="/download" className="text-[12px] font-medium text-accent hover:underline">
            Lihat semua
          </Link>
        </div>
        <p className="mt-0.5 text-[12px] text-fg-sub">Berdasarkan jumlah unduhan</p>
      </header>
      <ul className="divide-y divide-line">
        {products.map((p, i) => {
          const rank = i + 1;
          return (
            <li key={p.id}>
              <Link
                href={`/products/${p.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-card-hover"
              >
                {/* Rank */}
                <span
                  className={`w-6 shrink-0 text-center text-[15px] font-bold ${
                    rank <= 3 ? "text-accent" : "text-fg-muted"
                  }`}
                >
                  {rank}
                </span>
                {/* Icon */}
                <ProductLogo
                  name={p.name}
                  slug={p.slug}
                  logoUrl={p.logoUrl}
                  size="sm"
                  className="rounded"
                />
                {/* Name + category */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-fg">{p.name}</p>
                  <span className="inline-block rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-fg-sub">
                    {p.category}
                  </span>
                </div>
                {/* Download count */}
                <span className="shrink-0 text-[12px] text-fg-sub">
                  <span className="font-semibold text-fg">{formatCount(p.downloadCount)}</span> unduhan
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
