import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { PublicSidebar } from "@/components/layout/PublicSidebar";
import { UpgradeProvider } from "@/components/sections/UpgradeModal";
import { Toaster } from "@/components/ui/Toast";

// Public pages read live admin-editable data.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <UpgradeProvider products={products}>
      <div className="min-h-screen bg-bg text-fg">
        <Navbar />
        <div className="flex">
          <PublicSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Toaster />
    </UpgradeProvider>
  );
}
