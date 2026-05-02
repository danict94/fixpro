# FixPro — SSOT Vetrina Premium
**Versione:** v1.0  
**Stato:** APPROVATO / SSOT  
**Ambito:** prodotto, pricing, visibilità, discovery, profilo pubblico, contatti da vetrina, integrazione con sistema crediti  
**Priorità:** ALTA  
**Uso obbligatorio:** questo documento è la fonte di verità per qualsiasi implementazione relativa a:
- abbonamento vetrina
- acquisto/rinnovo vetrina
- profilo pubblico professionista
- professionisti in evidenza
- sezioni professionisti lato cliente
- banner home / dashboard / area cliente
- contatti generati dalla vetrina
- sconti in crediti applicati ai contatti vetrina
- integrazione con lead marketplace e sistema crediti

---

# 1. Scopo

FixPro ha due motori commerciali distinti ma coerenti:

## 1. Motore core marketplace
- il cliente invia una richiesta
- il sistema/admin la approva
- i professionisti/aziende acquistano o sbloccano il contatto tramite crediti secondo la logica marketplace

## 2. Motore Vetrina Premium
- il professionista ottiene più visibilità
- il professionista ha un profilo pubblico più ricco
- il cliente può esplorare e scegliere professionisti in evidenza
- i contatti generati dalla vetrina hanno regole economiche dedicate

La Vetrina Premium non sostituisce il motore core.  
La Vetrina Premium lo completa.

---

# 2. Principio guida

La Vetrina Premium deve aumentare contemporaneamente:

- visibilità
- fiducia
- reputazione
- discovery
- conversione

senza rompere:

- il sistema a crediti
- il valore del lead marketplace
- la coerenza del prodotto
- la tracciabilità dei contatti

---

# 3. Regola fondamentale non negoziabile

## Gli sconti della Vetrina Premium si applicano SOLO ai contatti generati dalla vetrina.

### Questo significa:
Se un professionista ha la vetrina attiva, NON ottiene sconti automatici su tutti i lead della piattaforma.

Gli sconti si applicano solo se il contatto arriva da una sorgente vetrina, per esempio:
- profilo pubblico professionista
- sezione professionisti in evidenza
- listing vetrina
- blocchi professionisti in home
- blocchi professionisti in dashboard cliente
- pagine categoria con profili vetrina
- eventuali landing vetrina

### Non si applicano a:
- lead normali marketplace
- richieste cliente generiche entrate dal form standard
- matching classico non derivato dalla vetrina
- qualunque contatto non attribuibile a sorgente vetrina

Questa regola è obbligatoria.

---

# 4. Cosa è la Vetrina Premium

La Vetrina Premium è un prodotto a pagamento per professionisti/aziende che abilita:

## 4.1 Visibilità
- comparsa in sezioni dedicate
- comparsa in listing o aree “in evidenza”
- comparsa in contesti di discovery lato cliente

## 4.2 Profilo pubblico avanzato
- profilo pubblico navigabile
- descrizione attività
- categorie e servizi coperti
- aree servite
- recensioni pubbliche
- portfolio / gallery
- badge vetrina

## 4.3 Contatti da vetrina
- possibilità di essere contattati dal cliente tramite il profilo o moduli vetrina
- tracciamento del contatto
- applicazione di pricing agevolato solo su questi contatti

## 4.4 Fiducia
- maggiore credibilità percepita
- recensioni visibili
- presenza editoriale più forte nella piattaforma

---

# 5. Cosa NON è la Vetrina Premium

La Vetrina Premium NON è:

- uno sconto generalizzato su tutti i lead
- una sostituzione del marketplace core
- un bypass del sistema crediti
- una directory libera con contatti diretti non tracciati come default
- una promessa di lead garantiti salvo definizione esplicita futura

---

# 6. Regola di contatto cliente → professionista

## Modello corretto: ibrido tracciato

Il cliente può esplorare professionisti in vetrina e scegliere chi contattare.  
Ma il contatto deve avvenire tramite FixPro, non fuori piattaforma come default.

### Quindi:
Il profilo vetrina può mostrare:
- nome attività
- descrizione
- recensioni
- aree servite
- servizi
- immagini / lavori
- badge / stato verifica
- CTA

### Le CTA corrette sono per esempio:
- Richiedi preventivo
- Contatta tramite FixPro
- Verifica disponibilità
- Invia richiesta a questo professionista

### Non mostrare come default:
- telefono diretto pubblico
- email diretta pubblica

salvo decisione futura esplicita.

## Obiettivo
Mantenere:
- tracking
- moderazione
- analytics
- coerenza col modello crediti
- protezione del prodotto

---

# 7. Regola economica della Vetrina Premium

## 7.1 Base concettuale
Ogni contatto/lead ha sempre un:
- `base_credit_cost`

I piani Vetrina applicano una regola economica solo ai contatti provenienti da sorgente vetrina.

## 7.2 Regola generale
Se `contact_source_type` è di tipo vetrina, allora:
- applica pricing agevolato in base al piano attivo

Se `contact_source_type` NON è di tipo vetrina, allora:
- usa pricing standard marketplace

---

# 8. Piani Vetrina Premium

## 8.1 Piano Base
Include:
- profilo pubblico
- comparsa nelle aree base di vetrina
- recensioni pubbliche
- vantaggio economico sui contatti da vetrina

### Regola economica consigliata
- sconto contatti da vetrina: **33%**

---

## 8.2 Piano Medio / Plus
Include:
- più visibilità
- eventuale presenza in più placement
- profilo più ricco
- vantaggio economico maggiore sui contatti da vetrina

### Regola economica consigliata
- sconto contatti da vetrina: **66%**

---

## 8.3 Piano Pro
Include:
- massima visibilità
- placement premium
- profilo completo
- priorità editoriale / maggiore esposizione
- vantaggio economico massimo sui contatti da vetrina

### Regola economica consigliata
- contatti da vetrina gratuiti fino a quota mensile
- oltre quota, sconto forte

### Esempio
- primi N contatti da vetrina gratis al mese
- oltre N: sconto 70%

## Regola
Evitare il “gratis illimitato” come default, salvo decisione economica esplicita futura.

---

# 9. Formula di pricing contatti vetrina

## 9.1 Costo base
Ogni contatto deve avere sempre:
- `base_credit_cost`

## 9.2 Costo finale
Il costo finale si calcola solo per i contatti vetrina con piano attivo.

### Formula concettuale
`final_credit_cost = base_credit_cost - sconto_piano`

oppure in forma percentuale:
`final_credit_cost = base_credit_cost * multiplier`

### Regola di implementazione
La logica esatta deve essere centralizzata in un unico punto e non duplicata in controller, componenti o job multipli.

## 9.3 Rounding
La regola di rounding deve essere unica, esplicita e documentata.

### Raccomandazione
Usare rounding standard o una policy business esplicita, ma in un solo punto del dominio.

### Vietato
- calcoli diversi in punti diversi del codebase
- logiche replicate lato frontend e backend senza centralizzazione

---

# 10. Sorgenti contatto

Ogni contatto deve avere una sorgente chiara e persistita.

## 10.1 Campo obbligatorio
Ogni contatto / lead / thread / unlock rilevante deve poter tracciare:
- `contact_source_type`

## 10.2 Valori consigliati
Esempi:
- `marketplace_request`
- `showcase_profile`
- `showcase_listing`
- `showcase_home_block`
- `showcase_client_dashboard`
- `showcase_category_page`
- `direct_profile_contact`

### Regola
Il naming finale deve adattarsi al dominio esistente, ma il concetto non può mancare.

## 10.3 Uso obbligatorio
Questo campo è la base per:
- distinguere contatti vetrina da contatti standard
- applicare sconti
- analytics
- reporting
- dashboard azienda

---

# 11. Profilo pubblico professionista

## 11.1 Obiettivo
Ogni impresa con vetrina attiva deve poter avere un profilo pubblico completo, coerente e navigabile.

## 11.2 Dati minimi del profilo
Il profilo pubblico deve poter mostrare almeno:
- nome attività
- slug pubblico
- descrizione breve
- descrizione estesa
- logo / avatar
- cover image opzionale
- categorie principali
- servizi principali
- aree servite
- recensioni
- rating medio
- numero recensioni
- immagini lavori / gallery
- badge vetrina
- stato verifica
- CTA di contatto

## 11.3 Regola
Il profilo pubblico deve riusare il più possibile dati già presenti nel sistema.

### Vietato
- duplicare anagrafiche già esistenti
- creare due fonti di verità separate per:
  - nome azienda
  - categorie
  - servizi
  - aree servite
  - rating

## 11.4 Se servono campi nuovi
Aggiungerli in una struttura dedicata e coerente, senza duplicare quelli già esistenti.

---

# 12. Sezioni visibili lato cliente

La Vetrina Premium deve essere visibile lato cliente in modo chiaro ma non invasivo.

## 12.1 Home
Serve una sezione dedicata, distinta dal core funnel richiesta.

### Obiettivo
Far intuire che su FixPro si possono:
- inviare richieste
- esplorare professionisti verificati e in evidenza

### Pattern consigliato
Sezione tipo:
- Professionisti in evidenza
- I nostri professionisti
- Scopri i professionisti FixPro

## 12.2 Dashboard cliente
La dashboard cliente non deve essere solo elenco richieste.

Deve poter includere:
- banner discovery
- professionisti in evidenza
- professionisti consigliati
- categorie popolari

## 12.3 Area cliente
Serve una sezione dedicata tipo:
- Professionisti
oppure
- Professionisti in evidenza

Questa sezione deve permettere discovery e trust.

## 12.4 Pagine categoria
Facoltativo ma consigliato:
- blocchi con profili vetrina rilevanti per categoria o intervento

---

# 13. Banner e placement

## 13.1 Banner home
Messaggio consigliato:
- scopri professionisti con profilo completo, recensioni e aree servite

## 13.2 Banner dashboard cliente
Messaggio consigliato:
- vuoi esplorare professionisti verificati prima di inviare una richiesta?

## 13.3 Banner dashboard azienda
Messaggio consigliato:
- attiva la Vetrina Premium per dare più visibilità alla tua attività

## 13.4 Placement
La vetrina non deve dipendere solo dalla subscription attiva.  
Serve poter governare manualmente o tramite regole i placement premium.

---

# 14. Regole di visibilità

## 14.1 Requisiti minimi per comparire
Un professionista può comparire nelle aree vetrina solo se:
- ha piano vetrina attivo
- è verificato / approvato
- profilo pubblico valido
- dati minimi completi
- stato account attivo

## 14.2 Regola
Non tutte le aziende con vetrina attiva devono comparire ovunque allo stesso modo.

Serve poter gestire:
- rotazione
- priorità
- placement
- categorie
- zona geografica
- qualità profilo

---

# 15. Recensioni

Le recensioni sono centrali nella vetrina.

## Regola
Le recensioni pubbliche devono essere legate a richieste reali o a logiche già validate dal sistema.

## Il profilo pubblico deve poter mostrare:
- rating medio
- numero recensioni
- recensioni selezionate / highlight
- data ultima recensione opzionale

## Vietato
Creare una seconda logica recensioni separata dalla fonte principale già esistente.

---

# 16. Dashboard azienda — area Vetrina

La dashboard azienda deve avere una sezione Vetrina chiara.

## 16.1 Deve mostrare almeno:
- stato piano vetrina
- piano attivo
- scadenza
- cosa include
- CTA rinnovo / upgrade / acquisto
- anteprima profilo pubblico
- statistiche base vetrina
- contatti da vetrina ricevuti
- crediti risparmiati grazie alla vetrina

## 16.2 Obiettivo
Far percepire chiaramente il valore del piano.

---

# 17. Funnel acquisto Vetrina

## 17.1 Deve esistere
Il professionista deve poter:
- vedere i piani
- capire differenze
- acquistare
- rinnovare
- fare upgrade

## 17.2 Messaggi chiave
La Vetrina Premium deve essere venduta come:
- più visibilità
- più fiducia
- profilo pubblico più forte
- vantaggi economici sui contatti da vetrina

### Non come:
- sconto indiscriminato su tutti i lead
- accesso privilegiato non spiegato
- scorciatoia opaca nel marketplace

---

# 18. Entità e integrazione dati

## 18.1 Regola obbligatoria prima di implementare
Prima di aggiungere nuove entità o tabelle, Claude deve:

1. leggere lo schema attuale del database
2. identificare tabelle/modelli già esistenti rilevanti
3. verificare se esistono già concetti simili con nome diverso
4. riusare dove possibile
5. evitare doppie verità
6. evitare tabelle ridondanti
7. evitare colonne duplicate semantiche

## 18.2 Vietato
- creare nuove tabelle se la stessa responsabilità è già coperta da una esistente estendibile
- duplicare rating, recensioni, anagrafica azienda, area servita, categorie, servizi
- creare logiche vetrina slegate dal sistema crediti esistente

## 18.3 Se servono nuove entità
Crearle solo se davvero necessarie e con responsabilità unica.

### Entità possibili / concetti minimi
Potrebbero servire, ma solo dopo verifica dello schema esistente:
- piano vetrina
- subscription vetrina azienda
- configurazione profilo pubblico
- placement in evidenza
- tracking contatti vetrina

### Regola
Il nome finale deve adattarsi al dominio e naming già presenti nel progetto.

---

# 19. Anti-doppia-verità

Claude deve rispettare queste regole obbligatorie:

## 19.1 Anagrafica azienda
Una sola fonte di verità per:
- nome
- slug principale se già esiste
- verifica
- categorie
- servizi
- area servita

## 19.2 Rating / recensioni
Una sola fonte di verità per:
- rating medio
- review count
- recensioni pubbliche

## 19.3 Costi contatto
Una sola fonte di verità per:
- base credit cost
- calcolo sconto
- final credit cost

## 19.4 Source tracking
Una sola fonte di verità per:
- origine del contatto
- applicazione sconto vetrina
- reporting vetrina

---

# 20. Regole implementative per Claude

## 20.1 Prima di scrivere codice
Claude deve:
1. elencare file da toccare
2. elencare modelli/tabelle da verificare
3. spiegare come si aggancia allo schema esistente
4. spiegare come evita doppie verità
5. spiegare come centralizza la logica sconto contatti vetrina
6. aspettare conferma

## 20.2 Durante l’implementazione
Claude deve:
- preferire estensione di modelli esistenti a duplicazione
- centralizzare la logica di pricing in un solo punto
- centralizzare la logica di contact source in un solo punto
- centralizzare la logica di visibilità vetrina in un solo punto dove possibile
- evitare branching sparso e hardcoded in più componenti

## 20.3 Dopo l’implementazione
Claude deve produrre un report con:
- file toccati
- modelli/tabelle coinvolte
- nuove entità create e perché
- campi aggiunti e perché
- come è stata evitata la doppia verità
- dove vive la logica di pricing vetrina
- dove vive la logica di source tracking
- eventuali residui o follow-up

---

# 21. Output atteso

La Vetrina Premium deve portare a questo risultato:

## lato cliente
- scopre professionisti in evidenza
- può esplorare profili pubblici
- può contattarli tramite FixPro
- percepisce più fiducia

## lato professionista
- ha profilo pubblico migliore
- ottiene visibilità premium
- riceve contatti da vetrina
- ha vantaggi economici solo su quei contatti
- vede chiaramente il valore del piano

## lato FixPro
- non rompe il core marketplace
- non rompe il sistema a crediti
- mantiene tracking e controllo
- monetizza meglio
- aumenta fiducia e discovery

---

# 22. Regola finale non negoziabile

La Vetrina Premium è un secondo motore commerciale del prodotto.

## Deve:
- aumentare visibilità
- aumentare fiducia
- abilitare profili pubblici e placement
- agevolare economicamente solo i contatti generati dalla vetrina

## Non deve:
- sostituire il motore core marketplace
- scontare tutti i lead
- creare doppie verità
- creare codice ridondante
- introdurre logiche sparse e incoerenti

Questa è la struttura SSOT ufficiale.