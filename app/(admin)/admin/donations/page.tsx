import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { DonationsManager } from "@/components/admin/DonationsManager";

export const metadata = { title: "Admin · Donations" };

export default async function AdminDonationsPage() {
  const donations = await prisma.donation.findMany({ orderBy: { createdAt: "desc" } });
  const approved = donations.filter((d) => d.isApproved).length;

  const items = donations.map((d) => ({
    id: d.id,
    donorName: d.donorName,
    amount: d.amount,
    message: d.message,
    isApproved: d.isApproved,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Donasi"
        subtitle={`${donations.length} donasi · ${approved} approved`}
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          <DonationsManager donations={items} />
        </div>
      </div>
    </AdminShell>
  );
}
