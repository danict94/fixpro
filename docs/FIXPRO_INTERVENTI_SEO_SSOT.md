# FixPro — Guida SSOT Interventi, Guide Prezzi e SEO Geo

## Obiettivo

Questa guida spiega come gestire in modo ordinato e scalabile i contenuti SEO degli interventi FixPro.

Il sistema deve permettere di creare pagine come:

- `/interventi/rifacimento-bagno`
- `/interventi/rifacimento-bagno/costo`
- `/interventi/rifacimento-bagno/guida`
- `/interventi/rifacimento-bagno/milano`
- `/interventi/ristrutturazione-cucina/catania`
- eventuale futura pagina `/interventi/ristrutturazione-cucina/catania/costo`

senza duplicare contenuti e senza creare manualmente una pagina per ogni città.

---

# Regola principale

## Una sola fonte di verità

I contenuti editoriali specifici di un intervento devono vivere solo qui:

```txt
apps/web/src/app/(public)/interventi/_content/data/<slug>.ts

più avanti importare livello 3 Per SaaS maturo con molti contenuti, serve una fase 2.
Non perché quello fatto sia sbagliato, ma perché quando cresci dovrai aggiungere governance editoriale, controlli SEO e automazioni.

Il livello “SaaS serio” completo sarebbe questo:

Livello 1 — Ora
_content/data/<slug>.ts
geo.ts
registry
route dinamiche
typecheck
SSOT

Questo è buono.

Livello 2 — Prossimo step serio
script di validazione contenuti
controllo slug mancanti
controllo geo abilitate ma città assente
controllo content mancante per intervento
controllo metadata SEO
controllo canonical
controllo duplicate title/description

Questo evita errori quando aggiungi tanti articoli.

Livello 3 — Scala vera
CMS/headless oppure DB editoriale
workflow admin
preview contenuti
stati draft/published
audit modifiche
generazione sitemap controllata
noindex per pagine incomplete




Perfetto. Questa è **la più delicata di tutte** → geo SEO.

Qui non devi fare casino: **hai già un sistema buono (`getGeoInterventoSeo`)**, quindi NON lo tocchiamo.
Andiamo solo a completare la metadata come si deve.

---

# 🎯 DOVE MODIFICARE

Vai qui:

```ts
export async function generateMetadata({
```

---

# ❌ CODICE ATTUALE

```ts
return {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: `/interventi/${intervento.slug}/${cityData.slug}`,
  },
}
```

---

# ✅ SOSTITUISCI CON QUESTO

```ts
return {
  title: seo.title,
  description: seo.description,

  alternates: {
    canonical: `/interventi/${intervento.slug}/${cityData.slug}`,
  },

  openGraph: {
    title: seo.title,
    description: seo.description,
    url: `/interventi/${intervento.slug}/${cityData.slug}`,
    type: 'article',
  },
}
```

---

# 🧠 PERCHÉ QUI È DIVERSO

A differenza delle altre pagine:

👉 qui **NON scriviamo noi title/description**
👉 li genera già:

```ts
getGeoInterventoSeo(...)
```

✔ giusto così
✔ scalabile per 100 città
✔ zero duplicazione

---

# 🔥 COSA HAI ORA (molto importante)

Hai costruito questo:

### STRUTTURA SEO COMPLETA

* `/interventi/[slug]` → overview
* `/interventi/[slug]/costo` → 💰 soldi
* `/interventi/[slug]/guida` → 📚 guida
* `/interventi/[slug]/milano` → 📍 local SEO

---

# 🚀 QUESTA PARTE È ORO

Questa pagina intercetta:

* “idraulico perdita acqua milano”
* “rifacimento bagno roma costo”
* “ristrutturazione casa torino”

👉 cioè traffico **locale + pronto a comprare**

---

# ⚠️ NON TOCCARE

Non devi toccare:

* `getGeoInterventoSeo` ❌
* contenuti ❌
* JSX ❌

---

# 🟢 STATO

✔ interventi → ok
✔ costo → ok
✔ guida → ok
✔ city → ok

👉 hai un sistema SEO **già da SaaS serio**

---

# 🚨 NEXT LEVEL (questo fa la differenza vera)

Se vuoi fare il salto:

👉 JSON-LD (schema.org → Google rich results)
👉 linking interno intelligente tra città
👉 clustering SEO (tipo Milano → quartieri)

---

Se vuoi farlo:

👉 dimmi: **“spingiamo ranking”**

e ti porto al livello sopra (quello che porta traffico vero).
