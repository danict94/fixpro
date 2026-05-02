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