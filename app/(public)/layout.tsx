import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { PublicSidebar } from "@/components/layout/PublicSidebar";
import { UpgradeProvider } from "@/components/sections/UpgradeModal";

// Public pages read live admin-editable data.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, installerCount] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, slug: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.installer.count(),
  ]);

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  return (
    <UpgradeProvider products={products.map((p) => ({ id: p.id, name: p.name }))}>
      <div className="min-h-screen bg-bg text-fg">
        <Navbar />
        <div className="flex">
          <PublicSidebar
            categories={categories}
            installCount={installerCount}
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </UpgradeProvider>
  );
}
