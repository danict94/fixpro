import type { InterventoContent } from '../types'

export const ristrutturazioneAppartamentoContent = {
  "slug": "ristrutturazione-appartamento",
  "price": {
    "range": "8.000 - 60.000 euro",
    "note": "Conta soprattutto quanti ambienti tocchi e se rifai gli impianti. Una ristrutturazione cosmetica costa molto meno di un lavoro completo su bagni, cucina e distribuzione interna."
  },
  "detailedCosts": [
    {
      "label": "Demolizioni iniziali",
      "unit": "euro/mq",
      "min": 18,
      "max": 45,
      "note": "Incidono spessori da rimuovere, volume di smaltimento e accessibilita al piano o al cortile."
    },
    {
      "label": "Impianto elettrico",
      "unit": "euro/punto",
      "min": 45,
      "max": 95,
      "note": "Ogni punto luce o presa cambia di prezzo in base a serie civile, tracce e predisposizioni aggiuntive."
    },
    {
      "label": "Impianto idraulico",
      "unit": "euro/punto",
      "min": 180,
      "max": 500,
      "note": "Cucine e bagni incidono di piu, soprattutto quando sposti scarichi, colonne o adduzioni esistenti."
    },
    {
      "label": "Sottofondi, massetti e rasature",
      "unit": "euro/mq",
      "min": 25,
      "max": 60,
      "note": "Voce chiave se devi correggere quote, planarita o supporti non adatti a nuovi pavimenti."
    },
    {
      "label": "Pavimenti, rivestimenti e posa",
      "unit": "euro/mq",
      "min": 35,
      "max": 140,
      "note": "Il range cresce molto con parquet, grande formato, gres tecnico o rivestimenti di design."
    },
    {
      "label": "Pittura e finiture finali",
      "unit": "euro/mq",
      "min": 8,
      "max": 22,
      "note": "Comprende pareti, soffitti e ritocchi finali. Cresce se le superfici richiedono rasatura seria."
    }
  ],
  "realExamples": [
    {
      "title": "Bilocale 55 mq Milano",
      "description": "Pavimenti, pittura, bagno e revisione elettrica senza modificare la distribuzione.",
      "price": "19.500 euro"
    },
    {
      "title": "Appartamento 90 mq Roma",
      "description": "Ristrutturazione completa con due bagni, cucina e rifacimento impianti.",
      "price": "42.000 euro"
    },
    {
      "title": "Trilocale 75 mq Torino",
      "description": "Intervento medio con nuovi pavimenti, un bagno e impianto elettrico rifatto.",
      "price": "28.000 euro"
    }
  ],
  "whenCostIncreases": [
    {
      "label": "Impianti completi",
      "note": "Rifare elettrico e idraulico in tutti gli ambienti e la voce piu pesante."
    },
    {
      "label": "Distribuzione interna",
      "note": "Spostare tramezzi o modificare layout richiede piu opere e piu coordinamento."
    },
    {
      "label": "Finiture medio alte",
      "note": "Pavimenti, rivestimenti e serramenti di fascia superiore aumentano budget e tempi."
    }
  ],
  "whenCostDecreases": [
    {
      "label": "Intervento leggero",
      "note": "Se non rifai tutti gli impianti il costo scende in modo sensibile."
    },
    {
      "label": "Layout invariato",
      "note": "Non toccare distribuzione interna riduce opere murarie e coordinamento."
    },
    {
      "label": "Capitolato definito subito",
      "note": "Evitare cambi in corso d opera limita extra e ritardi."
    }
  ],
  "faq": [
    {
      "question": "Quanto costa ristrutturare senza rifare tutti gli impianti?",
      "answer": "Se tieni buono parte dell impianto e non sposti la distribuzione interna, una ristrutturazione leggera puo restare molto piu vicina alla fascia bassa. Rifare elettrico e idraulico in tutti gli ambienti e la svolta che cambia davvero il costo."
    },
    {
      "question": "Quanto tempo dura una ristrutturazione?",
      "answer": "Per un appartamento medio servono spesso da 4 a 10 settimane. Pesano molto numero di bagni, impianti da rifare e disponibilita dei materiali scelti."
    },
    {
      "question": "Serve la CILA per una ristrutturazione interna?",
      "answer": "Quando tocchi distribuzione interna o lavori in modo piu strutturato e una verifica tecnica e quasi obbligata. Per sole finiture il quadro e piu semplice, ma non conviene mai dare per scontato il lato edilizio."
    },
    {
      "question": "Quanto cambia tra Milano, Roma e Torino?",
      "answer": "Milano e Roma tendono a essere leggermente piu alte sulle lavorazioni complete, soprattutto nei centri urbani complessi. Torino resta spesso un po piu lineare sui lavori programmati."
    }
  ],
  "guideSteps": [
    {
      "title": "Demolizioni e svuotamento",
      "explanation": "Si tolgono rivestimenti, pavimenti, sanitari e tramezzi non piu utili. E la fase che libera il campo e fa emergere i primi imprevisti reali.",
      "errors": [
        "Partire senza una lista precisa di cosa resta e cosa va tolto",
        "Sottovalutare tempi di smaltimento e pulizia"
      ]
    },
    {
      "title": "Impianti",
      "explanation": "Si ridisegnano impianto elettrico, idraulico e predisposizioni in base a cucina, bagni e arredi futuri.",
      "errors": [
        "Non progettare prese e punti luce con la disposizione finale",
        "Aprire le tracce prima di decidere tutti i sanitari e gli elettrodomestici"
      ]
    },
    {
      "title": "Massetti e sottofondi",
      "explanation": "Questa fase rende il supporto pronto a ricevere i nuovi pavimenti e corregge quote, planarita e dislivelli.",
      "errors": [
        "Pensare solo alla finitura senza controllare il sottofondo",
        "Non valutare eventuale asciugatura prima della posa"
      ]
    },
    {
      "title": "Pavimenti, bagni e pitture",
      "explanation": "Si entra nella parte visibile del lavoro: rivestimenti, porte, sanitari, tinteggiature e dettagli finali.",
      "errors": [
        "Far arrivare i materiali in ritardo",
        "Cambiare finiture mentre il cantiere e gia in chiusura"
      ]
    },
    {
      "title": "Consegna e verifica",
      "explanation": "Si controllano impianti, chiusure, giunti, finiture e tutti i piccoli punti che tendono a emergere solo a lavoro quasi finito.",
      "errors": [
        "Non fare un controllo stanza per stanza",
        "Chiudere i lavori senza segnare gli ultimi ritocchi"
      ]
    }
  ],
  "materials": [
    {
      "label": "Pavimenti e rivestimenti",
      "note": "Influenzano costo, tempi di consegna e sottofondi necessari."
    },
    {
      "label": "Componenti impiantistici",
      "note": "Quadri, cassette, collettori e accessori incidono piu del solo costo di posa."
    },
    {
      "label": "Pitture, porte e finiture",
      "note": "Sono le scelte che spostano di piu il risultato percepito alla consegna."
    }
  ],
  "mistakes": [
    "Aprire il cantiere senza aver definito una lista precisa dei materiali principali.",
    "Pensare agli arredi dopo aver gia chiuso impianti e punti luce.",
    "Spezzare troppo i lavori senza un coordinamento unico tra le maestranze."
  ]
} satisfies InterventoContent
