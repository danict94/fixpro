Esegui il `DB Duplication Gate` per questa richiesta: $ARGUMENTS

Questo comando e obbligatorio prima di creare o proporre:

- nuova tabella
- nuovo campo
- nuova relation
- nuovo enum
- nuova route dati/shared
- nuovo profilo
- nuovo modello media
- nuovo stato
- nuovo componente o pattern shared quando rischia duplicazione funzionale

## Regole

1. Ispeziona schema, router, modelli, tipi, componenti shared e documentazione operativa prima di concludere.
2. Non limitarti a trovare nomi uguali: cerca anche equivalenti funzionali o dati gia derivabili.
3. Se non puoi identificare una SSOT chiara, considera il risultato bloccante.
4. Se la nuova aggiunta crea doppia verita, proponi estensione del modello esistente invece della creazione.
5. Se il task e ambiguo tra dato derivato e dato primario, fermati e segnala il rischio.

## Output obbligatorio

Rispondi SEMPRE in questo formato:

- `Requested addition`:
- `Existing equivalent`:
- `Source of truth`:
- `Derived or primary`:
- `Redundancy / double-truth risk`:
- `Extend vs create`:
- `Decision`:

## Vincoli sulla decisione

- `Decision: CREATE` e ammessa solo se non esiste equivalente reale, la SSOT e chiara e non nasce una doppia verita.
- `Decision: EXTEND_EXISTING` e la scelta predefinita quando il comportamento puo vivere nel modello o servizio gia presente.
- `Decision: BLOCK` e obbligatoria se:
  - la SSOT non e chiara
  - esiste gia un equivalente
  - la proposta introduce ridondanza
  - il nuovo dato e derivabile e non serve persisterlo

Non proporre implementazione finche questo gate non ha una decisione esplicita.
