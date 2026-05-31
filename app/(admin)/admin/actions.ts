"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Platform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license";
import { isR2Configured, uploadObject } from "@/lib/r2";

function assertAdmin() {
  if (!isAdminAuthed()) {
    throw new Error("Unauthorized");
  }
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Products ──────────────────────────────────────────────────────────
function parsePricing(form: FormData) {
  const priceFree = form.get("priceFree") === "on";
  const rawAmount = str(form, "priceAmount");
  const priceAmount = rawAmount ? Number(rawAmount) || null : null;
  // Auto-format label if not provided: "Rp 99.000" from 99000
  let priceLabel = str(form, "priceLabel") || null;
  if (!priceLabel && priceAmount) {
    priceLabel = `Rp ${priceAmount.toLocaleString("id-ID")}`;
  }
  return { priceFree, priceAmount, priceLabel };
}

export async function createProduct(form: FormData) {
  assertAdmin();
  const name = str(form, "name");
  const slug = str(form, "slug") || slugify(name);
  const created = await prisma.product.create({
    data: {
      name,
      slug,
      tagline: str(form, "tagline") || null,
      description: str(form, "description"),
      version: str(form, "version") || "1.0.0",
      category: str(form, "category") || "Productivity",
      isFeatured: form.get("isFeatured") === "on",
      ...parsePricing(form),
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
  // Continue to the edit page so media, installers and features can be added.
  redirect(`/admin/products/${created.id}`);
}

export async function updateProduct(form: FormData) {
  assertAdmin();
  const id = str(form, "id");
  const slug = str(form, "slug");
  await prisma.product.update({
    where: { id },
    data: {
      name: str(form, "name"),
      slug,
      tagline: str(form, "tagline") || null,
      description: str(form, "description"),
      version: str(form, "version"),
      category: str(form, "category"),
      isFeatured: form.get("isFeatured") === "on",
      logoUrl: str(form, "logoUrl") || null,
      heroImageUrl: str(form, "heroImageUrl") || null,
      ...parsePricing(form),
    },
  });
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
}

export async function saveProductLogo(id: string, logoUrl: string | null) {
  assertAdmin();
  const product = await prisma.product.update({
    where: { id },
    data: { logoUrl: logoUrl || null },
    select: { slug: true },
  });
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
}

export async function deleteProduct(form: FormData) {
  assertAdmin();
  await prisma.product.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

// ─── Screenshots ───────────────────────────────────────────────────────
export async function addScreenshot(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  const count = await prisma.productScreenshot.count({ where: { productId } });
  await prisma.productScreenshot.create({
    data: { productId, url: str(form, "url"), order: count },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteScreenshot(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  await prisma.productScreenshot.delete({ where: { id: str(form, "id") } });
  revalidatePath(`/admin/products/${productId}`);
}

// Typed variants used by the client-side ScreenshotManager (R2 uploads).
export async function createScreenshot(productId: string, url: string) {
  assertAdmin();
  const count = await prisma.productScreenshot.count({ where: { productId } });
  const created = await prisma.productScreenshot.create({
    data: { productId, url, order: count },
  });
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  revalidatePath(`/admin/products/${productId}`);
  if (product) revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
  return { id: created.id, url: created.url, order: created.order };
}

export async function removeScreenshot(id: string, productId: string) {
  assertAdmin();
  await prisma.productScreenshot.delete({ where: { id } });
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  revalidatePath(`/admin/products/${productId}`);
  if (product) revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
}

// ─── Features ──────────────────────────────────────────────────────────
export async function addFeature(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  await prisma.productFeature.create({
    data: {
      productId,
      text: str(form, "text"),
      isPro: form.get("isPro") === "on",
    },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteFeature(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  await prisma.productFeature.delete({ where: { id: str(form, "id") } });
  revalidatePath(`/admin/products/${productId}`);
}

// ─── Changelogs ────────────────────────────────────────────────────────
export async function addChangelog(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  await prisma.changelog.create({
    data: {
      productId,
      version: str(form, "version"),
      notes: str(form, "notes"),
    },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteChangelog(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  await prisma.changelog.delete({ where: { id: str(form, "id") } });
  revalidatePath(`/admin/products/${productId}`);
}

// ─── Installers ────────────────────────────────────────────────────────
export async function addInstaller(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  const version = str(form, "version");
  const platform = str(form, "platform") as Platform;

  let fileUrl = str(form, "fileUrl");
  let fileSize = Number(str(form, "fileSize")) || 0;

  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (!isR2Configured()) {
      throw new Error("Cloudflare R2 is not configured — provide a direct file URL instead.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `installers/${productId}/${version}/${file.name}`;
    fileUrl = await uploadObject(key, buffer, file.type || "application/octet-stream");
    fileSize = file.size;
  }

  if (!fileUrl) {
    throw new Error("Provide an installer file (R2) or a direct file URL.");
  }

  await prisma.installer.create({
    data: { productId, version, platform, fileUrl, fileSize },
  });
  revalidatePath("/admin/installers");
  revalidatePath("/download");
}

export async function deleteInstaller(form: FormData) {
  assertAdmin();
  await prisma.installer.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/installers");
  revalidatePath("/download");
}

// ─── Licenses ──────────────────────────────────────────────────────────
export async function generateLicense(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  const buyerName = str(form, "buyerName");
  const buyerWhatsapp = str(form, "buyerWhatsapp");
  const quantity = Math.min(Math.max(1, Number(str(form, "quantity")) || 1), 10);

  for (let q = 0; q < quantity; q++) {
    let key = generateLicenseKey();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.license.findUnique({ where: { key } });
      if (!exists) break;
      key = generateLicenseKey();
    }
    await prisma.license.create({
      data: { key, productId, buyerName, buyerWhatsapp },
    });
  }
  revalidatePath("/admin/licenses");
}

export async function toggleLicenseActivation(form: FormData) {
  assertAdmin();
  const id = str(form, "id");
  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return;
  await prisma.license.update({
    where: { id },
    data: {
      isActivated: !license.isActivated,
      activatedAt: !license.isActivated ? new Date() : null,
    },
  });
  revalidatePath("/admin/licenses");
}

export async function deleteLicense(form: FormData) {
  assertAdmin();
  await prisma.license.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/licenses");
}

// Link a license to a Kaemnur account by email (so it shows in /account).
// Empty email unlinks. Throws if no account matches the email.
export async function assignLicenseUser(form: FormData) {
  assertAdmin();
  const id = str(form, "id");
  const email = str(form, "email").toLowerCase();

  let userId: string | null = null;
  if (email) {
    const profile = await prisma.userProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!profile) {
      throw new Error(`Tidak ada akun terdaftar dengan email "${email}".`);
    }
    userId = profile.id;
  }

  await prisma.license.update({ where: { id }, data: { userId } });
  revalidatePath("/admin/licenses");
  revalidatePath("/account");
}

// ─── Installers (per-product, from product edit page) ──────────────────
// addInstaller and deleteInstaller already handle this; additionally
// revalidate the product edit page so it refreshes inline.
export async function addProductInstaller(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  const version = str(form, "version");
  const platform = str(form, "platform") as Platform;
  const fileUrl = str(form, "fileUrl");
  const fileSize = Number(str(form, "fileSize")) || 0;

  if (!fileUrl) throw new Error("File URL is required.");

  await prisma.installer.create({
    data: { productId, version, platform, fileUrl, fileSize },
  });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/installers");
  revalidatePath("/download");
}

export async function deleteProductInstaller(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");
  await prisma.installer.delete({ where: { id: str(form, "id") } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/installers");
  revalidatePath("/download");
}

// ─── Requirements ──────────────────────────────────────────────────────
export async function upsertRequirements(form: FormData) {
  assertAdmin();
  const productId = str(form, "productId");

  for (const type of ["minimum", "recommended"] as const) {
    const existing = await prisma.productRequirement.findFirst({
      where: { productId, type },
    });
    const data = {
      productId,
      type,
      os:   str(form, `${type}_os`)   || null,
      cpu:  str(form, `${type}_cpu`)  || null,
      ram:  str(form, `${type}_ram`)  || null,
      disk: str(form, `${type}_disk`) || null,
    };
    if (existing) {
      await prisma.productRequirement.update({ where: { id: existing.id }, data });
    } else {
      await prisma.productRequirement.create({ data });
    }
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products`);
}
