import {
  Building2,
  CheckCircle,
  HelpCircle,
  ImagePlus,
  Layers,
  MapPin,
  Settings2,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import type { WorkTypeOption } from './types'

export const STEPS_LOGGED = [
  'Dove si fa il lavoro?',
  'Cosa devi fare?',
  'Professionisti disponibili',
  'Dettagli & urgenza',
  'Immagini (opzionale)',
  'Che intenzione hai?',
  'Chi sei?',
]

export const STEPS_GUEST = [
  'Dove si fa il lavoro?',
  'Cosa devi fare?',
  'Professionisti disponibili',
  'Dettagli & urgenza',
  'Immagini (opzionale)',
  'Che intenzione hai?',
  'Come ti contattano?',
  'Crea account',
  'Verifica contatti',
]

export const ICONS_LOGGED = [
  MapPin,
  Layers,
  Building2,
  Settings2,
  ImagePlus,
  HelpCircle,
  User,
]

export const ICONS_GUEST = [
  MapPin,
  Layers,
  Building2,
  Settings2,
  ImagePlus,
  HelpCircle,
  Users,
  ShieldCheck,
  CheckCircle,
]

export const WORK_TYPE_OPTIONS: WorkTypeOption[] = [
  {
    value: 'SMALL',
    title: 'Piccolo intervento',
    description: 'Riparazioni, lavori mirati o singoli interventi.',
    icon: Settings2,
  },
  {
    value: 'FULL',
    title: 'Lavoro completo / chiavi in mano',
    description: 'Gestione completa del progetto, dalla A alla Z.',
    icon: Building2,
  },
  {
    value: 'UNKNOWN',
    title: 'Non sono sicuro',
    description: 'Ti aiutiamo noi a trovare il professionista giusto.',
    icon: HelpCircle,
  },
]