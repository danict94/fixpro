import type { InterventoContent } from '../types'

export const perditaAcquaContent = {
  "slug": "perdita-acqua",
  "price": {
    "range": "80 - 450 euro",
    "note": "Una perdita visibile su rubinetto o sifone costa poco piu dell uscita. Se il guasto e nascosto e richiede ricerca, apertura e ripristino murario il preventivo cresce."
  },
  "detailedCosts": [
    {
      "label": "Uscita e diagnosi iniziale",
      "unit": "euro/intervento",
      "min": 50,
      "max": 100,
      "note": "Serve a capire se il problema e su componente visibile o su una linea incassata da aprire."
    },
    {
      "label": "Ricerca perdita",
      "unit": "euro/intervento",
      "min": 80,
      "max": 200,
      "note": "Necessaria quando il punto non e evidente e bisogna evitare demolizioni inutili."
    },
    {
      "label": "Riparazione rubinetto o sifone",
      "unit": "euro/pezzo",
      "min": 40,
      "max": 120,
      "note": "Tipico caso semplice, con ricambio rapido e nessun ripristino edile."
    },
    {
      "label": "Riparazione tubazione",
      "unit": "euro/punto",
      "min": 120,
      "max": 320,
      "note": "Sale se il tratto e incassato, difficile da raggiungere o richiede lavorazioni murarie di supporto."
    },
    {
      "label": "Ripristino murario o rivestimento",
      "unit": "euro/mq",
      "min": 70,
      "max": 250,
      "note": "Spesso e la voce dimenticata: conta soprattutto se ci sono piastrelle o finiture da riprendere."
    }
  ],
  "realExamples": [
    {
      "title": "Perdita lavabo Milano",
      "description": "Sostituzione sifone e controllo tenuta senza opere murarie.",
      "price": "95 euro"
    },
    {
      "title": "Perdita tubo incassato Roma",
      "description": "Ricerca guasto, apertura parete, sostituzione tratto e primo ripristino.",
      "price": "320 euro"
    },
    {
      "title": "Perdita scarico bagno Torino",
      "description": "Intervento con demolizione mirata e ripristino localizzato del rivestimento.",
      "price": "410 euro"
    }
  ],
  "whenCostIncreases": [
    {
      "label": "Guasto nascosto",
      "note": "Se il punto non e visibile servono ricerca e demolizione mirata."
    },
    {
      "label": "Ripristino rivestimento",
      "note": "Piastrelle o finiture difficili da rifare alzano il totale."
    },
    {
      "label": "Urgenza serale o festiva",
      "note": "Interventi fuori orario hanno spesso maggiorazioni."
    }
  ],
  "whenCostDecreases": [
    {
      "label": "Guasto visibile",
      "note": "Se la perdita e su sifone o rubinetto spesso non servono ricerche o demolizioni."
    },
    {
      "label": "Nessun ripristino edile",
      "note": "Quando non tocchi muro o pavimento il conto resta contenuto."
    },
    {
      "label": "Intervento in orario ordinario",
      "note": "Eviti maggiorazioni tipiche delle urgenze."
    }
  ],
  "faq": [
    {
      "question": "Quanto costa trovare una perdita senza rompere troppo?",
      "answer": "La sola ricerca puo stare tra 80 e 200 euro, ma il totale vero dipende da dove si trova il guasto e da quanto lavoro serve poi per riparare e ripristinare."
    },
    {
      "question": "Quanto dura l intervento?",
      "answer": "Una perdita semplice si risolve anche in meno di un ora. Se invece bisogna individuare il punto, aprire la muratura e richiudere, si puo arrivare a una giornata o a piu accessi."
    },
    {
      "question": "Serve rompere il muro?",
      "answer": "Non sempre. Se il problema e su un sifone, un flessibile o un rubinetto no. Se la perdita e su una tubazione incassata, spesso una piccola demolizione mirata e inevitabile."
    },
    {
      "question": "Il costo cambia molto da una citta all altra?",
      "answer": "Sulle perdite semplici cambia poco. Il delta cresce se servono accessi rapidi, pronto intervento o lavori murari in centro citta con logistica piu scomoda."
    }
  ],
  "guideSteps": [
    {
      "title": "Diagnosi del problema",
      "explanation": "Si capisce se la perdita arriva da un componente visibile, da una tubazione incassata o da una linea condominiale o condivisa.",
      "errors": [
        "Descrivere il danno invece della causa osservata",
        "Non indicare da quanto tempo compare acqua o umidita"
      ]
    },
    {
      "title": "Apertura mirata",
      "explanation": "Quando il guasto e nascosto si apre solo la parte necessaria, limitando demolizioni inutili.",
      "errors": [
        "Rompere senza una ricerca minima",
        "Aprire troppo per fretta o supposizione"
      ]
    },
    {
      "title": "Riparazione impianto",
      "explanation": "Si sostituisce il componente difettoso o il tratto di tubo danneggiato, verificando che il resto della linea sia affidabile.",
      "errors": [
        "Fare una riparazione provvisoria su parti gia vecchie",
        "Cambiare il pezzo senza controllare raccordi e giunzioni vicine"
      ]
    },
    {
      "title": "Ripristino murario",
      "explanation": "Se sono state aperte pareti o pavimenti si richiude il punto con un ripristino coerente con il contesto.",
      "errors": [
        "Considerare il lavoro finito appena smette di perdere",
        "Dimenticare la finitura estetica necessaria dopo la riparazione"
      ]
    },
    {
      "title": "Prova di tenuta",
      "explanation": "Ultimo passaggio per verificare che la perdita sia davvero risolta e che non restino trafilamenti lenti.",
      "errors": [
        "Riutilizzare subito senza test",
        "Non monitorare la zona nelle ore successive"
      ]
    }
  ],
  "materials": [
    {
      "label": "Raccordi e valvole",
      "note": "La qualita del ricambio fa la differenza soprattutto su interventi ripetuti nel tempo."
    },
    {
      "label": "Tubazioni compatibili",
      "note": "Il tecnico deve usare materiale adatto all impianto esistente, non solo il primo disponibile."
    },
    {
      "label": "Materiali di ripristino",
      "note": "Stucco, rasante o piastrelle di chiusura possono incidere se il guasto e incassato."
    }
  ],
  "mistakes": [
    "Aspettare troppo quando l umidita si allarga o il danno torna ciclicamente.",
    "Fare solo una riparazione tampone senza capire da dove nasce il problema.",
    "Non considerare il costo del ripristino dopo aver sistemato il guasto."
  ]
} satisfies InterventoContent
