# FixPro — Audit & Architettura Definitiva (SEO + Geo + Funnel + Vetrina)

## 🎯 Obiettivo documento

Definire in modo **chiaro, stabile e condivisibile**:

* bug attuali
* cause reali
* modello target per SaaS serio
* regole non negoziabili (SEO, geo, funnel, vetrina)
* comportamento abbonamenti (core business)

👉 Questo documento evita ambiguità e doppie implementazioni.

---

# 🧠 1. PRINCIPI DI BASE (NON NEGOZIABILI)

```txt
1. Senza GEO → NON si possono mostrare aziende
2. Senza INTERVENTO → NON si può creare richiesta
3. Matching reale → solo con GEO + INTERVENTO
4. SEO ≠ Funnel → ruoli separati
5. Un solo funnel di richiesta
6. Vetrina ≠ Marketplace
```

---

# 🔴 2. BUG ATTUALI (CRITICI)

## ❌ BUG 1 — Aziende senza GEO

```txt
Pagina: /[slug] (es: /muratore)

Problema:
- mostra aziende SENZA lat/lng
- mostra aziende NON rilevanti
- UX falsa: "nella tua zona"
```

### Impatto:

* rompe fiducia
* peggiora conversione
* rovina matching
* incoerenza prodotto

---

## ❌ BUG 2 — Query sbagliata

```ts
getImpreseByCategoria({ categoriaId })
```

### Problema:

```txt
- NON usa geo
- NON usa distanza
- NON usa matching reale
- ritorna aziende "random"
```

---

## ❌ BUG 3 — Doppio sistema (grave)

```txt
1. Pagina categoria → mostra aziende
2. Funnel richiesta → mostra aziende

→ duplicazione logica
→ incoerenza
→ rischio bug futuri
```

---

## ❌ BUG 4 — SEO page fa matching (errore architetturale)

```txt
La pagina /muratore sta facendo:
→ matching implicito

MA NON ha:
- geo
- intervento
```

---

# 🧠 3. SISTEMI PRESENTI (DA SEPARARE)

---

## 🟢 A. MARKETPLACE (Funnel)

```txt
/ richiesta

Flow:
intervento → geo → matching → richiesta
```

✔ corretto
✔ monetizzazione
✔ logica principale

---

## 🔵 B. VETRINA (Abbonamenti)

```txt
Imprese con showcase attivo
```

Serve per:

* visibilità
* contatti diretti
* branding

---

## 🟡 C. SEO / DISCOVERY

```txt
/slug (es: /muratore)
```

Serve per:

* traffico organico
* esplorazione
* ingresso funnel

---

# 🧱 4. MODELLO TARGET (ARCHITETTURA FINALE)

---

# 🔥 SLUG PAGE = GEO GATE

## Stato 1 — SENZA GEO

```txt
/muratore
```

Mostra:

✔ contenuto SEO
✔ lista interventi
✔ CTA funnel
✔ input GEO

```txt
❌ NESSUNA azienda
```

---

## Stato 2 — CON GEO

```txt
/muratore?city=catania
```

Mostra:

✔ aziende filtrate
✔ distanza
✔ città
✔ badge

---

### MA SOLO SE:

```txt
✔ geo presente
✔ matching reale
✔ abbonamento valido
```

---

# 🧠 MATCHING CORRETTO

```txt
input:
- categoria
- lat/lng
- (eventuale intervento)

output:
- aziende rilevanti
```

---

# 🔴 NON PIÙ

```txt
categoria → aziende
```

---

# 🟢 MA

```txt
categoria + geo → matching → aziende
```

---

# 🎯 5. FUNNEL (UNICO)

```txt
/ richiesta
```

---

## Flow:

```txt
1. intervento (obbligatorio)
2. geo (obbligatoria)
3. preview aziende
4. invio richiesta
```

---

## Preview aziende (nuovo step)

```txt
"Abbiamo trovato 8 professionisti vicino a te"
```

✔ prova sociale
✔ validazione matching
✔ NON selezione

---

# 🧠 6. SEO NON DEVE MORIRE (ANZI)

---

## PRIMA (sbagliato)

```txt
SEO page = lista aziende random
```

---

## DOPO (corretto)

```txt
SEO page = guida + filtro + ingresso intelligente
```

---

## Vantaggi SEO:

✔ più contenuto
✔ più tempo on page
✔ più interazioni
✔ migliore conversione

---

# 🔥 7. GEO STRATEGY

---

## Dove vive la GEO?

```txt
1. Funnel → obbligatoria
2. Slug page → opzionale (input)
```

---

## Regola:

```txt
NO GEO → NO AZIENDE
```

---

# 💰 8. MODELLO ABBONAMENTI VETRINA

---

## 🎯 Livello 1 — BASE

```txt
✔ può essere contattato direttamente
✔ paga richiesta scontata

Esempio:
9 crediti → paga 6
```

---

## 🎯 Livello 2 — PLUS

```txt
✔ priorità maggiore
✔ paga meno

Esempio:
9 crediti → paga 3
```

---

## 🎯 Livello 3 — PRO

```txt
✔ contatto diretto
✔ richieste gratuite
✔ limite mensile

Esempio:
0 crediti fino a X richieste
```

---

# 🧠 CONSEGUENZA CRITICA

```txt
Se mostri aziende senza geo:
→ rompi tutto il sistema abbonamenti
```

Perché:

* contatti inutili
* lead non qualificati
* valore percepito ↓

---

# 🎯 9. COMPORTAMENTO FINALE (CHIARO)

---

## HERO SEARCH

```txt
muratore
↓
/richiesta?categoria=muratore
```

---

## SEO (Google)

```txt
utente entra su /muratore
↓
legge
↓
inserisce geo
↓
vede aziende
↓
oppure entra nel funnel
```

---

## SLUG PAGE

```txt
NO GEO → contenuto
GEO → aziende filtrate
```

---

## FUNNEL

```txt
sempre:
geo + intervento → matching → richiesta
```

---

# 🔴 10. COSA VA FATTO (ROADMAP)

---

## STEP 1 — BLOCCO BUG

```txt
rimuovere:
getImpreseByCategoria dalla slug page
```

---

## STEP 2 — GEO GATE

```txt
aggiungere input città in slug
```

---

## STEP 3 — MATCHING REALE

```txt
creare:
getImpreseMatchate({ lat, lng, categoria })
```

---

## STEP 4 — PREVIEW FUNNEL

```txt
step aziende dopo geo
```

---

## STEP 5 — ABONAMENTI

```txt
filtri:
✔ showcase attivo
✔ priorità
✔ regole crediti
```

---

# 🧠 TL;DR FINALE

```txt
NO GEO → NO AZIENDE
NO INTERVENTO → NO RICHIESTA

Slug = SEO + filtro
Funnel = cervello
Matching = solo con geo

SEO porta traffico
Funnel monetizza
Geo rende tutto sensato
```

---

# 🔥 FRASE CHIAVE

```txt
Non mostrare aziende è meglio che mostrarle sbagliate.
Mostrale solo quando sei sicuro che siano giuste.
```

---
