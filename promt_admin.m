Applica CLAUDE.md rigorosamente.

## TASK

Implementare sistema ADMIN completo, sicuro e utilizzabile anche da utente NON tecnico (business continuity).

---

# 🎯 OBIETTIVO

Sistema che permetta:

* gestione admin semplice
* recupero accesso sempre possibile
* nessun lock-out definitivo
* sicurezza produzione

---

# 🧱 RUOLI

Definire:

* SUPER_ADMIN
* ADMIN

---

## REGOLE

* SOLO SUPER_ADMIN può:

  * creare admin
  * eliminare admin
  * modificare ruolo

* ADMIN:

  * gestisce operatività (richieste, rimborsi, utenti)
  * NON gestisce altri admin

---

# 🔐 CREAZIONE ADMIN (FLOW SICURO)

NON creare password manualmente.

---

## FLOW:

1. SUPER_ADMIN inserisce email

2. creare user con:

   * role = ADMIN
   * emailVerified = false

3. generare invito tramite Better Auth

4. inviare email:

   "Sei stato invitato come amministratore → imposta password"

5. utente completa setup password

---

# 🔐 RESET PASSWORD

Usare Better Auth già implementato.

---

## REGOLE:

* token scadenza: 30–60 minuti
* invalidate dopo uso
* revokeSessionsOnPasswordReset = true (già attivo)

---

## EXTRA SICUREZZA ADMIN:

* loggare evento:

  * reset password
  * login admin

---

# 🛡️ AUTHORIZATION

Middleware:

```ts
if (!session.user) → UNAUTHORIZED

if (role !== ADMIN && role !== SUPER_ADMIN)
→ FORBIDDEN
```

---

## SUPER ADMIN CHECK

```ts
if (role !== SUPER_ADMIN)
→ FORBIDDEN
```

---

# 🧠 BUSINESS CONTINUITY (CRITICO)

Garantire:

* sistema NON dipende da un solo utente
* sempre recuperabile

---

## IMPLEMENTARE:

1. supportare più SUPER_ADMIN
2. NON hardcodare email
3. accesso sempre via login pubblico

---

# 🌐 ACCESSO

Admin accede da:

/accedi

NON:

* server
* hosting
* codice

---

# 🟡 UX NON TECNICA

Se utente non verificato:

Mostrare:

"Controlla la tua email per attivare l’account"

* bottone:

"Reinvia email"

---

Se password dimenticata:

flow già esistente → mantenere

---

# 🛡️ SICUREZZA EXTRA

Implementare:

## 1. Audit log

Salvare:

* login admin
* reset password
* creazione admin
* azioni critiche

---

## 2. Rate limit admin

Più restrittivo rispetto utenti normali

---

## 3. (opzionale) IP logging

Salvare IP accessi admin

---

# 🧾 DATABASE

Verificare:

* User.role già presente
* aggiungere enum se necessario
* nessuna duplicazione dati

---

# 🧪 TEST

Testare:

1. creare admin
2. ricezione email invito
3. setup password
4. login admin
5. reset password
6. accesso negato utente normale
7. azioni SUPER_ADMIN funzionanti

---

# ❌ NON FARE

* password manuali
* bypass email verification
* token custom
* logica auth duplicata
* accessi diretti via DB

---

# ✅ OUTPUT ATTESO

* sistema admin production-ready
* accesso sicuro anche per utente non tecnico
* impossibile perdere accesso al sistema
* gestione admin completa da pannello

---

# PRIORITÀ

Questo task è CRITICO per:

* go-live
* sicurezza
* continuità operativa

---

END
