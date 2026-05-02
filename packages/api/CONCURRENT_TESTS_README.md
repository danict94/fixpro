# Concurrent Race Condition Tests

Questo script verifica che le fix per P0-3 (double-refund) e P0-4 (credit double-spend) funzionino correttamente sotto carico concorrente.

## Setup

```bash
cd c:/Users/danie/Desktop/FixPro

# Installare dipendenze
pnpm install

# Assicurare che il database sia online
# (Neon connection string deve essere in .env)
```

## Esecuzione

### Opzione 1: Diretto da PowerShell (Windows)

```powershell
# Installare dipendenze se needed
npm install uuid

# Eseguire il test
npx ts-node -O '{"module":"commonjs"}' packages/api/src/tests/concurrent-race-tests.ts
```

### Opzione 2: Tramite pnpm

```bash
# Aggiungere script a packages/api/package.json
"test:concurrent": "ts-node -O '{\"module\":\"commonjs\"}' src/tests/concurrent-race-tests.ts"

# Eseguire
pnpm --filter @fixpro/api run test:concurrent
```

## Cosa il Test Verifica

### TEST 1: P0-3 Double-Refund Race

**Scenario:** 2 admin approvano lo STESSO rescue in parallelo

**Setup:**
- Crea un rescue nello stato OPEN
- Crea un acquisto (richiesta di rimborso)

**Execution:**
- Admin 1 inizia ad approvare il rescue
- Admin 2 (parallelo) tenta di approvare lo STESSO rescue
- Entrambi acquisiscono lock pessimistico sulla riga rescue (SELECT ... FOR UPDATE)

**Expected Result:**
- ✅ Admin 1: lock acquisito → legge status=PENDING → approva → successo
- ✅ Admin 2: attende lock → legge status=APPROVED (dalla scrittura di Admin 1) → guard fallisce
- ✅ **Risultato finale:** 1 rimborso creato (NO double-refund)

**Verifica DB:**
```sql
SELECT COUNT(*) FROM credit_batches WHERE createdAt > NOW() - INTERVAL '60 seconds';
-- Expected: 1
```

### TEST 2: P0-4 Credit Double-Spend Race

**Scenario:** 2 company spendono crediti dal STESSO batch in parallelo

**Setup:**
- Crea 1 batch con 100 crediti
- Crea 2 richieste (entrambe costano 60 crediti)
- Balance iniziale: 100 crediti

**Execution:**
- Company 1 tenta di spendere 60 crediti
- Company 2 (parallelo) tenta di spendere 60 crediti
- Entrambe acquisiscono lock pessimistico su credit_balance + batch (SELECT ... FOR UPDATE)

**Expected Result:**
- ✅ Company 1: lock acquisito → legge batch.remaining=100 → consuma 60 → successo
- ✅ Company 2: attende lock → legge batch.remaining=40 → insufficiente? O consuma i rimanenti 40 + fallisce?
  - Se implementazione consuma quanto possibile: Company 2 fallisce per insufficient credits
  - Se implementazione consuma esattamente 60: Company 2 fallisce per insufficient credits
- ✅ **Risultato finale:** 1 acquisto creato, balance finale = 40 (NO double-spend)

**Verifica DB:**
```sql
SELECT * FROM credit_batches WHERE id = 'BATCH_ID';
-- Expected: remaining >= 0, never negative
```

## Output Atteso

Se le fix funzionano:

```
╔════════════════════════════════════════════════════════════╗
║         CONCURRENT RACE CONDITION TESTS (P0-3, P0-4)       ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║ TEST 1: P0-3 DOUBLE-REFUND RACE CONDITION                  ║
╚════════════════════════════════════════════════════════════╝

📝 Setup: creating test data...
✓ Test data created

🚀 Launching 2 concurrent rescue approvals...

[ADMIN-1] ⏱️  Started at T+0ms
[ADMIN-1] 🔒 Acquiring lock at T+2ms
[ADMIN-1] ✓ Lock acquired at T+3ms
[ADMIN-2] ⏱️  Started at T+52ms (waiting for lock...)
[ADMIN-2] 🔒 Trying to acquire lock at T+54ms
[ADMIN-1] ✓ Status check passed at T+103ms
[ADMIN-1] ✓ Refund created at T+105ms
[ADMIN-1] ✅ APPROVED at T+105ms (105ms)

[ADMIN-2] ✓ Lock acquired at T+108ms
[ADMIN-2] ❌ FAILED: Rescue already approved (P0-3 guard) (56ms)

📊 RESULTS:
  Admin1: ✅ SUCCESS
  Admin2: ❌ FAILED (Rescue already approved (P0-3 guard))
  Rescue Status: APPROVED
  Refund Batches Created: 1
  Final Balance: 50

✅ TEST PASSED: Only 1 refund was created (no double-refund)

╔════════════════════════════════════════════════════════════╗
║ TEST 2: P0-4 CREDIT DOUBLE-SPEND RACE CONDITION           ║
╚════════════════════════════════════════════════════════════╝

📝 Setup: creating test data...
✓ Test data created

🚀 Launching 2 concurrent credit purchases (60 credits each)...

[COMPANY-1] ⏱️  Started at T+0ms
[COMPANY-1] 🔒 Acquiring balance lock at T+2ms
[COMPANY-1] ✓ Balance lock acquired
[COMPANY-1] ✓ Sufficient balance (100)
[COMPANY-1] 🔒 Locking 1 batch(es) at T+5ms
[COMPANY-1] ✓ Batches locked
[COMPANY-2] ⏱️  Started at T+55ms (waiting for locks...)
[COMPANY-2] 🔒 Trying to acquire balance lock at T+58ms
[COMPANY-1] ✓ Consumed 60 credits
[COMPANY-1] ✅ PURCHASE SUCCESS at T+158ms (158ms)

[COMPANY-2] ✓ Balance lock acquired
[COMPANY-2] ✓ Sufficient balance (40)
[COMPANY-2] 🔒 Locking 1 batch(es) at T+162ms
[COMPANY-2] ✓ Batches locked
[COMPANY-2] ❌ PURCHASE FAILED: Insufficient credits: 40 < 60 (110ms)

📊 RESULTS:
  Company1: ✅ SUCCESS (60 credits)
  Company2: ❌ FAILED (Insufficient credits: 40 < 60)
  Final Batch Remaining: 40
  Final Balance: 40
  Purchases Created: 1

✅ TEST PASSED: Only 1 purchase succeeded (no overspending). Batch integrity preserved.

╔════════════════════════════════════════════════════════════╗
║                    ALL TESTS COMPLETED                      ║
╚════════════════════════════════════════════════════════════╝
```

## Interpretazione Risultati

### ✅ TEST PASSED
- **P0-3:** Esattamente 1 admin riesce ad approvare il rescue
- **P0-4:** Esattamente 1 company riesce a spendere crediti; l'altra fallisce per insufficient balance
- **Invariante:** No double-refund, no credit undershooting, no negative batch remaining

### ❌ TEST FAILED
- Entrambi gli admin riescono ad approvare → 2 refund creati (race condition NON fissa)
- Entrambe le company riescono a spendere → balance diventa negativo o inconsistente (race condition NON fissa)

## Troubleshooting

### Errore: "relation \"rescues\" does not exist"
- Assicurati che le migrazioni Prisma siano state applicate: `pnpm --filter @fixpro/db prisma migrate dev`

### Errore: "CONNECTION_TIMEOUT"
- Verifica che `DATABASE_URL` in `.env` sia valido e Neon sia online
- Prova a connetterti direttamente: `psql $DATABASE_URL`

### Test non deterministico
- A causa della natura concorrente, il test potrebbe avere timing variabile
- Esegui più volte per confermare consistenza
- Se fallisce sporadicamente, significa ancora una race condition (check i lock)

## Note sulla Implementazione

### SELECT ... FOR UPDATE
Questo è il meccanismo di **pessimistic locking** in PostgreSQL. Quando una transazione esegue:
```sql
SELECT id FROM rescues WHERE id = 'x' FOR UPDATE
```

Acquisisce un lock esclusivo sulla riga, impedendo a qualsiasi altra transazione di modificarla finché la transazione non fa COMMIT/ROLLBACK.

### Isolation Level
Neon (PostgreSQL) usa `READ COMMITTED` di default:
- Transazione A vede i commit di B
- Non vede dati non-committed di B
- Pessimistic locks (SELECT ... FOR UPDATE) prevengono read-write conflicts

### Timeout
Se una transazione aspetta un lock per troppo tempo, PostgreSQL lancia `TIMEOUT`. Il nostro script non imposta timeout esplicito, usa il default di Neon (~30s in dev).
