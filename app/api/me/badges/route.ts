import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/me/badges — bottom-nav badges for the current user.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pendingOrders, unreadNotifications] = await Promise.all([
    prisma.order.count({ where: { userId: user.id, status: "MENUNGGU_KONFIRMASI" } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return NextResponse.json({ pendingOrders, unreadNotifications });
}
