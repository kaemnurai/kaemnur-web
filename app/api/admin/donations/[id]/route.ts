import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PUT /api/admin/donations/[id] — body { isApproved }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const isApproved = body?.isApproved === true;
  const updated = await prisma.donation.update({ where: { id: params.id }, data: { isApproved } });
  return NextResponse.json(updated);
}

// DELETE /api/admin/donations/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.donation.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
