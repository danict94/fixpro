Richiesta nuova feature: $ARGUMENTS

Esegui SEMPRE questo preflight obbligatorio prima di qualsiasi implementazione.
Non scrivere codice, non proporre schema, non aggiornare roadmap e non procedere oltre finche non hai completato tutti i passaggi sotto e non hai ricevuto `OK PROCEDI`.

## Sequenza obbligatoria

1. Leggi `CLAUDE.md`.
2. Leggi `docs/CLAUDE.md` come fonte primaria di governance.
3. Leggi `docs/ROADMAP.md` per stato reale, blocker e policy stati.
4. Se il task tocca catalogo, matching, SEO, form richiesta, profili impresa, pricing/admin logic, settori, categorie o servizi, leggi anche `docs/Taxonomy.md`.
5. Ispeziona codice, schema, router, componenti shared e pattern esistenti prima di proporre qualsiasi estensione.
6. Verifica se esistono P0 o P1 aperti nei domini sensibili:
   - sicurezza
   - auth
   - pagamenti
   - Stripe
   - crediti
   - rimborsi
   - dati personali
   - webhook
   - integrita DB
7. Verifica secret hygiene:
   - nessun `.env` reale tracciato
   - `.env` in `.gitignore`
   - `.env.example` solo placeholder
   - nessuna chiave reale in codice, docs, roadmap, log o file di governance
8. Se il task tocca auth, attiva `Auth Gate`.
9. Se il task tocca Stripe, crediti, pagamenti, rimborsi, rescue o webhook, attiva `Stripe / Economics Gate`.
10. Se il task tocca modelli DB, campi, relation, enum, route dati/shared, profili, modelli media, stati o componenti/pattern shared, esegui `check-duplicates` e attiva `DB Duplication Gate`.
11. Definisci uno scope unico. Se il task contiene piu interventi scollegati, fermati e separali.
12. Prepara il piano pre-implementazione e fermati in stato `IN ATTESA DI OK PROCEDI`.

## Hard stop obbligatori

- Se esiste un P0 o P1 aperto in un dominio sensibile, NON implementare nuove feature.
- Se trovi secret reali o non puoi verificare la secret hygiene in modo affidabile, segnala blocker P0 e fermati.
- Se il task mescola piu task scollegati nella stessa sessione, NON procedere.
- Se non hai eseguito `check-duplicates` quando richiesto, NON creare nuovi modelli, campi, route o componenti shared.
- `pnpm typecheck` verde NON autorizza da solo l'implementazione o lo stato production-ready.

## Auth Gate

Attivalo se il task tocca login, registrazione, ruoli, middleware, sessioni, reset password, OTP, magic link o admin access.
Devi verificare esplicitamente:

- ruolo non assegnabile dal client
- route protette verificate
- ownership checks presenti
- guest flow sicuro
- admin isolato
- recupero password sicuro
- rate limit presente e production-safe

## Stripe / Economics Gate

Attivalo se il task tocca Stripe, crediti, abbonamenti, one-time payment, webhook, rescue/refund, `RequestPurchase`, `CreditTransaction`, `CreditBatch` o equivalenti.
Devi verificare esplicitamente:

- backend ricalcola prezzi
- metadata sufficienti
- webhook signature verificata
- idempotenza
- no double spend
- no double refund
- transazioni atomiche
- `maxBuyers` atomico se rilevante
- snapshot pricing
- payment method tracciato
- test concorrenti se rilevanti

## DB Duplication Gate

Attivalo se il task tocca nuove strutture dati o shared routes/pattern.
Devi verificare esplicitamente:

- esiste gia un modello equivalente?
- esiste gia un campo equivalente?
- e dato derivato o fonte primaria?
- crea doppia verita?
- basta estendere cio che esiste?
- quale tabella o modello e SSOT?

## Output obbligatorio prima di fermarti

Rispondi SEMPRE con questa struttura:

### Preflight
- Stato blocker P0/P1:
- Secret hygiene:
- Gate attivati:

### Scope
- Obiettivo unico della sessione:
- Cosa NON tocchero:

### Analisi
- Pattern / codice esistente riusabile:
- File da toccare:
- Modelli o entita coinvolte:
- Rischi principali:
- Come evito doppie verita:

### Verifica
- Test / typecheck previsti:
- Criteri di accettazione:

### Stato
- `IN ATTESA DI OK PROCEDI`

Non procedere oltre questa risposta finche l'utente non scrive `OK PROCEDI`.
