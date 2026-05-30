import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/admin/ratings/[id]
// Permanently removes a single ProductRating record.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rating = await prisma.productRating.findUnique({ where: { id: params.id } });
  if (!rating)
    return NextResponse.json({ error: "Rating not found" }, { status: 404 });

  await prisma.productRating.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
