import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/donations — all donations (admin).
export async function GET() {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const donations = await prisma.donation.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(donations);
}

// POST /api/admin/donations — body { donorName, amount, message?, isApproved? }
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const donorName = String(body?.donorName ?? "").trim();
  const amount = Math.round(Number(body?.amount) || 0);
  const message = String(body?.message ?? "").trim() || null;
  const isApproved = body?.isApproved === true;

  if (!donorName) return NextResponse.json({ error: "Nama donatur wajib diisi." }, { status: 400 });
  if (amount <= 0) return NextResponse.json({ error: "Nominal harus lebih dari 0." }, { status: 400 });

  const created = await prisma.donation.create({ data: { donorName, amount, message, isApproved } });
  return NextResponse.json(created, { status: 201 });
}
