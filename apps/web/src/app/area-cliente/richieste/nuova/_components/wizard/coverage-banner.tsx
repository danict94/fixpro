import { Building2, CheckCircle, MapPin, Users } from 'lucide-react'

type CoverageMessage = 'great' | 'some' | 'none' | 'unknown'

export function CoverageBanner({
  visible,
  isLoading,
  message,
}: {
  visible: boolean
  isLoading: boolean
  message?: CoverageMessage
}) {
  if (!visible) {
    return null
  }

  if (isLoading) {
    return (
      <div className="surface-section animate-pulse px-4 py-3 text-xs text-muted-foreground">
        Verifica copertura zona...
      </div>
    )
  }

  if (!message) {
    return null
  }

  if (message === 'great') {
    return (
      <div className="surface-section flex items-start gap-2 border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
        <span>Ottimo! Ci sono professionisti qualificati nella tua zona.</span>
      </div>
    )
  }

  if (message === 'some') {
    return (
      <div className="surface-section flex items-start gap-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <Users className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
        <span>Abbiamo trovato alcuni professionisti nella tua zona.</span>
      </div>
    )
  }

  if (message === 'unknown') {
    return (
      <div className="surface-section flex items-start gap-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
        <span>
          Per verificare la copertura reale in base al raggio dei professionisti, seleziona un
          indirizzo dai suggerimenti.
        </span>
      </div>
    )
  }

  return (
    <div className="surface-section flex items-start gap-2 bg-muted px-4 py-3 text-sm text-muted-foreground">
      <Building2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <span>Non abbiamo ancora professionisti in questa zona. La tua richiesta sara comunque visibile.</span>
    </div>
  )
}
