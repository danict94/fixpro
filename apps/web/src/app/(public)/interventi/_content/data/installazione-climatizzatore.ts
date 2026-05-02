import type { InterventoContent } from '../types'

export const installazioneClimatizzatoreContent = {
  "slug": "installazione-climatizzatore",
  "price": {
    "range": "300 - 1.200 euro",
    "note": "Per un monosplit in posa semplice il costo e contenuto. Tubazioni lunghe, lavori in facciata, predisposizioni assenti o multi split spostano il preventivo verso l alto."
  },
  "detailedCosts": [
    {
      "label": "Sopralluogo e verifica posa",
      "unit": "euro/intervento",
      "min": 0,
      "max": 80,
      "note": "Alcuni installatori lo includono nel lavoro, altri lo valorizzano se il caso e complesso."
    },
    {
      "label": "Staffe, fori e canaline",
      "unit": "euro/punto",
      "min": 80,
      "max": 220,
      "note": "Incidono accessibilita del muro, finitura richiesta e numero di metri di canalina da lasciare a vista."
    },
    {
      "label": "Collegamenti frigoriferi",
      "unit": "euro/metro",
      "min": 25,
      "max": 60,
      "note": "Il range cambia in base ai metri reali di rame e alla difficolta del percorso."
    },
    {
      "label": "Linea elettrica e scarico condensa",
      "unit": "euro/punto",
      "min": 70,
      "max": 250,
      "note": "Pesa molto quando non esiste una predisposizione o quando il punto di scarico e scomodo."
    },
    {
      "label": "Vuoto, avviamento e collaudo",
      "unit": "euro/intervento",
      "min": 50,
      "max": 120,
      "note": "Serve a consegnare un impianto funzionante e non soltanto montato a muro."
    }
  ],
  "realExamples": [
    {
      "title": "Monosplit Milano",
      "description": "Posa semplice con unita vicine, tubazioni corte e staffe standard.",
      "price": "420 euro"
    },
    {
      "title": "Dual split Roma",
      "description": "Collegamenti piu complessi, canaline visibili e scarico condensa da gestire.",
      "price": "1.050 euro"
    },
    {
      "title": "Monosplit con predisposizione assente Torino",
      "description": "Nuovi passaggi, linea elettrica dedicata e scarico condensa da realizzare.",
      "price": "760 euro"
    }
  ],
  "whenCostIncreases": [
    {
      "label": "Predisposizione assente",
      "note": "Quando mancano passaggi e scarichi il lavoro diventa piu lungo e tecnico."
    },
    {
      "label": "Tubazioni lunghe",
      "note": "Ogni metro in piu aumenta materiali e tempi di posa."
    },
    {
      "label": "Facciata o accesso difficile",
      "note": "Scale, ponteggi o punti esterni scomodi fanno salire il preventivo."
    }
  ],
  "whenCostDecreases": [
    {
      "label": "Posa lineare",
      "note": "Unita vicine e passaggi semplici rendono l installazione piu veloce."
    },
    {
      "label": "Predisposizione esistente",
      "note": "Se scarico e linea sono gia pronti il preventivo resta piu basso."
    },
    {
      "label": "Macchina standard",
      "note": "Un monosplit classico richiede meno lavoro di un dual o multi split."
    }
  ],
  "faq": [
    {
      "question": "Quanto costa installare un climatizzatore senza predisposizione?",
      "answer": "Senza predisposizione il tecnico deve creare passaggi, scarico condensa e talvolta linea elettrica dedicata. Questo sposta il lavoro fuori dalla fascia base e puo far crescere il preventivo in modo netto."
    },
    {
      "question": "Quanto dura il montaggio?",
      "answer": "Per un caso semplice basta spesso mezza giornata. Se mancano predisposizioni, servono passaggi lunghi o piu unita, il lavoro puo occupare una giornata piena."
    },
    {
      "question": "Serve una predisposizione?",
      "answer": "Aiuta molto ma non e obbligatoria. Senza predisposizione il tecnico deve creare passaggi, scarico condensa e talvolta linea elettrica, con aumento di tempi e costo."
    },
    {
      "question": "Quanto cambia tra Milano, Roma e Torino?",
      "answer": "La differenza tra citta si vede soprattutto su logistica, facciate e tempi di accesso. Nei contesti condominiali complessi o in centro storico il costo medio tende a salire."
    }
  ],
  "guideSteps": [
    {
      "title": "Sopralluogo",
      "explanation": "Si valuta dove mettere unita interna ed esterna, come passare le tubazioni e dove scaricare la condensa.",
      "errors": [
        "Scegliere il punto solo per estetica",
        "Non considerare manutenzione e accessibilita futura"
      ]
    },
    {
      "title": "Fori, staffe e passaggi",
      "explanation": "Si preparano supporti, carotaggi e canaline necessarie a una posa ordinata e funzionale.",
      "errors": [
        "Sottostimare la lunghezza reale del percorso",
        "Non verificare prima spessori e ostacoli del muro"
      ]
    },
    {
      "title": "Collegamenti frigoriferi",
      "explanation": "Tubazioni rame, cavi e connessioni tra le unita devono essere eseguiti con attenzione per evitare perdite e cali di resa.",
      "errors": [
        "Fare curve troppo strette",
        "Allungare troppo i percorsi senza valutarne l impatto"
      ]
    },
    {
      "title": "Scarico condensa e linea elettrica",
      "explanation": "Una parte spesso sottovalutata ma decisiva: se scarico e alimentazione non sono ben progettati nascono i problemi piu comuni.",
      "errors": [
        "Scarico condensa con pendenza sbagliata",
        "Usare linee elettriche non adeguate al carico reale"
      ]
    },
    {
      "title": "Avviamento e collaudo",
      "explanation": "Si controllano vuoto, avvio macchina, temperature e rumorosita per consegnare un impianto davvero funzionante.",
      "errors": [
        "Saltare il collaudo per velocizzare la consegna",
        "Non controllare la resa in condizioni reali"
      ]
    }
  ],
  "materials": [
    {
      "label": "Tubazioni e coibentazione",
      "note": "La qualita del percorso frigorifero influisce su resa e durata dell impianto."
    },
    {
      "label": "Canaline e staffaggi",
      "note": "Sono la parte piu visibile del lavoro e vanno pensati anche in chiave estetica."
    },
    {
      "label": "Scarico condensa",
      "note": "Va progettato bene per evitare gocciolamenti e ritorni d acqua."
    }
  ],
  "mistakes": [
    "Guardare solo il prezzo della macchina e non quello della posa.",
    "Ignorare scarico condensa e linea elettrica nel preventivo iniziale.",
    "Accettare una posizione scomoda per manutenzione o pulizia futura."
  ]
} satisfies InterventoContent
