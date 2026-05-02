import type { InterventoContent } from '../types'

export const tinteggiaturaCasaContent = {
  "slug": "tinteggiatura-casa",
  "price": {
    "range": "500 - 2.000 euro",
    "note": "Il prezzo cambia se le pareti sono gia pronte oppure se servono rasature, fondo fissativo e piu mani. Soffitti alti e case arredate fanno aumentare il tempo di lavoro."
  },
  "detailedCosts": [
    {
      "label": "Protezione ambienti",
      "unit": "euro/mq",
      "min": 80,
      "max": 250,
      "note": "In case arredate e abitate puo essere calcolata a corpo oppure incidere di piu sul prezzo finale."
    },
    {
      "label": "Preparazione pareti",
      "unit": "euro/mq",
      "min": 4,
      "max": 12,
      "note": "Buchi, crepe e vecchie pitture rovinate fanno salire il costo molto piu della semplice mano finale."
    },
    {
      "label": "Fondo e fissativo",
      "unit": "euro/mq",
      "min": 2,
      "max": 5,
      "note": "Serve quando il supporto assorbe in modo irregolare o quando vuoi evitare differenze di tono."
    },
    {
      "label": "Pittura pareti e soffitti",
      "unit": "euro/mq",
      "min": 6,
      "max": 18,
      "note": "Numero di mani, soffitti alti e pitture tecniche sono i fattori che cambiano di piu questa voce."
    },
    {
      "label": "Pulizia e ritocchi finali",
      "unit": "euro/intervento",
      "min": 50,
      "max": 150,
      "note": "Voce piccola ma reale, utile per riconsegnare gli ambienti in ordine."
    }
  ],
  "realExamples": [
    {
      "title": "Camera 16 mq Milano",
      "description": "Due mani di lavabile, piccoli stuccaggi e protezione arredi essenziale.",
      "price": "520 euro"
    },
    {
      "title": "Appartamento 70 mq Roma",
      "description": "Pareti e soffitti con preparazione media delle superfici e ritocchi finali.",
      "price": "1.650 euro"
    },
    {
      "title": "Trilocale 85 mq Torino",
      "description": "Tinteggiatura completa con rasature localizzate e soffitti inclusi.",
      "price": "1.950 euro"
    }
  ],
  "whenCostIncreases": [
    {
      "label": "Pareti rovinate",
      "note": "Crepe, muffa o vecchie pitture incoerenti fanno salire la preparazione."
    },
    {
      "label": "Casa arredata",
      "note": "Proteggere bene mobili e pavimenti richiede piu tempo."
    },
    {
      "label": "Pitture tecniche",
      "note": "Antimuffa, smalti o prodotti speciali costano piu della normale lavabile."
    }
  ],
  "whenCostDecreases": [
    {
      "label": "Pareti gia pronte",
      "note": "Se non servono rasature o primer il costo al mq e molto piu basso."
    },
    {
      "label": "Pochi mobili",
      "note": "Meno protezioni significano meno tempo e meno manodopera."
    },
    {
      "label": "Colori semplici",
      "note": "Toni standard e una o due mani riducono il tempo di lavorazione."
    }
  ],
  "faq": [
    {
      "question": "Quanto costa tinteggiare una casa con pareti gia pronte?",
      "answer": "Con superfici in ordine, colori standard e poche protezioni puoi restare nella fascia bassa del costo al mq. Se entrano in gioco rasature, primer o soffitti alti il prezzo sale in fretta."
    },
    {
      "question": "Quanto dura il lavoro?",
      "answer": "Una stanza semplice si conclude spesso in uno o due giorni. Per un appartamento intero contano tempi di preparazione, asciugatura e numero di locali da svuotare o proteggere."
    },
    {
      "question": "Serve rasare sempre?",
      "answer": "No, ma quando le pareti hanno micro crepe, buchi o vecchie pitture rovinate, saltare la rasatura porta quasi sempre a un risultato visivamente debole."
    },
    {
      "question": "Quanto cambia il prezzo tra Milano, Roma e Torino?",
      "answer": "Il delta tra citta non e enorme come in altri lavori, ma Milano e Roma tendono a salire un po di piu quando la casa e molto arredata o difficile da proteggere."
    }
  ],
  "guideSteps": [
    {
      "title": "Valutazione superfici",
      "explanation": "Si controllano muffe, crepe, vecchie pitture, aloni e assorbimenti diversi. Da qui dipende gran parte del preventivo reale.",
      "errors": [
        "Mandare solo foto parziali",
        "Pensare che tutte le pareti richiedano lo stesso lavoro"
      ]
    },
    {
      "title": "Preparazione e stuccature",
      "explanation": "Buchi, crepe e parti friabili vengono sistemati prima di qualsiasi mano di pittura.",
      "errors": [
        "Saltare la preparazione per risparmiare",
        "Non distinguere tra semplice ritocco e vera rasatura"
      ]
    },
    {
      "title": "Primer o fissativo",
      "explanation": "Serve quando il supporto assorbe in modo irregolare o quando c e il rischio che la nuova pittura non aggrappi bene.",
      "errors": [
        "Usare solo pittura senza stabilizzare il fondo",
        "Ignorare differenze di materiale tra pareti diverse"
      ]
    },
    {
      "title": "Stesura della pittura",
      "explanation": "Numero di mani, attese di asciugatura e controllo delle coperture fanno la differenza tra un lavoro economico e un risultato pulito.",
      "errors": [
        "Volere tutto in una mano sola",
        "Cambiare colore senza considerare quante mani servono davvero"
      ]
    },
    {
      "title": "Controllo finale",
      "explanation": "Si verificano uniformita, bordi, soffitti, copertura dei toni e pulizia finale di pavimenti e infissi.",
      "errors": [
        "Guardare il lavoro solo con luce artificiale",
        "Non segnare subito i ritocchi da fare"
      ]
    }
  ],
  "materials": [
    {
      "label": "Stucco e rasante",
      "note": "Servono per riportare la parete in ordine prima della finitura."
    },
    {
      "label": "Fissativo o primer",
      "note": "Aiutano ad avere un fondo uniforme e riducono il rischio di assorbimenti irregolari."
    },
    {
      "label": "Pittura lavabile o tecnica",
      "note": "La scelta dipende da ambiente, umidita e manutenzione attesa nel tempo."
    }
  ],
  "mistakes": [
    "Scegliere il preventivo piu basso senza chiedere quanta preparazione e inclusa.",
    "Dare per scontato che muffa e crepe si risolvano con una mano di pittura.",
    "Non valutare bene luce naturale e resa reale del colore scelto."
  ]
} satisfies InterventoContent
