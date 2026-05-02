import { prisma } from '@fixpro/db'

export async function getInterventiSEO() {
  return prisma.intervento.findMany({
    where: {
      attivo: true,
    },
    select: {
      nome: true,
      slug: true,
      descrizione: true,
    },
  })
}