# FixPro — SSOT Tassonomia, Ricerca e Matching
**Versione:** v1.0  
**Stato:** APPROVATO / SSOT  
**Ambito:** dominio pubblico + matching + ricerca + catalogo + profili impresa  
**Priorità:** ALTA  
**Uso obbligatorio:** questo documento è la fonte di verità per qualsiasi implementazione relativa a:
- settori
- categorie professionali
- servizi professionali
- interventi cliente
- matching tra domanda e offerta
- slug, alias, ricerca e sinonimi

---

# 1. Scopo

FixPro non deve essere modellato come un catalogo confuso di mestieri o come un marketplace generico di tutto.

FixPro deve essere un marketplace verticale chiaro, scalabile e governabile, costruito per gestire correttamente:

- richieste semplici
- richieste complesse
- professionisti specialisti
- imprese generaliste
- ricerca libera dell’utente
- SEO pulita
- matching preciso

Questo documento definisce la struttura ufficiale del dominio e le regole obbligatorie di classificazione.

---

# 2. Principio guida

Il cliente non ragiona sempre per mestiere tecnico.

Spesso ragiona per:

- problema da risolvere
- lavoro da eseguire
- obiettivo finale
- progetto completo
- urgenza

Esempi reali:

- rifacimento bagno
- ristrutturazione appartamento
- perdita acqua
- infiltrazione
- imbianchino
- ditta ristrutturazioni
- pratica edilizia
- trasloco con smontaggio mobili

Per questo FixPro deve separare chiaramente:

1. tassonomia professionale
2. tassonomia lato cliente
3. motore di matching
4. ricerca / alias / sinonimi

---

# 3. Struttura ufficiale del dominio

La struttura ufficiale di FixPro è composta da 5 livelli logici:

## 3.1 Settore
Macro contenitore del dominio.

## 3.2 Categoria professionale
Figura professionale, mestiere o cluster operativo.

## 3.3 Servizio professionale
Prestazione atomica e specifica che una categoria può offrire.

## 3.4 Intervento cliente
Bisogno, lavoro, problema o progetto che il cliente seleziona o descrive.

## 3.5 Matching
Regole che collegano interventi cliente a categorie professionali compatibili e servizi rilevanti.

---

# 4. Regola fondamentale di separazione

FixPro deve mantenere separati questi blocchi:

## 4.1 Tassonomia professionale
`Settore -> Categoria professionale -> Servizio professionale`

## 4.2 Tassonomia cliente
`Intervento cliente`

## 4.3 Matching
`Intervento cliente -> Categorie professionali compatibili -> Servizi professionali rilevanti`

Questa separazione è obbligatoria.

È vietato semplificare il modello in modo improprio riducendolo a:

`Settore -> Categoria -> Servizio`

se questa semplificazione porta a trattare tutto come se il cliente ragionasse solo per mestiere o come se ogni richiesta corrispondesse a una sola categoria.

---

# 5. Definizioni ufficiali

## 5.1 Settore
Il settore è il contenitore macro del mercato.

Serve per:

- navigazione principale
- organizzazione del dominio
- SEO macro
- reporting
- onboarding impresa
- amministrazione del catalogo

### Esempi
- Edilizia e ristrutturazioni
- Impianti
- Finiture e interni
- Esterni e pertinenze
- Manutenzione rapida
- Progettazione tecnica
- Interior e valorizzazione casa
- Traslochi e sgomberi

### Regola
Il settore non è un mestiere.  
Il settore non è un servizio.  
Il settore cambia raramente.

---

## 5.2 Categoria professionale
La categoria professionale è la figura, il mestiere o la famiglia di operatori riconoscibile dall’utente e utile al matching.

Serve per:

- profilo impresa / professionista
- dichiarazione competenze
- filtri professionali
- matching
- pricing e regole admin
- specializzazioni aziendali

### Esempi
- Impresa edile
- Muratore
- Idraulico
- Elettricista
- Imbianchino
- Piastrellista
- Termoidraulico
- Architetto
- Geometra
- Traslocatore

### Regola
La categoria professionale non coincide sempre con ciò che il cliente seleziona.

---

## 5.3 Servizio professionale
Il servizio professionale è la prestazione atomica, specifica e operativa che una categoria può offrire.

Serve per:

- descrivere cosa sa fare il professionista
- raffinare il matching
- arricchire il profilo impresa
- supportare ricerca e SEO
- abilitare logiche di filtri e pricing

### Esempi
Per `Idraulico`:
- sostituzione rubinetto
- riparazione perdita
- installazione sanitari
- sostituzione box doccia

Per `Imbianchino`:
- tinteggiatura interna
- rasatura pareti
- verniciatura infissi
- trattamento antimuffa

Per `Architetto`:
- progetto ristrutturazione
- direzione lavori
- consulenza preliminare
- progetto bagno o cucina

### Regola
Il servizio professionale è lato offerta.  
Non deve essere l’unico entry point del cliente.

---

## 5.4 Intervento cliente
L’intervento cliente è il lavoro, il problema o l’obiettivo che il cliente vuole risolvere.

È il vero entry point lato domanda.

Serve per:

- creare la richiesta cliente
- modellare il form
- classificare bisogni semplici e complessi
- attivare il matching verso categorie compatibili
- evitare che il cliente debba conoscere il mestiere tecnico corretto

### Esempi
- rifacimento bagno
- ristrutturazione cucina
- ristrutturazione appartamento
- perdita acqua
- infiltrazione tetto
- tinteggiatura casa
- installazione climatizzatore
- sgombero appartamento
- pratica catastale
- progetto per ristrutturazione

### Regola
L’intervento cliente può essere:
- semplice
- composto
- diagnostico / preliminare

---

# 6. Regole lato cliente

## 6.1 Una richiesta può essere complessa
Il cliente non deve essere costretto a creare richieste separate per ogni mestiere tecnico coinvolto.

### Esempio corretto
Una sola richiesta per:
- rifacimento bagno
- ristrutturazione appartamento
- infiltrazione
- trasloco con smontaggio

### Esempio scorretto
Tre o più richieste separate a:
- muratore
- idraulico
- elettricista
- piastrellista

Questo è vietato come modello principale di UX.

---

## 6.2 Il cliente può entrare da:
- ricerca libera
- settore
- intervento cliente
- categoria professionale
- pagina SEO

Ma il sistema deve comunque ricondurre la richiesta alla struttura corretta.

---

# 7. Regole lato professionista / impresa

Il professionista o l’impresa non deve essere modellato in modo troppo rigido.

FixPro deve permettere a un operatore di dichiarare:

- uno o più settori coperti
- una o più categorie professionali
- uno o più servizi professionali
- opzionalmente uno o più interventi cliente che è disposto a gestire
- area geografica di copertura
- dimensione lavori accettati
- urgenze accettate o no

### Esempi corretti
- impresa edile che copre più categorie
- termoidraulico che copre idraulica + riscaldamento + climatizzazione
- impresa di ristrutturazione che intercetta rifacimento bagno, cucina, appartamento
- architetto che intercetta progettazione e pratiche, ma non esecuzione lavori
- traslocatore che intercetta trasloco, smontaggio, imballaggio, deposito

---

# 8. Regole di matching

Il matching è il ponte tra domanda cliente e offerta professionale.

## 8.1 Principio
Un intervento cliente può essere compatibile con:
- una categoria professionale
- più categorie professionali
- una categoria primaria
- categorie secondarie
- servizi professionali rilevanti

## 8.2 Regola obbligatoria
La richiesta cliente resta una.  
Il matching può generare molte categorie compatibili.

## 8.3 Esempi

### Esempio A — intervento semplice
**Intervento cliente:** sostituzione rubinetto

**Categorie compatibili:**
- Idraulico

**Servizi rilevanti:**
- sostituzione rubinetto
- sostituzione miscelatore
- riparazione perdita

---

### Esempio B — intervento medio
**Intervento cliente:** installazione climatizzatore

**Categorie compatibili:**
- Climatizzazione
- Termoidraulico
- Impiantista

**Servizi rilevanti:**
- installazione climatizzatore
- predisposizione climatizzatore
- manutenzione climatizzatore

---

### Esempio C — intervento composto
**Intervento cliente:** rifacimento bagno

**Categorie compatibili:**
- Impresa edile
- Muratore
- Idraulico
- Elettricista
- Piastrellista
- Termoidraulico

**Servizi rilevanti:**
- demolizione
- rifacimento impianto idrico
- rifacimento impianto elettrico
- posa rivestimenti
- installazione sanitari

---

# 9. Regole per servizi semplici e interventi composti

## 9.1 Servizio professionale atomico
Prestazione specifica, operativa e normalmente gestibile da una singola categoria o da poche categorie.

### Esempi
- sostituzione rubinetto
- aggiunta presa elettrica
- tinteggiatura stanza
- montaggio climatizzatore
- sgombero cantina

## 9.2 Intervento composto
Richiesta cliente che può coinvolgere più professionalità, più servizi o più fasi di lavoro.

### Esempi
- rifacimento bagno
- ristrutturazione cucina
- ristrutturazione appartamento
- rifacimento terrazzo
- trasloco completo
- sistemazione giardino completa

### Regola
I servizi atomici restano nel catalogo professionale.  
Gli interventi composti restano nella tassonomia cliente.  
Non vanno fusi in modo improprio.

---

# 10. Fasi di dominio

## 10.1 Fase 1 — Dominio core obbligatorio
Questa è l’area principale del prodotto e deve restare il centro del marketplace.

### Settori core
- Edilizia e ristrutturazioni
- Impianti
- Finiture e interni
- Esterni e pertinenze
- Manutenzione rapida

### Priorità assoluta in:
- catalogo
- matching
- form richiesta
- profili impresa
- SEO
- pricing/admin logic

---

## 10.2 Fase 2 — Espansione adiacente coerente
Questi ambiti possono essere aggiunti solo se restano strettamente collegati al mondo casa / lavori / manutenzione / trasformazione o gestione operativa dell’immobile.

### Settori adiacenti
- Progettazione tecnica
- Interior e valorizzazione casa
- Traslochi e sgomberi

---

## 10.3 Fase 3 — Verticali separati
Questi ambiti non devono essere mescolati al core marketplace nella stessa struttura operativa.

### Verticali separati
- Immobiliare

### Regola
Un verticale separato non deve entrare nel catalogo core senza decisione esplicita.

---

# 11. Analisi specifica aree dubbie

## 11.1 Progettazione tecnica
### Ammessa
Sì, come settore adiacente coerente.

### Regola
`Architetto`, `Geometra`, `Ingegnere` sono **categorie professionali**, non servizi.

### Esempi di categorie
- Architetto
- Geometra
- Ingegnere
- Interior designer
- Consulente pratiche edilizie

### Esempi di servizi professionali
- progetto ristrutturazione
- pratica edilizia
- direzione lavori
- rilievo metrico
- consulenza preliminare

### Esempi di interventi cliente
- progetto per ristrutturazione
- pratica edilizia
- supporto tecnico prima dei lavori
- ridistribuzione spazi interni

### Regola strategica
La progettazione tecnica deve completare il marketplace, non cannibalizzarlo.

---

## 11.2 Traslochi e sgomberi
### Ammessi
Sì, come settore adiacente coerente.

### Regola
Traslochi e sgomberi devono restare legati al mondo casa / immobile / spostamento / svuotamento, non diventare logistica generica.

### Esempi di categorie
- Traslocatore
- Sgomberi
- Smontaggio e rimontaggio mobili
- Deposito temporaneo

### Esempi di servizi professionali
- trasloco locale
- trasloco nazionale
- imballaggio
- smontaggio mobili
- rimontaggio mobili
- sgombero appartamento
- sgombero cantina

### Esempi di interventi cliente
- trasloco appartamento
- trasloco con smontaggio
- sgombero appartamento
- sgombero post-ristrutturazione

---

# 12. Regole per slug, alias, ricerca e sinonimi

## 12.1 Slug obbligatori
Ogni entità pubblica deve avere uno slug stabile.

Gli slug servono per:
- URL
- routing
- SEO
- identificazione pubblica stabile

## 12.2 Alias obbligatori per categorie, servizi e interventi
Ogni categoria, servizio professionale e intervento cliente deve poter avere alias.

Gli alias servono per:
- linguaggio naturale dell’utente
- sinonimi comuni
- denominazioni alternative di mercato

## 12.3 Search terms obbligatori per categorie, servizi e interventi
Ogni categoria, servizio e intervento deve poter avere termini di ricerca associati.

Questi servono per:
- ricerca libera
- matching semantico
- SEO
- query “sporche” o non standard

## 12.4 Esempio — categoria professionale
**Nome:** Imbianchino  
**Slug:** `imbianchino`  
**Alias:**
- pittore
- tinteggiatore

**Search terms:**
- imbiancare casa
- pittura interni
- tinteggiatura pareti
- verniciare muri

## 12.5 Esempio — query libera
Se l’utente scrive `ditta ristrutturazioni`, il sistema deve poter mostrare coerentemente:
- categoria professionale: impresa edile
- categorie correlate: muratore, impresa ristrutturazioni
- interventi cliente correlati: ristrutturazione appartamento, rifacimento bagno, ristrutturazione cucina

### Regola
Gli slug non bastano da soli.  
Servono anche alias e search terms.

---

# 13. Campi minimi per entità

## 13.1 Settore
Campi minimi:
- `id`
- `nome`
- `slug`
- `descrizione_breve`
- `fase`
- `is_active`
- `sort_order`

## 13.2 Categoria professionale
Campi minimi:
- `id`
- `settore_id`
- `nome`
- `slug`
- `descrizione_breve`
- `alias[]`
- `search_terms[]`
- `is_active`
- `sort_order`

## 13.3 Servizio professionale
Campi minimi:
- `id`
- `categoria_id`
- `nome`
- `slug`
- `descrizione_breve`
- `alias[]`
- `search_terms[]`
- `is_active`
- `sort_order`

## 13.4 Intervento cliente
Campi minimi:
- `id`
- `nome`
- `slug`
- `descrizione_breve`
- `alias[]`
- `search_terms[]`
- `is_active`
- `sort_order`

## 13.5 Matching intervento → categoria
Campi minimi:
- `intervento_id`
- `categoria_id`
- `priority`
- `is_primary`
- `is_active`

## 13.6 Matching intervento → servizio rilevante
Campi minimi:
- `intervento_id`
- `servizio_id`
- `priority`
- `is_active`

---

# 14. Regole per aggiunte future

Una nuova voce può essere aggiunta solo se supera tutti i test seguenti.

## Test 1 — Livello corretto
La voce è chiaramente:
- settore
- categoria professionale
- servizio professionale
- intervento cliente

Se non è chiaro, non va inserita.

## Test 2 — Coerenza di fase
La voce appartiene al perimetro della fase attiva?

- se sì, può entrare
- se no, va in verticale separato o backlog
- se è dubbia, richiede decisione esplicita

## Test 3 — Utilità reale
La voce migliora davvero:
- matching
- chiarezza catalogo
- conversione cliente
- qualità del profilo impresa

Se aggiunge solo rumore, non va inserita.

## Test 4 — Non duplicazione
La voce non deve duplicare una voce già esistente con nome diverso ma semantica uguale o quasi uguale.

Per questo alias e search terms sono obbligatori.

## Test 5 — Crescita corretta
La crescita deve avvenire preferibilmente in questo ordine:
1. nuovo servizio professionale
2. nuovo intervento cliente
3. nuova categoria professionale
4. nuovo settore

Il nuovo settore è l’ultima opzione, non la prima.

---

# 15. Regole anti-confusione

FixPro non deve diventare:
- marketplace generico di tutto
- elenco casuale di mestieri
- catalogo con duplicati semantici
- sistema che scarica sul cliente la complessità tecnica

Obiettivi obbligatori:
- dominio chiaro
- tassonomia stabile
- matching preciso
- profili impresa coerenti
- SEO pulita
- ricerca robusta
- gestione corretta dei lavori semplici e composti

---

# 16. Esempio completo ufficiale

## Caso: rifacimento bagno

### Intervento cliente
- rifacimento bagno

### Settori coinvolti
- Edilizia e ristrutturazioni
- Impianti
- Finiture e interni

### Categorie professionali compatibili
- Impresa edile
- Muratore
- Idraulico
- Elettricista
- Piastrellista
- Termoidraulico

### Servizi professionali rilevanti
- demolizione bagno
- rifacimento impianto idrico
- rifacimento impianto elettrico
- posa rivestimenti
- installazione sanitari
- tinteggiatura finale

### Regola UX
Il cliente invia una sola richiesta.  
Il sistema decide chi è compatibile.

---

# 17. Regola finale non negoziabile

La struttura ufficiale di FixPro è:

## Tassonomia professionale
`Settore -> Categoria professionale -> Servizio professionale`

## Tassonomia cliente
`Intervento cliente`

## Matching
`Intervento cliente -> Categorie professionali compatibili -> Servizi professionali rilevanti`

Questa è la struttura SSOT.  
Non deve essere semplificata impropriamente e non deve essere sostituita da modelli rigidi “1 mestiere = 1 richiesta”.