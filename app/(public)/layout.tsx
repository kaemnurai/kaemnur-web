import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { PublicSidebar } from "@/components/layout/PublicSidebar";
import { UpgradeProvider } from "@/components/sections/UpgradeModal";
import { Toaster } from "@/components/ui/Toast";
import { BottomNav } from "@/components/ui/BottomNav";
import { NotificationBanner } from "@/components/layout/NotificationBanner";

// Public pages read live admin-editable data, so the route itself stays
// dynamic (per-request HTML). The nav product list barely changes though,
// so the DB read for it is memoized via unstable_cache (Data Cache) — this
// avoids re-querying it on literally every public page view.
export const dynamic = "force-dynamic";

const getNavProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
  ["public-nav-products"],
  { revalidate: 60 }
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await getNavProducts();

  return (
    <UpgradeProvider products={products}>
      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-bg text-fg">
        <Navbar />
        <NotificationBanner />
        <div className="flex">
          <PublicSidebar />
          {/* Reserve space for the fixed mobile bottom nav (h-16 = 4rem) plus the
              device safe-area inset so content is never hidden behind it.
              Desktop has no bottom nav, so the padding is dropped at md. */}
          <main className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <Toaster />
    </UpgradeProvider>
  );
}
