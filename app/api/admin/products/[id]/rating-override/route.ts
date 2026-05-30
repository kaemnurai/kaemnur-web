import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/products/[id]/rating-override
// Body: { override: number (1.0–5.0) | null }
// Sets or clears the ratingOverride on a product.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const raw = body?.override;

  let ratingOverride: number | null = null;
  if (raw !== null && raw !== undefined) {
    const v = Number(raw);
    if (isNaN(v) || v < 1 || v > 5)
      return NextResponse.json(
        { error: "Override must be between 1.0 and 5.0, or null to reset." },
        { status: 400 }
      );
    // Round to 1 decimal place
    ratingOverride = Math.round(v * 10) / 10;
  }

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { ratingOverride },
    select: { id: true, ratingOverride: true },
  });

  return NextResponse.json(updated);
}
