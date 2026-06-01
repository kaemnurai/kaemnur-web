import { prisma } from "@/lib/prisma";

/**
 * Build a unique order number: ORD-YYYYMMDD-#### (4 random digits).
 * Retries on the rare collision; falls back to a timestamp suffix.
 */
export async function generateUniqueOrderNumber(): Promise<string> {
  const now = new Date();
  const ymd =
    `${now.getFullYear()}` +
    `${String(now.getMonth() + 1).padStart(2, "0")}` +
    `${String(now.getDate()).padStart(2, "0")}`;

  for (let i = 0; i < 8; i++) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const orderNumber = `ORD-${ymd}-${suffix}`;
    const exists = await prisma.order.findUnique({ where: { orderNumber } });
    if (!exists) return orderNumber;
  }
  return `ORD-${ymd}-${Date.now().toString().slice(-4)}`;
}
