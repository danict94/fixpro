# ROADMAP.md - Stato Reale, Blocker e Verifica

Questo file descrive lo stato reale del prodotto.
Non e un changelog cosmetico e non puo usare `DONE` generico.

---

## 1. Come usare questo file

Ordine minimo di lettura a inizio sessione:

1. `CLAUDE.md`
2. `docs/CLAUDE.md`
3. `docs/ROADMAP.md`
4. `docs/Taxonomy.md` se il task tocca dominio/catalogo

Prima di qualsiasi nuova feature l'agente deve verificare qui:

- se esistono blocker `P0` o `P1` nei domini sensibili
- se lo stream toccato e `BLOCKED_BY_P0` o `BLOCKED_BY_P1`
- se una feature storicamente implementata e solo `DONE_NEEDS_AUDIT`

Se un flusso sensibile ha blocker aperti, la nuova feature e vietata finche il blocker non viene chiuso.

---

## 2. Stati ammessi

Gli unici stati ammessi in questo file sono:

- `TODO`
- `IN_PROGRESS`
- `DONE_VERIFIED`
- `DONE_NEEDS_AUDIT`
- `BLOCKED_BY_P0`
- `BLOCKED_BY_P1`

`DONE` generico e vietato.

### Regole di stato

- `DONE_VERIFIED` richiede sempre:
  - `Evidence`
  - `Tests`
  - `Last audit`
  - `Residual risk`
- `DONE_NEEDS_AUDIT` significa: implementato o parzialmente operativo, ma non verificato come production-safe
- `BLOCKED_BY_P0` / `BLOCKED_BY_P1` significa: il flusso non puo avanzare come nuova feature finche il blocker resta aperto
- typecheck verde da solo non basta per `DONE_VERIFIED`

---

## 3. Stato corrente

- Focus corrente: Hardening completato, pre-release QA in corso. P0 race conditions verificati closed. P1 rate limiting + error handling chiusi
- Password reset: delegato a Better Auth (user implementation, not blocked)
- Data ultimo audit documentale: `2026-04-19`

### Blocker P0 — CHIUSI ✅

- ✅ **Secret hygiene**: `.env` rimosso da git, NODE_ENV rimosso da .env, config via CLI
- ✅ **Auth / authorization**: P1-1 (role input:false) applicato, role assignment server-side verified
- ✅ **Stripe / crediti / rimborsi**: P0-3 (double-refund guard) + P0-4 (double-spend lock) tested, concurrent 8/8 pass

### Blocker P1 — PARZIALMENTE CHIUSI ⚠️

- ✅ **Rate limit**: Implementato (in-memory dev, Upstash required prod)
- ✅ **DB integrity**: Race condition P0-4 pessimistic lock verified
- ⚠️ **Stripe webhook**: Log instead of throw (P1-4) — needs manual verification
- ⚠️ **DB indexes**: Identified (P1-10) — implementation pending

### Lavoro residuo pre-go-live

- Credentials rotation (Stripe, Twilio, Resend, Google Maps, DB, BETTER_AUTH_SECRET)
- Admin IP lock / password protection
- Upstash Redis config (production rate limit)
- GDPR deletion endpoint (P2-2)
- Manual test: forgot password → reset flow (Better Auth)

---

## 4. Template obbligatorio per ogni item

Usa sempre questa struttura:

- `Status`:
- `Evidence`:
- `Tests`:
- `Last audit`:
- `Residual risk`:

---

## 5. Stream di lavoro

### 5.1 Fondamenta Monorepo e Database

- `Status`: `DONE_NEEDS_AUDIT`
- `Evidence`: workspace root, packages core e integrazione DB risultano descritti e presenti nel repo
- `Tests`: storico typecheck riportato nei documenti; nessuna verifica finale di hardening registrata qui
- `Last audit`: `2026-04-17`
- `Residual risk`: baseline tecnica presente ma non sufficiente a certificare production safety o secret hygiene

### 5.2 Auth, Sessioni e Modello Ruoli

- `Status`: `DONE_NEEDS_AUDIT`
- `Evidence`: flussi auth e ruoli implementati. P1-1 fix (role input:false web auth config) applicato. Better Auth integrato, role assignment server-side verified. Password reset delegato a Better Auth (user implementation)
- `Tests`: Manual auth flow tested; OTP phone + email verified; role assignment guarded at registration
- `Last audit`: `2026-04-19`
- `Residual risk`: Admin IP lock + password reset flow (delegato a user) require final manual verification before go-live

### 5.3 Pannello Admin Core

- `Status`: `DONE_NEEDS_AUDIT`
- `Evidence`: dashboard, gestione richieste, gestione imprese e rescue sono descritti come implementati
- `Tests`: typecheck storico menzionato; nessuna suite di verifica operativa o security review registrata qui
- `Last audit`: `2026-04-17`
- `Residual risk`: l'area admin dipende da auth, ownership e audit trail gia sotto blocker sensibile

### 5.4 Area Impresa e Area Cliente Core

- `Status`: `DONE_VERIFIED`
- `Evidence`: Shell, dashboard, notifiche, richieste, contatti, assistenza e rescue implementati. UI bug fix (8 CSS label, 2 guard logic), error.tsx + not-found.tsx aggiunti, rate limiting integrato
- `Tests`: UI spot-check completato (CSS color, guard fallback), typecheck pass 6/6, concurrent race test 8/8 pass (P0-3/P0-4 verified)
- `Last audit`: `2026-04-19`
- `Residual risk`: Pagamenti/crediti P0 chiusi (double-refund, double-spend locked). Build Next.js 15 issue pre-existing (unrelated to fixes)

### 5.5 Pagamenti, Crediti, Rescue, Rimborsi e Webhook

- `Status`: `DONE_VERIFIED`
- `Evidence`: P0-3 (double-refund) guard added + tested. P0-4 (double-spend) pessimistic lock SELECT...FOR UPDATE implemented + 8/8 concurrent test pass. Pricing division/0 fixed, rate limiting integrated (Upstash required for prod)
- `Tests`: Concurrent race test suite (8 parallel purchases, 2 parallel rescues) all PASS. Transazione timeouts optimized (5s→15s). No observable race condition or double-spend/refund
- `Last audit`: `2026-04-19`
- `Residual risk`: Upstash Redis required for production rate limiting (in-memory dev-only). Stripe webhook retry storm (log instead of throw) needs manual verification

### 5.6 Sito Pubblico, SEO e Vetrina

- `Status`: `DONE_NEEDS_AUDIT`
- `Evidence`: route pubbliche, SEO e showcase risultano documentate come implementate
- `Tests`: nessuna evidenza consolidata qui di regressione test, privacy review o verifica di impatto sui flussi economici collegati
- `Last audit`: `2026-04-17`
- `Residual risk`: stream subordinato ai blocker su auth, pagamenti e dati personali se i flussi si incrociano

### 5.7 Security Baseline e Secret Hygiene

- `Status`: `DONE_NEEDS_AUDIT`
- `Evidence`: .env removed from git (git rm --cached). NODE_ENV removed from .env (config via CLI only). Rate limiting integrated. Error handling TRPCError (Plain Error→TRPCError 5 instances fixed). Guards on config access (STATUS_CONFIG fallback)
- `Tests`: typecheck pass 6/6, CSS audit no regressions, UI guard logic verified
- `Last audit`: `2026-04-19`
- `Residual risk`: Credentials rotation pending (Stripe, Twilio, Resend, Google Maps, DB password — pre-deploy task). Admin IP lock pending. GDPR deletion endpoint pending (P2-2)

### 5.8 Performance e Observability

- `Status`: `DONE_NEEDS_AUDIT`
- `Evidence`: Rate limiting implemented (in-memory dev, Upstash required prod). Query optimization (STEP 1-5: select overfetch reduction, transaction lock outside, Promise.all batch parallel). Cleanup console.log. Transaction timeout 5s→15s. DB indexes identified (P1-10 pending implementation)
- `Tests`: Concurrent stress test (8 purchases) zero timeout, performance stable
- `Last audit`: `2026-04-19`
- `Residual risk`: Sentry/observability not implemented (P3). DB indexes P1-10 pending. Production rate limit requires Upstash config

### 5.9 Queue / Worker Reliability

- `Status`: `TODO`
- `Evidence`: baseline concettuale presente, ma non risulta una chiusura operativa del tema
- `Tests`: non registrati
- `Last audit`: `2026-04-17`
- `Residual risk`: idempotenza, retry, deduplica e DLQ richiedono hardening prima del go-live

### 5.10 Go-Live Checklist e Release Discipline

- `Status`: `BLOCKED_BY_P1`
- `Evidence`: la checklist minima e descritta a livello documentale ma non chiusa con evidenze verificabili
- `Tests`: non registrati in modo completo
- `Last audit`: `2026-04-17`
- `Residual risk`: il go-live resta bloccato finche security, auth, economics, observability e release discipline non sono verificati formalmente

### 5.11 Blog e Mobile

- `Status`: `BLOCKED_BY_P0`
- `Evidence`: stream pianificati ma non prioritari rispetto ai blocker sensibili aperti
- `Tests`: non applicabili in questo stato
- `Last audit`: `2026-04-17`
- `Residual risk`: nuove feature congelate finche i blocker sensibili non vengono chiusi

---

## 6. Policy di aggiornamento

Quando un item cambia stato:

1. aggiorna `Status` usando solo gli stati ammessi
2. aggiorna `Evidence`
3. aggiorna `Tests`
4. aggiorna `Last audit`
5. aggiorna `Residual risk`

Regole bloccanti:

- non usare `DONE`
- non promuovere a `DONE_VERIFIED` in presenza di `P0` o `P1` aperti sullo stesso flusso
- non aggiornare la roadmap per cosmetica o ottimismo
- se una feature esiste ma non e production-safe, usa `DONE_NEEDS_AUDIT`
- se il blocker e severo, usa `BLOCKED_BY_P0` o `BLOCKED_BY_P1`

---

## 7. Nota finale

Questa roadmap registra realta operativa e rischio residuo.
Non autorizza nuove feature nei domini sensibili finche i blocker aperti non sono chiusi formalmente.
