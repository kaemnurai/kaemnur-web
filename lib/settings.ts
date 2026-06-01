import { prisma } from "@/lib/prisma";

export type AppSettingsData = {
  qrisImageUrl: string | null;
  qrisName: string | null;
  adminWhatsapp: string | null;
};

const FALLBACK_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6282111990423";

/** Read the singleton AppSettings row (returns nulls when unset). */
export async function getAppSettings(): Promise<AppSettingsData> {
  const s = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  return {
    qrisImageUrl: s?.qrisImageUrl ?? null,
    qrisName: s?.qrisName ?? null,
    adminWhatsapp: s?.adminWhatsapp ?? null,
  };
}

/** Admin WhatsApp for "Hubungi Admin" links, falling back to the env number. */
export function adminWhatsappOrFallback(adminWhatsapp: string | null): string {
  return adminWhatsapp && adminWhatsapp.trim() ? adminWhatsapp.trim() : FALLBACK_WA;
}
