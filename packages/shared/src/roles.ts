// Tipo utente prodotto — unici valori selezionabili in registrazione pubblica.
// Il privilegio amministrativo è separato: vedi User.adminRole nel DB.
export const ProductRole = {
  CLIENT: 'CLIENT',
  COMPANY: 'COMPANY',
} as const

export type ProductRole = (typeof ProductRole)[keyof typeof ProductRole]
