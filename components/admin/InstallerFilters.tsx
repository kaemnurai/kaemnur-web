"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Product = { id: string; name: string; slug: string };

export function InstallerFilters({
  products,
  product,
  platform,
}: {
  products: Product[];
  product: string;
  platform: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: "product" | "platform", value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `/admin/installers?${qs}` : "/admin/installers");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={product}
        onChange={(e) => update("product", e.target.value)}
        className="h-9 rounded-btn border border-line bg-card px-2.5 text-[12px] text-fg-sub outline-none focus:border-accent"
      >
        <option value="">Semua product</option>
        {products.map((p) => (
          <option key={p.id} value={p.slug}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={platform}
        onChange={(e) => update("platform", e.target.value)}
        className="h-9 rounded-btn border border-line bg-card px-2.5 text-[12px] text-fg-sub outline-none focus:border-accent"
      >
        <option value="">Semua platform</option>
        <option value="WINDOWS">Windows</option>
        <option value="MAC">macOS</option>
        <option value="LINUX">Linux</option>
      </select>
    </div>
  );
}
