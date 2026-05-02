## Come non far perdere il filo a Claude - Regole d'Oro

Questa guida e operativa. `CLAUDE.md` in root e il bootstrap iniziale, `docs/CLAUDE.md` contiene le regole permanenti, `docs/ROADMAP.md` contiene l'ordine degli step, `docs/Taxonomy.md` contiene il riferimento dettagliato di dominio per catalogo e tassonomia.

**Regola 1 - Inizio sessione**

Ogni nuova sessione parte cosi:

```text
Leggi CLAUDE.md, poi docs/ROADMAP.md, poi docs/CLAUDE.md. Se il task tocca catalogo o dominio, leggi anche docs/Taxonomy.md. Poi dimmi brevemente come hai capito step corrente, architettura e vincoli.
```

Se la risposta e corretta, procedi. Se dice cose strane, correggilo prima di far scrivere codice.

**Regola 2 - Sessioni lunghe**

Quando la conversazione supera 1-2 ore di lavoro, scrivi:

```text
/compact preserva le decisioni architetturali e gli errori gia corretti
```

**Regola 3 - Nuove funzionalita**

Usa sempre il comando slash:

```text
/new-feature [descrizione di quello che vuoi fare]
```

Questo forza Claude a cercare prima se esiste gia qualcosa di simile in schema, UI e pattern esistenti.

**Regola 4 - Errori sistemici**

Se Claude fa qualcosa di sbagliato, non correggere solo il task locale.

- Se e un errore architetturale o di sicurezza, aggiorna `docs/CLAUDE.md`.
- Se e un errore di ordine o milestone, aggiorna `docs/ROADMAP.md`.
- Se e un errore di uso operativo di Claude, aggiorna questo file.

**Regola 5 - Errori UI**

Se Claude inventa stile locale, classi arbitrarie o una pagina con linguaggio visivo nuovo:

1. ferma il task
2. correggi la regola in `docs/CLAUDE.md`
3. correggi il prompt operativo in `.claude/commands/new-feature.md`
4. poi torna alla pagina

Le pagine non devono nascere come luogo di styling creativo: devono comporre il sistema esistente.

**Regola 6 - Errori di tassonomia**

Se Claude mescola settori, categorie e servizi o allarga il catalogo in modo incoerente:

1. ferma il task
2. correggi la regola in `docs/CLAUDE.md`
3. correggi il dettaglio di dominio in `docs/Taxonomy.md`
4. poi torna alla feature
