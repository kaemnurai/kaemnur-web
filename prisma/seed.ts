import { PrismaClient, Platform } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slug = "kaemdocs";

  // Idempotent: wipe KaemDocs' child rows, then re-create.
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    await prisma.product.delete({ where: { slug } });
  }

  const product = await prisma.product.create({
    data: {
      name: "KaemDocs",
      slug,
      tagline: "Offline-first document automation for administrative work.",
      description:
        "KaemDocs is a lightweight desktop app for generating, editing, and organizing administrative documents — fully offline. Build documents from templates, export to PDF, and keep everything on your own machine. Upgrade to PRO for batch generation, unlimited templates, and data import.",
      version: "1.2.0",
      category: "Documents",
      isFeatured: true,
      downloadCount: 1280,
      screenshots: {
        create: [
          { url: "https://placehold.co/1280x720/1A1A1A/F4B400?text=KaemDocs+Editor", order: 0 },
          { url: "https://placehold.co/1280x720/F5F0E8/1C1C1C?text=Templates", order: 1 },
          { url: "https://placehold.co/1280x720/FFFFFF/1C1C1C?text=PDF+Export", order: 2 },
        ],
      },
      features: {
        create: [
          { text: "Create and edit documents", isPro: false },
          { text: "Export to PDF", isPro: false },
          { text: "Built-in starter templates", isPro: false },
          { text: "Fully offline local storage", isPro: false },
          { text: "Unlimited custom templates", isPro: true },
          { text: "Batch document generation", isPro: true },
          { text: "Data import & mail merge", isPro: true },
          { text: "Custom branding", isPro: true },
        ],
      },
      changelogs: {
        create: [
          {
            version: "1.2.0",
            notes:
              "- Added batch document generation (PRO)\n- Faster PDF export\n- Fixed template rendering on high-DPI displays",
          },
          {
            version: "1.1.0",
            notes: "- New template gallery\n- Offline autosave\n- Minor UI polish",
          },
          {
            version: "1.0.0",
            notes: "- Initial release of KaemDocs",
          },
        ],
      },
      installers: {
        create: [
          {
            version: "1.2.0",
            platform: Platform.WINDOWS,
            fileUrl: "https://example.com/downloads/kaemdocs-1.2.0-setup.exe",
            fileSize: 47185920, // ~45 MB
          },
        ],
      },
    },
  });

  console.log(`Seeded product: ${product.name} (${product.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
