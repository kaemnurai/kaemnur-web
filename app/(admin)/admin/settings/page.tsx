import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Admin · Settings" };

export default async function AdminSettingsPage() {
  const s = await prisma.appSettings.findUnique({ where: { id: "singleton" } });

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Settings"
        subtitle="QRIS pembayaran, kontak admin & donasi"
      />
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <SettingsForm
            initial={{
              qrisImageUrl: s?.qrisImageUrl ?? null,
              qrisName: s?.qrisName ?? null,
              adminWhatsapp: s?.adminWhatsapp ?? null,
              trakteerUrl: s?.trakteerUrl ?? null,
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}
