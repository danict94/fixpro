import type { InterventoContent } from '../types'

export const rifacimentoBagnoContent = {
  "slug": "rifacimento-bagno",
  "price": {
    "range": "2.500 - 8.000 euro",
    "note": "Un bagno piccolo con layout invariato resta nella parte bassa della forbice. Se rifai impianti, rivestimenti e sanitari di fascia media o alta il totale sale velocemente."
  },
  "detailedCosts": [
    {
      "label": "Demolizione e smaltimento",
      "unit": "euro/mq",
      "min": 60,
      "max": 150,
      "note": "Include rimozione rivestimenti, sanitari e carico in discarica. In bagni piccoli il costo al mq tende a salire."
    },
    {
      "label": "Impianto idraulico",
      "unit": "euro/punto",
      "min": 180,
      "max": 450,
      "note": "Ogni punto acqua o scarico cambia se rifai tutto o se sposti wc, lavabo, bidet o doccia."
    },
    {
      "label": "Impianto elettrico",
      "unit": "euro/punto",
      "min": 70,
      "max": 140,
      "note": "Prese, luce specchio, comandi e aspirazione fanno salire il conto quando il bagno e poco predisposto."
    },
    {
      "label": "Massetto e impermeabilizzazione",
      "unit": "euro/mq",
      "min": 35,
      "max": 80,
      "note": "Diventa piu tecnica con doccia filo pavimento, sottofondi irregolari o pendenze da rifare."
    },
    {
      "label": "Piastrelle e posa",
      "unit": "euro/mq",
      "min": 45,
      "max": 120,
      "note": "Il prezzo comprende spesso posa standard. Grandi formati, mosaici e molti tagli fanno alzare il costo."
    },
    {
      "label": "Sanitari e rubinetteria",
      "unit": "euro/pezzo",
      "min": 120,
      "max": 900,
      "note": "Wc, bidet, lavabo, miscelatori e box doccia variano molto per gamma, marca e tipologia di installazione."
    }
  ],
  "realExamples": [
    {
      "title": "Bagno 4 mq Milano",
      "description": "Rifacimento completo con impianti confermati, gres standard e sanitari filo muro.",
      "price": "5.200 euro"
    },
    {
      "title": "Bagno 5 mq Roma",
      "description": "Rifacimento completo con spostamento doccia, nuovi impianti e box in vetro.",
      "price": "6.500 euro"
    },
    {
      "title": "Bagno 7 mq Torino",
      "description": "Bagno completo con doppio rivestimento, doccia walk in e sanitari sospesi.",
      "price": "8.900 euro"
    }
  ],
  "whenCostIncreases": [
    {
      "label": "Spostamento scarichi",
      "note": "Quando cambi la posizione di wc o doccia il lavoro idraulico sale subito."
    },
    {
      "label": "Lavori murari extra",
      "note": "Pareti fuori piombo, sottofondi rovinati o docce filo pavimento fanno crescere tempi e costo."
    },
    {
      "label": "Accesso difficile",
      "note": "Piani alti senza ascensore o centro storico incidono su smaltimento e consegne materiali."
    }
  ],
  "whenCostDecreases": [
    {
      "label": "Nessuno spostamento impianti",
      "note": "Lasciare wc, lavabo e doccia nelle posizioni attuali riduce molto il lavoro tecnico."
    },
    {
      "label": "Materiali standard",
      "note": "Piastrelle e sanitari di gamma media tengono il budget piu controllato."
    },
    {
      "label": "Cantiere semplice",
      "note": "Bagno regolare e accessibile riduce tempi di posa e smaltimento."
    }
  ],
  "faq": [
    {
      "question": "Quanto costa rifare un bagno senza toccare gli impianti?",
      "answer": "Se lasci scarichi e adduzioni nelle posizioni attuali, il budget si abbassa in modo evidente. In molti casi un bagno base con sole finiture e sanitari standard resta tra 3.000 e 5.000 euro."
    },
    {
      "question": "Quanto dura un rifacimento bagno?",
      "answer": "Se materiali e scelte sono gia definite, un bagno standard richiede spesso tra 5 e 10 giorni lavorativi. I tempi si allungano quando ci sono fuori squadra, impianti da spostare o attese sui sanitari."
    },
    {
      "question": "Serve la CILA?",
      "answer": "Per il semplice rifacimento con sostituzione finiture spesso no, ma se fai opere piu ampie o modifichi in modo rilevante la distribuzione conviene sempre verificare con tecnico o impresa locale."
    },
    {
      "question": "Quanto cambia il costo tra Milano, Roma e Torino?",
      "answer": "A parita di bagno, Milano e Roma tendono a stare leggermente piu in alto per manodopera e logistica. Torino di solito resta piu stabile, soprattutto quando il cantiere e semplice da raggiungere."
    }
  ],
  "guideSteps": [
    {
      "title": "Demolizione",
      "explanation": "Si rimuovono sanitari, rivestimenti, massetto vecchio e tutto cio che impedisce di ricostruire il bagno su una base sana.",
      "errors": [
        "Pensare che smaltimento e protezioni siano inclusi senza chiederlo",
        "Non verificare se ci sono tubazioni o scarichi fuori asse"
      ]
    },
    {
      "title": "Impianti",
      "explanation": "Si rifanno o si aggiornano adduzioni, scarichi e punti elettrici. E la fase che decide davvero la funzionalita del bagno futuro.",
      "errors": [
        "Scegliere la posizione dei sanitari troppo tardi",
        "Ignorare lo spazio necessario per doccia, lavabo e aperture"
      ]
    },
    {
      "title": "Massetto e preparazione",
      "explanation": "Serve a correggere quote, creare pendenze corrette e preparare il fondo per impermeabilizzazione e posa.",
      "errors": [
        "Saltare l impermeabilizzazione in zona doccia",
        "Non controllare le quote con il pavimento esterno"
      ]
    },
    {
      "title": "Piastrelle e finiture",
      "explanation": "Si posa il rivestimento e si definiscono tagli, spigoli, nicchie e fughe. E la fase in cui estetica e precisione fanno la differenza.",
      "errors": [
        "Scegliere grandi formati senza valutare tagli e sfridi",
        "Decidere il disegno di posa quando il lavoro e gia partito"
      ]
    },
    {
      "title": "Sanitari e collaudo",
      "explanation": "Si montano sanitari, rubinetteria, box doccia e accessori. Poi si controllano scarichi, pendenze, sigillature e tenuta generale.",
      "errors": [
        "Non verificare subito piccole perdite o sigillature",
        "Accettare il lavoro senza una prova completa di utilizzo"
      ]
    }
  ],
  "materials": [
    {
      "label": "Piastrelle e fuganti",
      "note": "Formato e finitura cambiano sia il prezzo del materiale sia il costo della posa."
    },
    {
      "label": "Impermeabilizzante e collanti",
      "note": "Sono materiali poco visibili ma decisivi per durata e tenuta del bagno."
    },
    {
      "label": "Sanitari e rubinetteria",
      "note": "Conviene sceglierli prima di chiudere il preventivo per evitare variazioni in corso d opera."
    }
  ],
  "mistakes": [
    "Scegliere l impresa solo in base al prezzo finale e non a cosa include davvero.",
    "Ignorare lo stato degli impianti esistenti e concentrarsi solo su piastrelle e sanitari.",
    "Sottovalutare ventilazione, scarichi e quote della doccia."
  ]
} satisfies InterventoContent
