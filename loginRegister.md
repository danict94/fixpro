## SPEC — Login, Registrazione, Verifiche e Sessioni

### Obiettivo

Il sistema di autenticazione FixPro deve essere sicuro, chiaro, monitorabile e coerente con il dominio del prodotto.

La registrazione pubblica è consentita solo per:
- CLIENT
- COMPANY

ADMIN non è un ruolo di registrazione pubblica e non deve comparire in nessun form, flusso o parametro client-side.

L’implementazione deve distinguere chiaramente:
- autenticazione
- autorizzazione
- verifica dei canali utente
- accesso alle aree protette

---

## 1. Regole generali obbligatorie

Login e registrazione devono essere implementati seguendo best practice di sicurezza, manutenibilità e osservabilità.

È obbligatorio:
- hashing sicuro delle password
- validazione rigorosa dei dati in ingresso
- gestione sicura della sessione
- protezione contro brute force / abuse
- protezione delle route private tramite middleware server-side
- logging e monitoraggio di errori e performance
- test completi sui flussi positivi, negativi e edge case
- documentazione chiara delle configurazioni e del comportamento del sistema

È vietato:
- esporre privilegi admin nei flussi pubblici
- affidare la sicurezza dei ruoli al frontend
- salvare password in chiaro
- permettere accesso alle aree protette con verifiche incomplete
- usare log o messaggi che espongano dati sensibili
- trattare autenticazione, ruolo prodotto e privilegi interni come la stessa cosa

---

## 2. Modello utenti e privilegi

Il sistema distingue due assi separati:

### 2.1 Tipo utente di prodotto
Accessibile in registrazione pubblica:
- CLIENT
- COMPANY

Questo asse governa:
- campi del form
- onboarding
- redirect post-login
- area dedicata dell’utente

### 2.2 Privilegio amministrativo interno
Admin è un privilegio interno server-side only.
Non è un’opzione di registrazione pubblica.
Non deve essere selezionabile né deducibile dal client.

Le aree admin devono essere protette solo da controllo server-side del privilegio amministrativo.

---

## 3. Regole di registrazione

La registrazione pubblica deve essere implementata come wizard multi-step.

### Step 1 — Dati utente
L’utente seleziona il tipo:
- CLIENT
- COMPANY

#### Campi CLIENT
- nome
- cognome
- email
- telefono
- password
- conferma password

#### Campi COMPANY
- nome
- cognome referente
- ragione sociale
- settore/categoria iniziale
- indirizzo sede o località operativa
- partita IVA
- email
- telefono
- password
- conferma password

Tutti i campi devono essere:
- validati lato client per UX
- validati lato server come fonte di verità
- sanitizzati e trattati in modo sicuro

La UI può fornire validazione realtime, ma la validazione server-side è obbligatoria.

---

## 4. Verifica telefono ed email

### Regola fondamentale
L’utente non può accedere alla propria area dedicata finché non ha completato:
- verifica OTP del telefono
- verifica del link email

Entrambe sono obbligatorie per:
- CLIENT
- COMPANY

### Step 2 — Verifica OTP telefono
Dopo l’inserimento dei dati:
- il sistema invia OTP al numero indicato
- l’utente inserisce il codice
- il sistema verifica immediatamente il risultato

Se OTP non è valida:
- l’utente non procede
- il sistema mostra errore chiaro
- deve essere possibile richiedere reinvio entro regole anti-abuso

Se OTP è valida:
- il telefono viene marcato come verificato
- contemporaneamente o subito dopo viene inviata la mail di verifica

### Step 3 — Verifica email
Il sistema invia una email con link/token di verifica.
La schermata finale del wizard deve spiegare chiaramente che:
- l’email è stata inviata
- l’utente deve aprire la casella di posta
- deve cliccare il link di verifica per completare l’attivazione

Se OTP è valida ma email non è verificata:
- login eventualmente consentito solo in stato limitato oppure negato secondo la regola scelta
- accesso all’area dedicata comunque bloccato

La regola di prodotto consigliata è:
- consentire il completamento della registrazione tecnica
- non consentire accesso alle aree protette finché emailVerified e phoneVerified non sono entrambi true

---

## 5. Accesso alle aree dedicate

Il login deve:
- autenticare l’utente
- caricare sessione sicura
- verificare stato del tipo utente
- verificare completamento dei canali obbligatori

### Redirect per ruolo prodotto
- CLIENT → `/area-cliente/...`
- COMPANY → `/area-impresa/...`

### Regola di blocco accesso
Se email o telefono non sono verificati:
- nessun accesso all’area privata finale
- mostrare schermata/interstitial di completamento verifica
- offrire reinvio email e nuovo OTP secondo policy

Il sistema non deve basarsi solo sul redirect del client.
Il controllo deve essere fatto server-side e middleware-side.

---

## 6. Sessioni e sicurezza

La gestione delle sessioni deve essere sicura.

È obbligatorio:
- usare sessioni/tokens gestiti in modo sicuro
- proteggere cookie e dati sensibili
- validare la sessione a ogni accesso protetto
- consentire logout sicuro
- invalidare correttamente la sessione quando richiesto
- non esporre segreti o dettagli sensibili al client

Le aree protette devono essere accessibili solo se:
- sessione valida
- tipo utente coerente
- verifiche obbligatorie completate

---

## 7. Middleware e autorizzazione

Il middleware deve proteggere:
- area cliente
- area impresa
- area admin

### Regole area cliente
Accesso consentito solo se:
- sessione valida
- tipo utente = CLIENT
- email verificata
- telefono verificato

### Regole area impresa
Accesso consentito solo se:
- sessione valida
- tipo utente = COMPANY
- email verificata
- telefono verificato

### Regole area admin
Accesso consentito solo se:
- sessione valida
- privilegio admin server-side = true

Le aree admin non devono basarsi sul tipo utente CLIENT/COMPANY.

---

## 8. Sicurezza applicativa obbligatoria

L’implementazione deve includere:
- hashing password robusto
- rate limiting / anti brute force
- validazione server-side dei payload
- error handling sicuro
- niente messaggi che rivelino dettagli sensibili inutili
- protezione contro abuso di OTP/resend email
- protezione contro enumerazione account quando possibile
- uso corretto dell’ORM/query builder senza query raw insicure

Claude non deve implementare scorciatoie di sicurezza “temporanee” senza segnalarle esplicitamente.

---

## 9. Monitoraggio, logging, performance

È obbligatorio implementare osservabilità del flusso auth.

Monitorare almeno:
- successi/fallimenti login
- successi/fallimenti registrazione
- errori invio OTP
- errori invio email verifica
- errori validazione
- tempi principali del flusso
- eventuali redirect errati o loop di accesso

I log devono essere utili al debug ma non devono esporre:
- password
- OTP
- token completi
- dati sensibili non necessari

L’obiettivo è poter identificare rapidamente:
- colli di bottiglia
- errori applicativi
- problemi di provider esterni
- problemi UX nel funnel di registrazione

---

## 10. Testing obbligatorio

Il sistema auth deve essere testato in modo esteso.

Copertura minima:
- registrazione CLIENT riuscita
- registrazione COMPANY riuscita
- validazioni campo errate
- email già esistente
- telefono già esistente se previsto come univoco
- OTP errata
- OTP scaduta
- email non verificata
- telefono non verificato
- login corretto
- login con password errata
- redirect corretto per CLIENT
- redirect corretto per COMPANY
- blocco corretto se verifiche incomplete
- logout
- accesso negato a route protette senza sessione
- accesso negato ad area non coerente col tipo utente

---

## 11. UX obbligatoria del wizard

Il wizard di registrazione deve:
- guidare l’utente con step chiari
- mostrare avanzamento
- validare i dati in modo leggibile
- spiegare bene cosa succede dopo ogni step
- evitare ambiguità tra verifica telefono ed email
- mostrare feedback immediato su OTP valida/non valida
- mostrare istruzioni chiare per la verifica email

La UX deve essere:
- professionale
- lineare
- senza passaggi confusi
- coerente con il design system shared

---

## 12. Regole implementative

Claude deve implementare i flussi auth in questo ordine:

1. modello dati e campi necessari
2. configurazione provider/auth server-side
3. sessione e protezione middleware
4. verifica email
5. verifica OTP telefono
6. blocco accesso con verifiche incomplete
7. UI login/register
8. monitoring/logging
9. testing
10. documentazione finale

Claude non deve partire dalla UI ignorando il modello di sicurezza.

---

## 13. Documentazione obbligatoria

Tutte le configurazioni auth devono essere documentate in modo chiaro:
- provider usati
- env richieste
- campi utente coinvolti
- stati di verifica
- regole middleware
- redirect
- flussi di errore principali
- limiti e scelte architetturali

La documentazione deve permettere a un altro sviluppatore di capire e mantenere il sistema senza deduzioni implicite.