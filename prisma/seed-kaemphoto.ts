import { PrismaClient, Platform } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.upsert({
    where: { slug: "kaemphoto" },
    update: {
      name: "KaemPhoto",
      tagline: "Foto formal instan. Tetap privat.",
      description:
        "KaemPhoto adalah aplikasi foto formal offline untuk kebutuhan administrasi, CV, ID card, visa, dan profil profesional. Proses foto berjalan lokal, tanpa upload foto.",
      version: "1.0.0",
      category: "Photo Utility",
      priceFree: true,
      priceAmount: 99000,
      priceLabel: "Rp99.000"
    },
    create: {
      name: "KaemPhoto",
      slug: "kaemphoto",
      tagline: "Foto formal instan. Tetap privat.",
      description:
        "KaemPhoto adalah aplikasi foto formal offline untuk kebutuhan administrasi, CV, ID card, visa, dan profil profesional. Proses foto berjalan lokal, tanpa upload foto.",
      version: "1.0.0",
      category: "Photo Utility",
      isFeatured: false,
      priceFree: true,
      priceAmount: 99000,
      priceLabel: "Rp99.000",
      features: {
        create: [
          { text: "Trial Pro 14 hari", isPro: false },
          { text: "4 template formal Free", isPro: false },
          { text: "10 generate per hari untuk Free", isPro: false },
          { text: "JPG/PNG export", isPro: false },
          { text: "Unlimited generate", isPro: true },
          { text: "Template premium dan background profesional", isPro: true },
          { text: "Prompt AI terarah", isPro: true },
          { text: "Batch processing", isPro: true }
        ]
      },
      installers: {
        create: [
          {
            version: "1.0.0",
            platform: Platform.WINDOWS,
            fileUrl: "https://kaemnur.com/downloads/kaemphoto",
            fileSize: 0,
            sha256: "0".repeat(64) // seed/demo data — not a real file
          }
        ]
      }
    }
  });

  console.log(`Seeded product: ${product.name} (${product.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
