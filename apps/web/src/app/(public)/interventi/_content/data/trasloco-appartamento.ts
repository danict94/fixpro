import type { InterventoContent } from '../types'

export const traslocoAppartamentoContent = {
  "slug": "trasloco-appartamento",
  "price": {
    "range": "400 - 2.500 euro",
    "note": "Il costo dipende da volume reale, piano, presenza di ascensore, distanza e servizi accessori come imballaggio, smontaggio e rimontaggio."
  },
  "detailedCosts": [
    {
      "label": "Imballaggio",
      "unit": "euro/mc",
      "min": 12,
      "max": 30,
      "note": "Dipende dal volume reale e da quanti oggetti fragili o delicati richiedono protezione extra."
    },
    {
      "label": "Smontaggio mobili",
      "unit": "euro/pezzo",
      "min": 40,
      "max": 180,
      "note": "Cucine, armadi grandi e mobili su misura sono le voci che fanno crescere piu rapidamente il preventivo."
    },
    {
      "label": "Carico, trasporto e scarico",
      "unit": "euro/mc",
      "min": 25,
      "max": 70,
      "note": "Conta il volume, ma anche distanza, piano, ascensore e facilita di sosta sotto gli immobili."
    },
    {
      "label": "Elevatore esterno o facchinaggio extra",
      "unit": "euro/intervento",
      "min": 100,
      "max": 400,
      "note": "Serve quando scale, piani alti o cortili interni rendono poco pratico un trasporto standard."
    },
    {
      "label": "Rimontaggio e assestamenti finali",
      "unit": "euro/pezzo",
      "min": 40,
      "max": 140,
      "note": "Voce utile se vuoi ritrovare subito gli arredi principali montati nella nuova casa."
    }
  ],
  "realExamples": [
    {
      "title": "Bilocale Milano",
      "description": "Carico, trasporto e scarico senza imballaggio completo ne mobili complessi.",
      "price": "650 euro"
    },
    {
      "title": "Trilocale Roma",
      "description": "Imballaggio fragili, due piani senza ascensore e rimontaggio essenziale.",
      "price": "1.850 euro"
    },
    {
      "title": "Appartamento 90 mq Torino",
      "description": "Trasloco con elevatore esterno, smontaggio armadi e rimontaggio in nuova casa.",
      "price": "2.300 euro"
    }
  ],
  "whenCostIncreases": [
    {
      "label": "Piano alto senza ascensore",
      "note": "Aumenta facchinaggio e tempi di carico scarico."
    },
    {
      "label": "Molti mobili da smontare",
      "note": "Armadi grandi, cucine e arredi su misura fanno crescere ore e personale."
    },
    {
      "label": "Parcheggio complicato",
      "note": "Centro storico o sosta lontana dall ingresso allungano tutto il lavoro."
    }
  ],
  "whenCostDecreases": [
    {
      "label": "Volume ridotto",
      "note": "Meno mobili e scatole significano meno ore e meno personale."
    },
    {
      "label": "Ascensore presente",
      "note": "Riduce in modo netto il facchinaggio."
    },
    {
      "label": "Smontaggio non necessario",
      "note": "Se i mobili viaggiano gia pronti risparmi tempo e costo."
    }
  ],
  "faq": [
    {
      "question": "Quanto costa un trasloco senza smontaggio mobili?",
      "answer": "Se non hai armadi, cucine o letti da smontare il trasloco resta molto piu semplice e spesso rientra nella fascia bassa. Il vero driver resta il volume reale di cose da movimentare."
    },
    {
      "question": "Quanto tempo serve per traslocare?",
      "answer": "Un bilocale ordinato puo chiudersi in giornata. Se ci sono imballaggi, smontaggi complessi e lunghi spostamenti, tra preparazione e consegna puo servire anche piu tempo."
    },
    {
      "question": "Serve chiedere permessi?",
      "answer": "A volte si, soprattutto in centro o quando serve occupare spazio per il mezzo o per un elevatore esterno. Meglio chiarirlo prima invece di scoprirlo il giorno del trasloco."
    },
    {
      "question": "Quanto cambia tra Milano, Roma e Torino?",
      "answer": "Il costo cambia soprattutto per logistica e accessibilita. Milano e Roma possono salire se il mezzo non si avvicina bene, mentre Torino resta spesso piu regolare sui traslochi programmati."
    }
  ],
  "guideSteps": [
    {
      "title": "Sopralluogo e inventario",
      "explanation": "Si misura il volume reale, si segnano i mobili da smontare e si capiscono accessi, ascensori e distanze.",
      "errors": [
        "Dimenticare cantina, box o balconi",
        "Fare un elenco troppo vago dei mobili"
      ]
    },
    {
      "title": "Imballaggio",
      "explanation": "Si proteggono gli oggetti fragili, si organizzano scatole per stanze e si etichetta cio che dovra essere scaricato per primo.",
      "errors": [
        "Usare scatole tutte uguali senza etichette",
        "Mescolare fragile e pesante nella stessa scatola"
      ]
    },
    {
      "title": "Smontaggio mobili",
      "explanation": "Armadi, letti e mobili complessi vengono smontati per viaggiare in sicurezza e occupare meno spazio.",
      "errors": [
        "Non segnalare in anticipo mobili su misura",
        "Lasciare l ultimo momento per svuotare armadi e cassetti"
      ]
    },
    {
      "title": "Trasporto e scarico",
      "explanation": "La squadra organizza il mezzo, ottimizza i passaggi e scarica nel nuovo immobile seguendo un ordine utile.",
      "errors": [
        "Non verificare prima il parcheggio",
        "Ignorare accessi stretti o orari condominiali"
      ]
    },
    {
      "title": "Rimontaggio e controllo finale",
      "explanation": "Si rimontano gli arredi concordati e si verifica che tutto sia arrivato integro e nella stanza giusta.",
      "errors": [
        "Accorgersi di danni solo giorni dopo",
        "Non avere una lista chiara di cosa va rimontato subito"
      ]
    }
  ],
  "materials": [
    {
      "label": "Scatole e materiali protettivi",
      "note": "Un buon imballaggio riduce danni e perdite di tempo allo scarico."
    },
    {
      "label": "Coperte e protezioni mobili",
      "note": "Sono essenziali per superfici laccate, vetri e arredi delicati."
    },
    {
      "label": "Etichette e divisione per stanze",
      "note": "Sembrano dettagli ma velocizzano molto la fase di scarico e sistemazione."
    }
  ],
  "mistakes": [
    "Fornire un inventario troppo generico e poi aggiungere mobili il giorno del carico.",
    "Sottovalutare piani alti, assenza di ascensore e vincoli di parcheggio.",
    "Non separare in anticipo gli oggetti fragili o quelli che servono subito nella nuova casa."
  ]
} satisfies InterventoContent
