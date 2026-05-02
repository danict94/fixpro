type ShowcaseDb = {
  showcaseSubscription: {
    updateMany(args: {
      where: {
        companyId?: string
        status: 'ACTIVE'
        expiresAt: { lte: Date }
      }
      data: { status: 'EXPIRED' }
    }): Promise<{ count: number }>
  }
}

export async function expireShowcaseSubscriptions(
  db: ShowcaseDb,
  input?: { companyId?: string },
): Promise<void> {
  await db.showcaseSubscription.updateMany({
    where: {
      ...(input?.companyId ? { companyId: input.companyId } : {}),
      status: 'ACTIVE',
      expiresAt: { lte: new Date() },
    },
    data: { status: 'EXPIRED' },
  })
}
