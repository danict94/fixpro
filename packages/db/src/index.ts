import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton
 *
 * Questo pattern evita istanze multiple di PrismaClient durante hot reload di Next.js.
 * In sviluppo, il client viene salvato in globalThis per riuso tra reload.
 *
 * Context:
 * - Neon PostgreSQL pooler chiude connessioni idle (~30s timeout default in dev)
 * - Se il client viene ricreato ad ogni reload, la vecchia connessione rimane "orfana"
 * - Questo singleton riusa la stessa connessione, prevenendo "PostgreSQL connection closed" sporadic errors
 *
 * Configurazione Neon per stabilità dev:
 * - DATABASE_URL deve includere `statement_timeout` e `idle_in_transaction_session_timeout`
 * - Esempio: postgresql://...?statement_timeout=60000&idle_in_transaction_session_timeout=60000
 * - Questo fa sì che il DB notifichi al client quando una connessione scade, anziché Neon che disconnette silenziosamente
 *
 * Production:
 * - Vercel + Neon gestiscono pooling a livello infrastruttura, nessun cambio necessario
 * - Il singleton pattern rimane identico in produzione
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
