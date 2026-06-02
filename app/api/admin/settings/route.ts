import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/settings — current AppSettings singleton
export async function GET() {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(
    s ?? { id: "singleton", qrisImageUrl: null, qrisName: null, adminWhatsapp: null, trakteerUrl: null }
  );
}

// PUT /api/admin/settings — body { qrisName?, adminWhatsapp?, trakteerUrl? }
export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const data: { qrisName?: string | null; adminWhatsapp?: string | null; trakteerUrl?: string | null } = {};
  if (body?.qrisName !== undefined) data.qrisName = String(body.qrisName ?? "").trim() || null;
  if (body?.adminWhatsapp !== undefined)
    data.adminWhatsapp = String(body.adminWhatsapp ?? "").trim() || null;
  if (body?.trakteerUrl !== undefined)
    data.trakteerUrl = String(body.trakteerUrl ?? "").trim() || null;

  const s = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return NextResponse.json(s);
}
