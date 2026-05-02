Hai ragione — prima avevi allargato il perimetro oltre i bug Stripe.
Rimettiamo **tutto il piano completo**, non solo quello che abbiamo già fatto.

---

# 🧠 ROADMAP COMPLETA (VERSIONE FINALE)

Questa è la **mappa vera per andare in release senza sorprese**.

---

# 🔵 BLOCCO A — PAGAMENTI (quello che hai già fatto)

### ✅ FASE 1 — Audit

* analisi flussi Stripe / crediti
* individuazione bug

👉 **CHIUSA**

---

### ✅ FASE 2 — Bonifica legacy

* rimozione dual writer
* rimozione fulfill frontend

👉 **CHIUSA**

---

### ✅ FASE 3 — Webhook only

* un solo writer
* event ledger

👉 **CHIUSA**

---

### ✅ FASE 4 — Concurrency DB

* lock su request
* maxBuyers safe

👉 **CHIUSA**

---

### ✅ FASE 5 — Checkout lock

* blocco doppio pagamento stessa azienda

👉 **CHIUSA**

---

# 🔴 BLOCCO B — FAIRNESS (critico)

### ❌ FASE 6 — Slot reservation (Stripe + Crediti)

👉 problema:

* pagamento a vuoto

👉 soluzione:

* prenotazione slot prima del pagamento

👉 **NON FATTA**

---

# 🟡 BLOCCO C — TEMPO / SCADENZE (QUESTO DICEVI TU)

Qui è dove molti sistemi si rompono.

---

## ❌ FASE 7 — EXPIRATION ENGINE

👉 domanda tua:

> “come fa il sistema a sapere che è passato il tempo?”

### problemi attuali possibili:

* crediti scadono?
* vetrina scade?
* reservation scade?
* request scade?

👉 se non gestito bene:
💥 dati incoerenti
💥 utenti con accessi non validi

---

### 💡 2 MODI

## 🟢 Metodo corretto (consigliato)

👉 **lazy expiration (on read)**

Esempio:

```txt
if expiresAt < now → trattalo come scaduto
```

✔ niente cron obbligatorio
✔ semplice
✔ stabile

---

## 🟡 Metodo avanzato

👉 cron job / worker

* pulisce DB
* aggiorna stati

✔ utile ma NON obbligatorio subito

---

### 👉 cosa devi verificare

| cosa        | deve avere               |
| ----------- | ------------------------ |
| CreditBatch | expiresAt + consumo FIFO |
| Showcase    | expiresAt                |
| Reservation | expiresAt                |
| Request     | expiresAt                |

👉 **Stato:** ❌ DA AUDITARE

---

# 🟡 BLOCCO D — CREDIT SYSTEM

### ❌ FASE 8 — CREDIT INTEGRITY

Controllare:

* consumo FIFO (batch più vecchio)
* mai andare negativo
* transazioni atomiche (`$transaction`)
* log completo (CreditTransaction)

👉 **Stato:** ⚠️ DA VERIFICARE

---

# 🟡 BLOCCO E — REFUND / RESCUE

### ❌ FASE 9 — REFUND SAFETY

Controllare:

* refund crediti corretto
* no duplicati
* audit log presente
* coerenza con Stripe (se coinvolto)

👉 **Stato:** ⚠️ PARZIALE

---

# 🟡 BLOCCO F — SUBSCRIPTION (VETRINA)

### ❌ FASE 10 — SUBSCRIPTION LOGIC

Controllare:

* rinnovo → estende o resetta?
* doppio pagamento → comportamento?
* stato attivo/scaduto coerente

👉 **Stato:** ⚠️ DA DEFINIRE

---

# 🟡 BLOCCO G — SICUREZZA

### ❌ FASE 11 — SECURITY HARDENING

* idempotenza webhook ✅ già fatto
* rate limit checkout ❓
* protezione endpoint ❓
* validazione metadata Stripe ❓

👉 **Stato:** ⚠️ PARZIALE

---

# 🟡 BLOCCO H — DB & PERFORMANCE

### ❌ FASE 12 — DB HEALTH

* index su:

  * requestId
  * companyId
  * expiresAt
* join pesanti?
* query N+1?

👉 **Stato:** ⚠️ DA VERIFICARE

---

# 📊 STATO COMPLESSIVO

| Blocco         | Stato |
| -------------- | ----- |
| Pagamenti core | ✅     |
| Fairness       | ❌     |
| Scadenze       | ❌     |
| Crediti        | ⚠️    |
| Refund         | ⚠️    |
| Subscription   | ⚠️    |
| Sicurezza      | ⚠️    |
| DB performance | ⚠️    |

---

# 🎯 TRADOTTO SEMPLICE

👉 Hai sistemato il **motore**

👉 ma devi ancora sistemare:

1. **equità (reservation)** 🔴
2. **tempo (scadenze)** 🟡
3. **coerenza dati (crediti/refund)** 🟡

---

# 🧠 PRIORITÀ REALI

## 🔥 PRIMA (OBBLIGATORIO)

1. Fase 6 — reservation
2. Fase 7 — expiration check

## ⚠️ POI

3. crediti integrity
4. subscription logic

## 🧊 DOPO

5. db optimization
6. security fine tuning

---

# 🏁 CONCLUSIONE

👉 quello che avevi intuito è corretto:

💥 **il problema non è solo Stripe**
💥 è tutto il sistema: tempo + soldi + stato

---

Se vuoi nel prossimo step:

👉 ti divido questi blocchi in **prompt sequenziali per Codex (uno per fase)**
così non impazzisce e chiudi tutto pulito.
