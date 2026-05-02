import { prisma } from '../src'

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      galleryImages: true,
      portfolioImages: { select: { url: true } },
    },
  })

  for (const company of companies) {
    if (company.galleryImages.length === 0) continue

    const existingUrls = new Set(company.portfolioImages.map((image) => image.url))
    const missingUrls = company.galleryImages.filter((url) => !existingUrls.has(url))

    for (const url of missingUrls) {
      await prisma.companyPortfolioImage.create({
        data: {
          companyId: company.id,
          url,
          storageKey: null,
        },
      })
    }
  }
}

main()
  .catch((error) => {
    console.error('[backfill-company-portfolio] failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
