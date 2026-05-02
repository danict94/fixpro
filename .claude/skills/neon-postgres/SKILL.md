---
name: neon-postgres
description: Regole operative FixPro per task che toccano PostgreSQL, Prisma, Neon, migrazioni, integrita dati e concorrenza. Non e una policy globale: la governance primaria vive in docs/CLAUDE.md.
---

# Neon / Postgres / Prisma - Skill Operativa FixPro

Usa questa skill solo per task che toccano database, schema, Prisma, Neon, migrazioni, query critiche, integrita dati o concorrenza.

## Precedenza delle fonti

1. `docs/CLAUDE.md` e la governance primaria del progetto.
2. `docs/ROADMAP.md` descrive stato reale, blocker e criteri roadmap.
3. `.claude/commands/check-duplicates.md` e obbligatorio prima di nuovi modelli, campi, relation, enum o route dati/shared.
4. Questa skill definisce solo regole DB operative del progetto.
5. `.agents/skills/neon-postgres/SKILL.md` non e fonte primaria.

## Regole DB obbligatorie

- `schema.prisma` e la fonte di verita dello schema applicativo.
- Nessuna nuova tabella, campo, relation, enum o route dati/shared senza SSOT esplicita.
- Evita campi derivati persistiti se il valore puo essere ricalcolato in modo affidabile e senza bisogno operativo reale.
- Non introdurre `nullable` pericolosi senza motivazione esplicita, fallback chiaro e gestione applicativa documentata.
- Foreign key e `onDelete` devono essere sempre espliciti nelle scelte di modellazione.
- Le query critiche e i lookup ad alta frequenza devono avere indici appropriati o una motivazione documentata se l'indice non viene aggiunto.
- Movimenti economici, acquisti, rimborsi, rescue e aggiornamenti saldo devono vivere in transazioni atomiche.
- Per update concorrenti su crediti, disponibilita, `maxBuyers` o risorse a rischio race condition, serve lock o strategia equivalente esplicita.
- `pnpm db:push` e vietato in produzione.

## DB Duplication Gate

Prima di qualsiasi estensione strutturale devi verificare:

- quale modello o tabella e SSOT
- se esiste gia un campo equivalente
- se il nuovo dato e primario o derivato
- se basta estendere schema o servizio esistente
- se la proposta crea doppia verita tra tabelle, cache, profili o route shared

Se una di queste risposte non e chiara, fermati e usa `Decision: BLOCK`.

## Checklist migrazioni

Prima di proporre una migrazione o modifica schema:

1. Verifica che la modifica sia davvero necessaria e non ottenibile estendendo l'esistente.
2. Verifica impatto su compatibilita backward, dati esistenti e route correnti.
3. Verifica se serve backfill, default, indice o vincolo.
4. Verifica se la modifica richiede lock, strategia zero-downtime o rollout in piu fasi.
5. Verifica se la modifica tocca domini sensibili: auth, pagamenti, crediti, rimborsi, webhook, dati personali, integrita DB.
6. Verifica test minimi e query critiche da rieseguire dopo la modifica.

## Concorrenza ed economia

Per crediti, pagamenti, rescue, rimborsi e disponibilita concorrenti:

- il saldo non deve mai essere fonte client
- niente decrementi o incrementi fuori transazione
- niente doppia contabilizzazione
- niente aggiornamenti basati su stato stale senza verifica server-side
- ogni evento economico deve lasciare audit trail

## Neon docs

Le docs ufficiali Neon restano un riferimento esterno utile per dettagli di piattaforma, branching e connection management.
Usale come supporto tecnico, non come sostituto della governance di progetto.
