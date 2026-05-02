GUIDA COMPLETA — MONITORAGGIO BUG FIXPRO (GO LIVE)
🧠 OBIETTIVO
Sapere IMMEDIATAMENTE quando qualcosa si rompe
+ capire cosa è successo
+ risolvere velocemente
🧱 ARCHITETTURA DEL SISTEMA

Devi avere 3 livelli:

Livello	Strumento	Serve a
Errori (crash)	Sentry	sapere subito quando qualcosa si rompe
Log eventi	Hosting logs	capire cosa è successo
Controllo manuale	Test giornaliero	verificare che il core funziona
🥇 1. SENTRY — IL CUORE
🔍 COSA FA
intercetta errori frontend (React, Next.js)
intercetta errori backend (API, tRPC, Stripe)
salva tutto
ti manda notifiche
📩 COSA RICEVI

Esempio reale:

Errore: StripeWebhookError
File: stripe/webhooks.ts
Riga: 182
Utente: user_123
URL: /api/stripe/webhook
📍 DOVE LO VEDI
https://sentry.io → Project → Issues
🔔 NOTIFICHE

Attiva:

Email ✔
(opzionale) Slack ✔
🎯 COSA DEVI MONITORARE
create request error
purchase error
webhook Stripe
login/auth error
🥈 2. LOG — COSA NON È CRASH
📦 DOVE VEDERLI
Se usi Vercel
Dashboard → Project → Logs
Se usi SiteGround / server
cPanel / SSH → logs Node
📊 COSA LOGGARE

Minimo:

console.error("CreateRequest failed", { userId, data })
console.error("Purchase failed", { userId, requestId })
console.error("Stripe webhook error", { eventId })
🧠 DIFFERENZA
Tipo	Va in
crash	Sentry
problema logico	Logs
🥉 3. CONTROLLO MANUALE (OBBLIGATORIO)
⏱ 5 minuti al giorno

Testa:

1. login
2. crea richiesta
3. prova acquisto
🎯 PERCHÉ

👉 scopri bug non tecnici (UX, flussi rotti)

🔥 4. SEGNALI DI PROBLEMA
🚨 Segnale 1
nessuno compra

→ possibile bug checkout

🚨 Segnale 2
richieste = 0

→ form rotto

🚨 Segnale 3
molti errori Stripe

→ webhook o pagamento

🚨 Segnale 4
sito lento

→ DB / performance

🌐 DIFFERENZA HOSTING
🟢 VERCEL (consigliato)
Sentry perfetto ✔
logs facili ✔
scaling automatico ✔
🟡 SITEGROUND
devi controllare logs manualmente
meno integrazione
più “server-like”
🧠 CONSIGLIO
Vercel = migliore per SaaS moderno
🛡️ 5. COSA NON DEVI FARE

❌ aspettare utenti
❌ non monitorare
❌ ignorare errori piccoli
❌ fare debug manuale senza tool

🎯 TL;DR OPERATIVO
Sentry → errori automatici
Logs → capire cosa succede
Test giornaliero → sicurezza