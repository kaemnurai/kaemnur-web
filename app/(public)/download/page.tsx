import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { formatBytes, formatCount, productAccent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Library",
  description: "Download the latest Kaemnur apps — free, offline-first installers.",
};

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

const PLATFORM_ICONS: Record<string, React.ComponentProps<typeof Icon>["name"]> = {
  WINDOWS: "monitor",
  MAC: "apple",
  LINUX: "linux",
};

export default async function DownloadPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { installers: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Your Library
        </p>
        <h1 className="mt-1 text-2xl font-bold text-fg">Download center</h1>
        <p className="mt-1 text-[13px] text-fg-sub">
          Every Kaemnur app is free to install and offline-first. Pick a platform and
          go.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-fg-sub">
          No products available yet.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const accent = productAccent(product.slug);
            const totalSize = product.installers.reduce((s, i) => s + i.fileSize, 0);
            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-card border border-line bg-card p-4 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded text-[15px] font-bold text-bg ${accent.solid}`}
                  >
                    {product.name[0]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="truncate text-[15px] font-semibold text-fg hover:underline"
                      >
                        {product.name}
                      </Link>
                      <span className="font-mono text-[11px] text-fg-sub">
                        v{product.version}
                      </span>
                    </div>
                    <p className="truncate text-[12px] text-fg-sub">
                      {product.category} ·{" "}
                      {formatCount(product.downloadCount)} installs
                      {totalSize > 0 && ` · ${formatBytes(totalSize)}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {product.installers.length === 0 ? (
                    <span className="text-[12px] text-fg-sub">No installer yet</span>
                  ) : (
                    product.installers.map((inst) => (
                      <a
                        key={inst.id}
                        href={`/api/download?id=${inst.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
                      >
                        <Icon
                          name={PLATFORM_ICONS[inst.platform] ?? "download"}
                          size={13}
                        />
                        {PLATFORM_LABELS[inst.platform] ?? inst.platform}
                        <span className="text-bg/60">· {formatBytes(inst.fileSize)}</span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
