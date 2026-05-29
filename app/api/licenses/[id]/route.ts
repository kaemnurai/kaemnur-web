import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/licenses/[id]  (admin only)
// Menghapus lisensi secara permanen. Pembeli yang sedang aktif akan
// kehilangan akses PRO saat pengecekan berikutnya (/api/licenses/validate).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) {
    return NextResponse.json({ error: "Lisensi tidak ditemukan." }, { status: 404 });
  }

  await prisma.license.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
