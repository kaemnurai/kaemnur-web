import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/admin/products/[id]/ratings/[ratingId]
// Admin only. Removes a single user rating.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; ratingId: string } }
) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.productRating.deleteMany({
    where: { id: params.ratingId, productId: params.id },
  });
  return NextResponse.json({ success: true });
}
