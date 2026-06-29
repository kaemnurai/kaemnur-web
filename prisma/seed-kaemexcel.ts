import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.upsert({
    where: { slug: "kaemexcel" },
    update: {
      name: "KaemExcel",
      tagline: "Spreadsheet automation, right inside Excel.",
      description:
        "KaemExcel is an Excel add-in for spreadsheet automation and productivity tooling. Upgrade to PRO for the full feature set.",
      version: "1.0.0",
      category: "Productivity",
      priceFree: true,
      priceAmount: 99000,
      priceLabel: "Rp99.000",
    },
    create: {
      name: "KaemExcel",
      slug: "kaemexcel",
      tagline: "Spreadsheet automation, right inside Excel.",
      description:
        "KaemExcel is an Excel add-in for spreadsheet automation and productivity tooling. Upgrade to PRO for the full feature set.",
      version: "1.0.0",
      category: "Productivity",
      isFeatured: false,
      priceFree: true,
      priceAmount: 99000,
      priceLabel: "Rp99.000",
    },
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
