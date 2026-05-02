/**
 * Concurrent Race Condition Tests
 *
 * Verifica che le fix per P0-3 (double-refund) e P0-4 (credit race) funzionino realmente.
 * Esegui con: `npx ts-node -O '{"module":"commonjs"}' packages/api/src/tests/concurrent-race-tests.ts`
 */

import { PrismaClient } from '@fixpro/db'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

// ══════════════════════════════════════════════════════════════════════════════
// TEST 1: DOUBLE-REFUND RACE CONDITION (P0-3)
// ══════════════════════════════════════════════════════════════════════════════

async function test_double_refund_race() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║ TEST 1: P0-3 DOUBLE-REFUND RACE CONDITION                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  try {
    // Setup: create test data
    const userId = uuid()
    const companyId = uuid()
    const clientId = uuid()
    const rescueId = uuid()
    const requestId = uuid()

    console.log('📝 Setup: creating test data...')
    console.log(`  - userId: ${userId}`)
    console.log(`  - companyId: ${companyId}`)
    console.log(`  - rescueId: ${rescueId}`)

    // Create user & company
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Test Admin',
        email: `test-admin-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    await prisma.company.create({
      data: {
        id: companyId,
        userId,
        ragioneSociale: 'Test Company Double-Refund',
        slug: `test-company-${Date.now()}`,
      },
    })

    // Create client & request
    await prisma.user.create({
      data: {
        id: clientId,
        name: 'Test Client',
        email: `test-client-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    // Get a categoria for the request
    const categoria = await prisma.categoria.findFirst({ select: { id: true } })
    const categoriaId = categoria?.id || uuid()

    await prisma.serviceRequest.create({
      data: {
        id: requestId,
        clientId,
        categoriaId,
        title: 'Test Request',
        description: 'Test',
        status: 'APPROVED',
      },
    })

    // Create purchase (what will be refunded)
    const purchaseId = uuid()
    await prisma.requestPurchase.create({
      data: {
        id: purchaseId,
        companyId,
        requestId,
        paymentMethod: 'CREDITS',
        creditSpent: 50,
        contactSourceType: 'MARKETPLACE_REQUEST',
      },
    })

    // Create rescue in OPEN state
    await prisma.rescue.create({
      data: {
        id: rescueId,
        companyId,
        requestId,
        reason: 'Quality issue',
        status: 'OPEN',
      },
    })

    // Create initial credit balance
    await prisma.creditBalance.upsert({
      where: { companyId },
      create: { companyId, total: 0 },
      update: { total: 0 },
    })

    console.log('✓ Test data created\n')

    // ─────────────────────────────────────────────────────────────────────────
    // Simulate 2 parallel admin approvals of the same rescue
    // ─────────────────────────────────────────────────────────────────────────

    console.log('🚀 Launching 2 concurrent rescue approvals...\n')

    const startTime = Date.now()
    let approval1Result: { success: boolean; error?: string; duration: number } = { success: false, duration: 0 }
    let approval2Result: { success: boolean; error?: string; duration: number } = { success: false, duration: 0 }

    const approval1 = (async () => {
      const start = Date.now()
      try {
        console.log(`[ADMIN-1] ⏱️  Started at T+${Date.now() - startTime}ms`)

        await prisma.$transaction(
          async (tx) => {
            // Acquire pessimistic lock (P0-3 FIX)
            console.log(`[ADMIN-1] 🔒 Acquiring lock at T+${Date.now() - startTime}ms`)
            await tx.$queryRaw`
              SELECT id, status FROM "rescues" WHERE id = ${rescueId} FOR UPDATE
            `
            console.log(`[ADMIN-1] ✓ Lock acquired at T+${Date.now() - startTime}ms`)

            // Small delay to let other admin try to acquire lock
            await new Promise(resolve => setTimeout(resolve, 100))

            const rescue = await tx.rescue.findUnique({
              where: { id: rescueId },
              select: { id: true, status: true },
            })

            if (rescue?.status === 'APPROVED') {
              throw new Error('Rescue already approved (P0-3 guard)')
            }

            console.log(`[ADMIN-1] ✓ Status check passed at T+${Date.now() - startTime}ms`)

            // Approve
            await tx.rescue.update({
              where: { id: rescueId },
              data: { status: 'APPROVED' },
            })

            // Refund credits
            const purchase = await tx.requestPurchase.findUnique({
              where: { companyId_requestId: { companyId, requestId } },
            })

            if (purchase) {
              await tx.creditBatch.create({
                data: {
                  companyId,
                  amount: purchase.creditSpent,
                  remaining: purchase.creditSpent,
                  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                },
              })

              await tx.creditBalance.update({
                where: { companyId },
                data: { total: 50 },
              })

              console.log(`[ADMIN-1] ✓ Refund created at T+${Date.now() - startTime}ms`)
            }
          },
          { timeout: 10000, maxWait: 10000 }
        )

        approval1Result = { success: true, duration: Date.now() - start }
        console.log(`[ADMIN-1] ✅ APPROVED at T+${Date.now() - startTime}ms (${approval1Result.duration}ms)\n`)
      } catch (err) {
        approval1Result = { success: false, error: String(err), duration: Date.now() - start }
        console.log(`[ADMIN-1] ❌ FAILED: ${err} (${approval1Result.duration}ms)\n`)
      }
    })()

    const approval2 = (async () => {
      // Delay start slightly to let admin1 acquire lock first
      await new Promise(resolve => setTimeout(resolve, 50))

      const start = Date.now()
      try {
        console.log(`[ADMIN-2] ⏱️  Started at T+${Date.now() - startTime}ms (waiting for lock...)`)

        await prisma.$transaction(async (tx) => {
          console.log(`[ADMIN-2] 🔒 Trying to acquire lock at T+${Date.now() - startTime}ms`)
          await tx.$queryRaw`
            SELECT id, status FROM "rescues" WHERE id = ${rescueId} FOR UPDATE
          `
          console.log(`[ADMIN-2] ✓ Lock acquired at T+${Date.now() - startTime}ms`)

          const rescue = await tx.rescue.findUnique({
            where: { id: rescueId },
            select: { id: true, status: true },
          })

          if (rescue?.status === 'APPROVED') {
            throw new Error('Rescue already approved (P0-3 guard)')
          }

          console.log(`[ADMIN-2] ✓ Status check passed at T+${Date.now() - startTime}ms`)

          await tx.rescue.update({
            where: { id: rescueId },
            data: { status: 'APPROVED' },
          })
        })

        approval2Result = { success: true, duration: Date.now() - start }
        console.log(`[ADMIN-2] ✅ APPROVED at T+${Date.now() - startTime}ms (${approval2Result.duration}ms)\n`)
      } catch (err) {
        approval2Result = { success: false, error: String(err), duration: Date.now() - start }
        console.log(`[ADMIN-2] ❌ FAILED: ${err} (${approval2Result.duration}ms)\n`)
      }
    })()

    await Promise.all([approval1, approval2])

    // ─────────────────────────────────────────────────────────────────────────
    // Verify results
    // ─────────────────────────────────────────────────────────────────────────

    const finalRescue = await prisma.rescue.findUnique({
      where: { id: rescueId },
      select: { status: true },
    })

    const refundCount = await prisma.creditBatch.count({
      where: { companyId, createdAt: { gte: new Date(Date.now() - 60000) } },
    })

    const finalBalance = await prisma.creditBalance.findUnique({
      where: { companyId },
      select: { total: true },
    })

    console.log('📊 RESULTS:')
    console.log(`  Admin1: ${approval1Result.success ? '✅ SUCCESS' : `❌ FAILED (${approval1Result.error})`}`)
    console.log(`  Admin2: ${approval2Result.success ? '✅ SUCCESS' : `❌ FAILED (${approval2Result.error})`}`)
    console.log(`  Rescue Status: ${finalRescue?.status}`)
    console.log(`  Refund Batches Created: ${refundCount}`)
    console.log(`  Final Balance: ${finalBalance?.total ?? 0}`)

    // ─────────────────────────────────────────────────────────────────────────
    // Verdict
    // ─────────────────────────────────────────────────────────────────────────

    const successCount = [approval1Result.success, approval2Result.success].filter(Boolean).length
    const testPassed = successCount === 1 && refundCount === 1

    if (testPassed) {
      console.log('\n✅ TEST PASSED: Only 1 refund was created (no double-refund)\n')
    } else {
      console.log(
        `\n❌ TEST FAILED: ${successCount} succeeded, ${refundCount} refunds created (expected 1 success, 1 refund)\n`
      )
    }

    // Cleanup
    await prisma.rescue.delete({ where: { id: rescueId } })
    await prisma.requestPurchase.delete({ where: { id: purchaseId } })
    await prisma.serviceRequest.delete({ where: { id: requestId } })
    await prisma.company.delete({ where: { id: companyId } })
    await prisma.user.deleteMany({ where: { id: { in: [userId, clientId] } } })

  } catch (err) {
    console.error('TEST ERROR:', err)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST 2: CREDIT DOUBLE-SPEND RACE CONDITION (P0-4)
// ══════════════════════════════════════════════════════════════════════════════

async function test_credit_double_spend_race() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║ TEST 2: P0-4 CREDIT DOUBLE-SPEND RACE CONDITION           ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  try {
    // Setup
    const userId = uuid()
    const companyId = uuid()
    const requestId1 = uuid()
    const requestId2 = uuid()
    const batchId = uuid()

    console.log('📝 Setup: creating test data...')
    console.log(`  - companyId: ${companyId}`)
    console.log(`  - batch: 100 credits`)

    // Create company
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Test User',
        email: `test-user-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    await prisma.company.create({
      data: {
        id: companyId,
        userId,
        ragioneSociale: 'Test Company Credit-Race',
        slug: `test-company-${Date.now()}`,
      },
    })

    // Create clients and requests
    const categoria = await prisma.categoria.findFirst({
      select: { id: true },
    })
    const categoriaId = categoria?.id || uuid()

    const client1 = await prisma.user.create({
      data: {
        id: uuid(),
        name: 'Test Client 1',
        email: `test-client1-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    const client2 = await prisma.user.create({
      data: {
        id: uuid(),
        name: 'Test Client 2',
        email: `test-client2-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    await Promise.all([
      prisma.serviceRequest.create({
        data: {
          id: requestId1,
          clientId: client1.id,
          categoriaId: categoriaId,
          title: 'Test Request 1',
          description: 'Test',
          creditCost: 60,
          status: 'APPROVED',
        },
      }),
      prisma.serviceRequest.create({
        data: {
          id: requestId2,
          clientId: client2.id,
          categoriaId: categoriaId,
          title: 'Test Request 2',
          description: 'Test',
          creditCost: 60,
          status: 'APPROVED',
        },
      }),
    ])

    // Create credit batch (100 credits)
    await prisma.creditBatch.create({
      data: {
        id: batchId,
        companyId,
        amount: 100,
        remaining: 100,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })

    // Create credit balance
    await prisma.creditBalance.create({
      data: { companyId, total: 100 },
    })

    console.log('✓ Test data created\n')

    // ─────────────────────────────────────────────────────────────────────────
    // Simulate 2 parallel credit spends from same company, same batch
    // ─────────────────────────────────────────────────────────────────────────

    console.log('🚀 Launching 2 concurrent credit purchases (60 credits each)...\n')

    const startTime = Date.now()
    let spend1Result: { success: boolean; creditsUsed?: number; error?: string; duration: number } = {
      success: false,
      duration: 0,
    }
    let spend2Result: { success: boolean; creditsUsed?: number; error?: string; duration: number } = {
      success: false,
      duration: 0,
    }

    const spend1 = (async () => {
      const start = Date.now()
      try {
        console.log(`[COMPANY-1] ⏱️  Started at T+${Date.now() - startTime}ms`)

        await prisma.$transaction(async (tx) => {
          // P0-4 FIX: Lock credit_balance ALWAYS
          console.log(`[COMPANY-1] 🔒 Acquiring balance lock at T+${Date.now() - startTime}ms`)
          await tx.$queryRaw`
            SELECT id FROM "credit_balances" WHERE "companyId" = ${companyId} FOR UPDATE
          `
          console.log(`[COMPANY-1] ✓ Balance lock acquired`)

          const balance = await tx.creditBalance.findUnique({
            where: { companyId },
          })
          const currentTotal = balance?.total ?? 0

          if (currentTotal < 60) {
            throw new Error(`Insufficient credits: ${currentTotal} < 60`)
          }

          console.log(`[COMPANY-1] ✓ Sufficient balance (${currentTotal})`)

          // Read batches
          const batches = await tx.creditBatch.findMany({
            where: { companyId, remaining: { gt: 0 } },
            orderBy: { expiresAt: 'asc' },
          })

          // P0-4 FIX: Lock ALL batches
          if (batches.length > 0) {
            const batchIds = batches.map(b => b.id)
            console.log(`[COMPANY-1] 🔒 Locking ${batchIds.length} batch(es) at T+${Date.now() - startTime}ms`)
            await tx.$queryRaw`
              SELECT id FROM "credit_batches" WHERE id = ANY(${batchIds}::text[]) FOR UPDATE
            `
            console.log(`[COMPANY-1] ✓ Batches locked`)
          }

          // Small delay to allow other to try
          await new Promise(resolve => setTimeout(resolve, 150))

          // Consume 60 credits
          let remaining = 60
          for (const batch of batches) {
            if (remaining <= 0) break
            const take = Math.min(batch.remaining, remaining)
            await tx.creditBatch.update({
              where: { id: batch.id },
              data: { remaining: batch.remaining - take },
            })
            remaining -= take
          }

          // Update balance
          await tx.creditBalance.update({
            where: { companyId },
            data: { total: currentTotal - 60 },
          })

          console.log(`[COMPANY-1] ✓ Consumed 60 credits`)
        }, { timeout: 10000, maxWait: 10000 })

        spend1Result = { success: true, creditsUsed: 60, duration: Date.now() - start }
        console.log(`[COMPANY-1] ✅ PURCHASE SUCCESS at T+${Date.now() - startTime}ms (${spend1Result.duration}ms)\n`)
      } catch (err) {
        spend1Result = { success: false, error: String(err), duration: Date.now() - start }
        console.log(`[COMPANY-1] ❌ PURCHASE FAILED: ${err} (${spend1Result.duration}ms)\n`)
      }
    })()

    const spend2 = (async () => {
      // Delay start slightly
      await new Promise(resolve => setTimeout(resolve, 50))

      const start = Date.now()
      try {
        console.log(`[COMPANY-2] ⏱️  Started at T+${Date.now() - startTime}ms (waiting for locks...)`)

        await prisma.$transaction(
          async (tx) => {
            console.log(`[COMPANY-2] 🔒 Trying to acquire balance lock at T+${Date.now() - startTime}ms`)
            await tx.$queryRaw`
              SELECT id FROM "credit_balances" WHERE "companyId" = ${companyId} FOR UPDATE
            `
            console.log(`[COMPANY-2] ✓ Balance lock acquired`)

            const balance = await tx.creditBalance.findUnique({
              where: { companyId },
            })
          const currentTotal = balance?.total ?? 0

          if (currentTotal < 60) {
            throw new Error(`Insufficient credits: ${currentTotal} < 60`)
          }

          console.log(`[COMPANY-2] ✓ Sufficient balance (${currentTotal})`)

          const batches = await tx.creditBatch.findMany({
            where: { companyId, remaining: { gt: 0 } },
            orderBy: { expiresAt: 'asc' },
          })

          if (batches.length > 0) {
            const batchIds = batches.map(b => b.id)
            console.log(`[COMPANY-2] 🔒 Locking ${batchIds.length} batch(es) at T+${Date.now() - startTime}ms`)
            await tx.$queryRaw`
              SELECT id FROM "credit_batches" WHERE id = ANY(${batchIds}::text[]) FOR UPDATE
            `
            console.log(`[COMPANY-2] ✓ Batches locked`)
          }

          let remaining = 60
          for (const batch of batches) {
            if (remaining <= 0) break
            const take = Math.min(batch.remaining, remaining)
            await tx.creditBatch.update({
              where: { id: batch.id },
              data: { remaining: batch.remaining - take },
            })
            remaining -= take
          }

          await tx.creditBalance.update({
            where: { companyId },
            data: { total: currentTotal - 60 },
          })

          console.log(`[COMPANY-2] ✓ Consumed 60 credits`)
          },
          { timeout: 10000, maxWait: 10000 }
        )

        spend2Result = { success: true, creditsUsed: 60, duration: Date.now() - start }
        console.log(`[COMPANY-2] ✅ PURCHASE SUCCESS at T+${Date.now() - startTime}ms (${spend2Result.duration}ms)\n`)
      } catch (err) {
        spend2Result = { success: false, error: String(err), duration: Date.now() - start }
        console.log(`[COMPANY-2] ❌ PURCHASE FAILED: ${err} (${spend2Result.duration}ms)\n`)
      }
    })()

    await Promise.all([spend1, spend2])

    // ─────────────────────────────────────────────────────────────────────────
    // Verify results
    // ─────────────────────────────────────────────────────────────────────────

    const finalBatch = await prisma.creditBatch.findUnique({
      where: { id: batchId },
      select: { remaining: true },
    })

    const finalBalance = await prisma.creditBalance.findUnique({
      where: { companyId },
      select: { total: true },
    })

    const purchaseCount = await prisma.requestPurchase.count({
      where: { companyId, purchasedAt: { gte: new Date(Date.now() - 60000) } },
    })

    console.log('📊 RESULTS:')
    console.log(`  Company1: ${spend1Result.success ? `✅ SUCCESS (${spend1Result.creditsUsed} credits)` : `❌ FAILED (${spend1Result.error})`}`)
    console.log(`  Company2: ${spend2Result.success ? `✅ SUCCESS (${spend2Result.creditsUsed} credits)` : `❌ FAILED (${spend2Result.error})`}`)
    console.log(`  Final Batch Remaining: ${finalBatch?.remaining ?? 'N/A'}`)
    console.log(`  Final Balance: ${finalBalance?.total ?? 0}`)
    console.log(`  Purchases Created: ${purchaseCount}`)

    // ─────────────────────────────────────────────────────────────────────────
    // Verdict
    // ─────────────────────────────────────────────────────────────────────────

    const successCount = [spend1Result.success, spend2Result.success].filter(Boolean).length
    const expectedRemaining = 100 - successCount * 60
    const testPassed =
      successCount === 1 && (finalBalance?.total ?? 0) === expectedRemaining && (finalBatch?.remaining ?? 0) >= 0

    if (testPassed) {
      console.log(
        `\n✅ TEST PASSED: Only 1 purchase succeeded (no overspending). Batch integrity preserved.\n`
      )
    } else {
      console.log(
        `\n❌ TEST FAILED: ${successCount} purchases succeeded (expected 1). Final balance: ${finalBalance?.total}, remaining: ${finalBatch?.remaining}\n`
      )
    }

    // Cleanup
    await Promise.all([
      prisma.creditBatch.deleteMany({ where: { companyId } }),
      prisma.creditBalance.delete({ where: { companyId } }).catch(() => {}),
      prisma.requestPurchase.deleteMany({ where: { companyId } }),
      prisma.serviceRequest.deleteMany({ where: { id: { in: [requestId1, requestId2] } } }),
      prisma.company.delete({ where: { id: companyId } }),
    ])
  } catch (err) {
    console.error('TEST ERROR:', err)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST 3: STRESS TEST — 5–10 PARALLEL PURCHASES (P0-4 EXTENDED)
// ══════════════════════════════════════════════════════════════════════════════

async function test_stress_parallel_purchases() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║ TEST 3: STRESS TEST — 5-10 PARALLEL PURCHASES (P0-4)       ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  try {
    const NUM_PARALLEL = 8 // 5-10 range
    const CREDIT_POOL = 1000
    const CREDITS_PER_PURCHASE = 100

    // Setup: create test company with large credit batch
    const userId = uuid()
    const companyId = uuid()
    const batchId = uuid()

    console.log(`📝 Setup: creating stress test data (${NUM_PARALLEL} parallel purchases)...`)
    console.log(`  - companyId: ${companyId}`)
    console.log(`  - Initial pool: ${CREDIT_POOL} credits`)
    console.log(`  - Per purchase: ${CREDITS_PER_PURCHASE} credits`)

    // Create user & company
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Stress Test User',
        email: `test-stress-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    await prisma.company.create({
      data: {
        id: companyId,
        userId,
        ragioneSociale: 'Stress Test Company',
        slug: `stress-company-${Date.now()}`,
      },
    })

    // Create credit balance & batch
    await prisma.creditBalance.create({
      data: {
        companyId,
        total: CREDIT_POOL,
      },
    })

    await prisma.creditBatch.create({
      data: {
        id: batchId,
        companyId,
        amount: CREDIT_POOL,
        remaining: CREDIT_POOL,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })

    // Create dummy clients and requests
    const categoria = await prisma.categoria.findFirst({ select: { id: true } })
    const categoriaId = categoria?.id || uuid()

    const clients = await Promise.all(
      Array(NUM_PARALLEL)
        .fill(null)
        .map(() =>
          prisma.user.create({
            data: {
              id: uuid(),
              name: `Stress Test Client`,
              email: `stress-client-${Date.now()}-${Math.random()}@test.local`,
              emailVerified: true,
            },
          })
        )
    )

    const requestIds = await Promise.all(
      Array(NUM_PARALLEL)
        .fill(null)
        .map((_, i) =>
          prisma.serviceRequest.create({
            data: {
              id: uuid(),
              clientId: clients[i]!.id,
              categoriaId,
              title: `Stress Test Request`,
              description: 'Stress test',
              status: 'APPROVED',
            },
          })
        )
    )

    console.log(`✓ Test data created\n`)

    // ─────────────────────────────────────────────────────────────────────────
    // Launch parallel purchases with random delays
    // ─────────────────────────────────────────────────────────────────────────

    console.log(`🚀 Launching ${NUM_PARALLEL} concurrent purchases...\n`)

    const startTime = Date.now()
    const results: Array<{ index: number; success: boolean; creditsUsed: number; duration: number; error?: string }> = []
    const purchases: Promise<void>[] = []

    for (let i = 0; i < NUM_PARALLEL; i++) {
      const index = i
      const requestId = requestIds[i]!.id

      purchases.push(
        (async () => {
          const randomDelay = Math.random() * 200 // 0-200ms random delay
          await new Promise(resolve => setTimeout(resolve, randomDelay))

          const purchaseId = uuid()
          const start = Date.now()

          try {
            console.log(`[BUYER-${index + 1}] ⏱️  Started at T+${Date.now() - startTime}ms (delay: ${Math.round(randomDelay)}ms)`)

            // STEP 2: Fetch batches OUTSIDE transaction (reduce lock contention)
            const batches = await prisma.creditBatch.findMany({
              where: { companyId, remaining: { gt: 0 } },
              select: { id: true, remaining: true },
              orderBy: { createdAt: 'asc' },
            })

            // Simulate the pessimistic lock from purchaseWithCredits
            await prisma.$transaction(
              async tx => {
                console.log(`[BUYER-${index + 1}] 🔒 Acquiring balance lock at T+${Date.now() - startTime}ms`)

                // Lock credit balance (P0-4 fix: ALWAYS lock, even for 0-cost purchases)
                await tx.$queryRaw`
                  SELECT id FROM "credit_balances" WHERE "companyId" = ${companyId} FOR UPDATE
                `

                console.log(`[BUYER-${index + 1}] ✓ Lock acquired`)

                // Read current balance
                const balance = await tx.creditBalance.findUnique({
                  where: { companyId },
                  select: { total: true },
                })

                if (!balance || balance.total < CREDITS_PER_PURCHASE) {
                  throw new Error(
                    `Insufficient credits: ${balance?.total ?? 0} < ${CREDITS_PER_PURCHASE}`
                  )
                }

                console.log(`[BUYER-${index + 1}] ✓ Sufficient balance (${balance.total})`)

                // Lock all affected batches (already fetched)
                if (batches.length > 0) {
                  const batchIds = batches.map(b => b.id)
                  await tx.$queryRaw`
                    SELECT id FROM "credit_batches" WHERE id = ANY(${batchIds}::text[]) FOR UPDATE
                  `
                }

                console.log(`[BUYER-${index + 1}] 🔒 Locked ${batches.length} batch(es)`)

                // STEP 3: Parallelize batch updates with Promise.all
                let remaining = CREDITS_PER_PURCHASE
                const batchUpdates = []
                for (const batch of batches) {
                  if (remaining <= 0) break
                  const take = Math.min(batch.remaining, remaining)
                  batchUpdates.push(
                    tx.creditBatch.update({
                      where: { id: batch.id },
                      data: { remaining: batch.remaining - take },
                    })
                  )
                  remaining -= take
                }

                // Wait for all batch updates in parallel
                if (batchUpdates.length > 0) {
                  await Promise.all(batchUpdates)
                }

                // Update balance
                await tx.creditBalance.update({
                  where: { companyId },
                  data: { total: balance.total - CREDITS_PER_PURCHASE },
                })

                // Create purchase record
                await tx.requestPurchase.create({
                  data: {
                    id: purchaseId,
                    companyId,
                    requestId,
                    paymentMethod: 'CREDITS',
                    creditSpent: CREDITS_PER_PURCHASE,
                    contactSourceType: 'MARKETPLACE_REQUEST',
                  },
                })

                console.log(`[BUYER-${index + 1}] ✓ Consumed ${CREDITS_PER_PURCHASE} credits`)
              },
              { timeout: 15000, maxWait: 15000 }
            )

            const duration = Date.now() - start
            results[index] = { index: index + 1, success: true, creditsUsed: CREDITS_PER_PURCHASE, duration }
            console.log(`[BUYER-${index + 1}] ✅ SUCCESS at T+${Date.now() - startTime}ms (${duration}ms)\n`)
          } catch (err) {
            const duration = Date.now() - start
            results[index] = { index: index + 1, success: false, creditsUsed: 0, duration, error: String(err) }
            console.log(`[BUYER-${index + 1}] ❌ FAILED: ${err} (${duration}ms)\n`)
          }
        })()
      )
    }

    await Promise.all(purchases)

    // ─────────────────────────────────────────────────────────────────────────
    // Verify results
    // ─────────────────────────────────────────────────────────────────────────

    const finalBalance = await prisma.creditBalance.findUnique({
      where: { companyId },
      select: { total: true },
    })

    const finalBatch = await prisma.creditBatch.findUnique({
      where: { id: batchId },
      select: { remaining: true },
    })

    const totalPurchases = await prisma.requestPurchase.count({
      where: { companyId, purchasedAt: { gte: new Date(Date.now() - 60000) } },
    })

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    const totalCreditsSpent = results.filter(r => r.success).reduce((sum, r) => sum + r.creditsUsed, 0)
    const expectedBalance = CREDIT_POOL - totalCreditsSpent

    console.log('📊 STRESS TEST RESULTS:')
    console.log(`  Total Attempts: ${NUM_PARALLEL}`)
    console.log(`  Successful: ${successCount}`)
    console.log(`  Failed: ${failureCount}`)
    console.log(`  Total Credits Spent: ${totalCreditsSpent}`)
    console.log(`  Final Balance: ${finalBalance?.total ?? 0}`)
    console.log(`  Final Batch Remaining: ${finalBatch?.remaining ?? 0}`)
    console.log(`  Total Purchases Created: ${totalPurchases}`)

    // ─────────────────────────────────────────────────────────────────────────
    // Verdict
    // ─────────────────────────────────────────────────────────────────────────

    const balanceValid = finalBalance?.total === expectedBalance
    const batchValid = (finalBatch?.remaining ?? 0) >= 0
    const purchasesValid = totalPurchases === successCount
    const noNegative = (finalBalance?.total ?? 0) >= 0 && (finalBatch?.remaining ?? 0) >= 0
    const noDoubleSpend = totalCreditsSpent <= CREDIT_POOL

    const testPassed = balanceValid && batchValid && purchasesValid && noNegative && noDoubleSpend

    console.log('\n📋 VALIDATION CHECKS:')
    console.log(`  ${balanceValid ? '✅' : '❌'} Balance matches expected (${finalBalance?.total} === ${expectedBalance})`)
    console.log(`  ${batchValid ? '✅' : '❌'} Batch remaining non-negative (${finalBatch?.remaining ?? 0} >= 0)`)
    console.log(`  ${purchasesValid ? '✅' : '❌'} Purchases count matches successes (${totalPurchases} === ${successCount})`)
    console.log(`  ${noNegative ? '✅' : '❌'} No negative balances`)
    console.log(`  ${noDoubleSpend ? '✅' : '❌'} No overspending (${totalCreditsSpent} <= ${CREDIT_POOL})`)

    if (testPassed) {
      console.log(
        `\n✅ TEST PASSED: ${successCount}/${NUM_PARALLEL} purchases succeeded, no double-spend, no crashes.\n`
      )
    } else {
      console.log(
        `\n❌ TEST FAILED: Invariants violated. Balance: ${finalBalance?.total}, Batch: ${finalBatch?.remaining}, Purchases: ${totalPurchases}\n`
      )
    }

    // Cleanup
    await Promise.all([
      prisma.creditBatch.deleteMany({ where: { companyId } }),
      prisma.creditBalance.delete({ where: { companyId } }).catch(() => {}),
      prisma.requestPurchase.deleteMany({ where: { companyId } }),
      prisma.serviceRequest.deleteMany({ where: { id: { in: requestIds.map(r => r.id) } } }),
      prisma.company.delete({ where: { id: companyId } }),
    ])
  } catch (err) {
    console.error('TEST ERROR:', err)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         CONCURRENT RACE CONDITION TESTS (P0-3, P0-4)       ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  try {
    await test_double_refund_race()
    await test_credit_double_spend_race()
    await test_stress_parallel_purchases()

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    ALL TESTS COMPLETED                      ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')
  } catch (err) {
    console.error('FATAL ERROR:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
