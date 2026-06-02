import { NextRequest, NextResponse } from "next/server";
import type { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PUT /api/admin/requests/[id] — body { status?, releasedProductId? }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const data: { status?: RequestStatus; releasedProductId?: string | null } = {};

  const s = body?.status;
  if (s === "OPEN" || s === "PLANNED" || s === "IN_PROGRESS" || s === "RELEASED" || s === "REJECTED") {
    data.status = s;
  }
  if (body?.releasedProductId !== undefined) {
    data.releasedProductId = String(body.releasedProductId ?? "").trim() || null;
  }

  const updated = await prisma.appRequest.update({ where: { id: params.id }, data });
  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    releasedProductId: updated.releasedProductId,
  });
}
