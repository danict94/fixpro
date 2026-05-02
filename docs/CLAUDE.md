# fixpro PLATFORM - Governance Primaria

Questo documento e la fonte primaria di governance operativa del progetto.
Tutte le altre istruzioni di repository, comandi slash, skill e note operative devono essere compatibili con questo file.

---

## 1. Gerarchia delle fonti

Ordine di precedenza obbligatorio:

1. `docs/CLAUDE.md` - governance primaria del progetto
2. `docs/ROADMAP.md` - stato reale del prodotto, blocker, avanzamento, policy stati
3. `.claude/commands/new-feature.md` - preflight obbligatorio prima di ogni nuova feature
4. `.claude/commands/check-duplicates.md` - gate obbligatorio prima di nuove strutture o shared routes/pattern
5. `.claude/skills/neon-postgres/SKILL.md` - regole DB/Postgres/Prisma/Neon specifiche di progetto
6. `.agents/skills/neon-postgres/SKILL.md` - mirror stub, mai fonte primaria
7. `.claude/settings.json` e `.claude/settings.local.json` - permessi runtime, non policy di prodotto

Se un file secondario confligge con questo documento, prevale sempre `docs/CLAUDE.md`.

---

## 2. Bootstrap di sessione

All'inizio di ogni sessione l'agente deve:

1. leggere `CLAUDE.md`
2. leggere questo file (`docs/CLAUDE.md`)
3. leggere `docs/ROADMAP.md`
4. leggere `docs/Taxonomy.md` se il task tocca catalogo, matching, SEO, form richiesta, profili impresa, pricing/admin logic, settori, categorie o servizi
5. ispezionare codice, schema, router, componenti shared e pattern esistenti prima di proporre modifiche

Prima di scrivere codice o modificare file, l'agente deve sempre esplicitare:

- blocker P0/P1 rilevanti
- file che intende toccare
- modelli o entita coinvolte
- rischi principali
- test previsti
- out-of-scope

Ogni mutazione richiede conferma esplicita dell'utente: `OK PROCEDI`.

---

## 3. Hard Stop Operativi

### 3.1 Stop Feature If P0/P1 Open

Se esistono issue o blocker aperti di severita `P0` o `P1` in uno di questi domini:

- sicurezza
- auth
- pagamenti
- Stripe
- crediti
- rimborsi
- dati personali
- webhook
- integrita DB

l'agente NON puo implementare nuove feature.

In presenza di questi blocker puo solo:

- correggere P0/P1
- fare audit
- aggiungere test
- aggiornare documentazione di rischio o governance

Nessuna roadmap feature puo essere avanzata come nuova implementazione mentre questi blocker sono aperti.

### 3.2 No Secret In Repo

Prima di qualsiasi implementazione l'agente deve verificare:

- nessun `.env` reale tracciato
- `.env` presente in `.gitignore`
- `.env.example` solo con placeholder
- nessuna API key reale in codice, docs, roadmap, CLAUDE, README o log
- nessun secret esposto in output, report o note operative

Se trova un secret reale o non puo verificare in modo affidabile la secret hygiene, deve fermarsi, segnalarlo come blocker `P0` e NON procedere con nuove feature.

### 3.3 Typecheck Non Basta

`pnpm typecheck` verde e necessario ma NON significa:

- production-ready
- security-ready
- auth-safe
- payments-safe
- DB-safe
- go-live ready

Ogni claim di completamento deve passare i gate rilevanti, i test minimi e la policy roadmap.

### 3.4 One Task Per Session

Una sessione puo coprire un solo task coerente.

Vietato:

- mischiare due feature scollegate nello stesso piano
- aggiungere refactor larghi non richiesti
- infilare fix cosmetici o opportunistici fuori scope
- toccare flussi esistenti non necessari per introdurre la modifica

Ogni intervento deve avere:

- scope unico
- file limitati
- criteri di accettazione
- test o typecheck dichiarati

---

## 4. Gate Obbligatori per Domini Sensibili

### 4.1 Auth Gate

Qualunque modifica a:

- login
- registrazione
- ruoli
- middleware
- sessioni
- reset password
- OTP
- magic link
- admin access

deve passare questa checklist:

- il ruolo non e assegnabile dal client
- le route protette sono verificate lato server
- gli ownership check sono presenti
- il guest flow e sicuro
- l'area admin e isolata
- il recupero password e sicuro
- il rate limit esiste ed e production-safe

Senza checklist completa, la modifica non e approvabile come production-ready.

### 4.2 Stripe / Economics Gate

Qualunque modifica a:

- Stripe
- crediti
- abbonamenti
- one-time payment
- webhook
- rescue/refund
- `RequestPurchase`
- `CreditTransaction`
- `CreditBatch`
- movimenti economici equivalenti

deve passare questa checklist:

- il backend ricalcola prezzi e importi
- i metadata sono sufficienti
- la webhook signature e verificata
- l'idempotenza e esplicita
- non esiste double spend
- non esiste double refund
- le transazioni sono atomiche
- `maxBuyers` o disponibilita equivalenti sono atomici se rilevanti
- esiste snapshot pricing se rilevante
- il payment method e tracciato
- esistono test concorrenti se il flusso lo richiede
- esiste audit trail per gli eventi economici

Senza checklist completa, la modifica non e approvabile come production-ready.

### 4.3 DB Duplication Gate

Prima di creare o proporre:

- nuova tabella
- nuovo campo
- nuova relation
- nuovo enum
- nuova route dati/shared
- nuovo profilo
- nuovo modello media
- nuovo stato
- nuovo componente o pattern shared con rischio di duplicazione funzionale

l'agente deve eseguire `check-duplicates` e dichiarare esplicitamente:

- esiste gia un modello equivalente?
- esiste gia un campo equivalente?
- il nuovo dato e derivato o fonte primaria?
- crea doppia verita?
- basta estendere cio che esiste?
- qual e la SSOT?

Se la SSOT non e chiara o il rischio di ridondanza resta aperto, la decisione deve essere `BLOCK`.

---

## 5. Pre-Implementation Plan

Prima di scrivere codice l'agente deve sempre produrre un preflight con:

- file da toccare
- modelli DB o entita coinvolte
- rischi principali
- come evita doppie verita
- come testa
- cosa NON tocchera
- gate attivati

Il preflight deve finire con stato:

- `IN ATTESA DI OK PROCEDI`

L'agente non puo superare questo stato senza conferma esplicita dell'utente.

---

## 6. Post-Implementation Report

Dopo ogni intervento l'agente deve produrre un report finale con:

- file toccati
- cosa e cambiato
- test eseguiti
- rischi residui
- eventuali P0/P1 aperti o confermati
- se la roadmap puo o non puo essere aggiornata

Se una modifica tocca domini sensibili, il report deve dire esplicitamente quale gate e stato applicato e quale rischio residuo resta aperto.

---

## 7. Policy Roadmap

La roadmap non puo usare `DONE` generico.

Stati ammessi:

- `TODO`
- `IN_PROGRESS`
- `DONE_VERIFIED`
- `DONE_NEEDS_AUDIT`
- `BLOCKED_BY_P0`
- `BLOCKED_BY_P1`

### Regole di aggiornamento roadmap

- Un item non puo diventare `DONE_VERIFIED` se esistono `P0` o `P1` aperti sullo stesso flusso.
- Un item non puo diventare `DONE_VERIFIED` senza `Evidence`, `Tests`, `Last audit` e `Residual risk`.
- Se una feature esiste ma non e stata verificata come production-safe, lo stato corretto e `DONE_NEEDS_AUDIT`.
- Se il flusso e bloccato da problemi sensibili aperti, lo stato corretto e `BLOCKED_BY_P0` o `BLOCKED_BY_P1`.
- Aggiornare la roadmap in modo cosmetico e vietato.
- La roadmap deve riflettere stato reale e rischio reale, non ottimismo.

---

## 8. Production Ready Definition

Una feature puo essere considerata production-ready solo se:

- typecheck passa
- test minimi pertinenti passano
- nessuna route o API espone dati non autorizzati
- nessun secret reale e coinvolto o esposto
- error handling presente
- ownership check presente se tocca dati utente
- audit trail presente se tocca economia o eventi critici
- idempotenza presente se tocca pagamenti o webhook
- gate auth / economics / duplication applicati quando rilevanti
- roadmap aggiornata con evidenza reale

Se anche uno solo di questi punti manca, la feature NON e `DONE_VERIFIED`.

---

## 9. Source Of Truth Operative

Fonti di verita da consultare prima di modificare il sistema:

- `packages/db/prisma/schema.prisma` - schema dati reale
- `packages/api/` - business logic e router
- `packages/ui/` - design system e pattern shared
- `packages/shared/` - tipi e costanti condivise
- `docs/Taxonomy.md` - dominio catalogo e tassonomia

Regole:

- non inventare colonne, tabelle, route o componenti senza aver letto le fonti reali
- riusa cio che esiste prima di estendere
- modifica schema solo se indispensabile
- non usare il frontend come fonte di verita per saldo, prezzi, acquisti o rimborsi
- non aggiornare logiche economiche fuori transazioni e audit trail

---

## 10. Baseline DB / Sicurezza / Economia

Queste baseline restano obbligatorie anche quando il task non e una nuova feature:

- webhook sensibili con signature verification e idempotenza
- ownership obbligatoria su query e mutazioni sensibili
- segreti separati per ambiente e mai committati
- rate limit sugli endpoint esposti e production-safe
- movimenti economici in transazioni atomiche
- audit trail per eventi critici
- backup, restore test e incident response definiti prima del go-live
- osservabilita minima su API, query lente e job critici

---

## 11. Stato Progetto - Riferimento Secondario

Lo stato del progetto vive operativamente in `docs/ROADMAP.md`.
Questo file non e il changelog del repository e non puo essere usato per dichiarare step completati in modo implicito.

Contesto operativo corrente:

- il progetto ha gia subito un audit pre-release con criticita gravi in secret hygiene, auth, pagamenti, crediti, rate limit e integrita operativa
- finche questi blocker non sono chiusi e registrati correttamente in roadmap, la priorita resta hardening e riduzione rischio
- ogni nuova feature deve essere considerata subordinata ai blocker aperti

---

## 12. Nota Finale

In caso di dubbio:

- fermati
- dichiara il blocker
- proponi il preflight
- aspetta `OK PROCEDI`

La governance esiste per impedire drift operativo, claim di completamento non verificati e nuove regressioni nei flussi sensibili.
