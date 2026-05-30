import Link from "next/link";
import { productAccent, formatCount } from "@/lib/utils";

export type TopProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  downloadCount: number;
};

export function TopDownloaded({ products }: { products: TopProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-card">
      <header className="border-b border-line px-4 py-3">
        <h2 className="text-[14px] font-semibold text-fg">Top 10 Aplikasi Terpopuler</h2>
        <p className="text-[12px] text-fg-sub">Berdasarkan jumlah unduhan</p>
      </header>
      <ul className="divide-y divide-line">
        {products.map((p, i) => {
          const rank = i + 1;
          const accent = productAccent(p.slug);
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
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded text-[13px] font-bold text-bg ${accent.solid}`}
                >
                  {p.name[0]}
                </span>
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
