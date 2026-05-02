export type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'star' | 'muted' | 'info'

export type IconColorMode = 'stroke' | 'fill' | 'text'

export function iconToneClass(tone: Tone, mode: IconColorMode = 'stroke'): string {
  if (mode === 'fill') {
    switch (tone) {
      case 'brand':   return 'fill-primary'
      case 'success': return 'fill-success'
      case 'warning': return 'fill-warning'
      case 'danger':  return 'fill-danger'
      case 'star':    return 'fill-star'
      case 'muted':   return 'fill-muted-foreground'
      case 'info':    return 'fill-info'
      case 'default':
      default:        return 'fill-secondary'
    }
  }
  if (mode === 'text') {
    switch (tone) {
      case 'brand':   return 'text-primary'
      case 'success': return 'text-success'
      case 'warning': return 'text-warning'
      case 'danger':  return 'text-danger'
      case 'star':    return 'text-star'
      case 'muted':   return 'text-muted-foreground'
      case 'info':    return 'text-info'
      case 'default':
      default:        return 'text-secondary'
    }
  }
  // stroke (default)
  switch (tone) {
    case 'brand':   return 'stroke-primary'
    case 'success': return 'stroke-success'
    case 'warning': return 'stroke-warning'
    case 'danger':  return 'stroke-danger'
    case 'star':    return 'stroke-star'
    case 'muted':   return 'stroke-muted-foreground'
    case 'info':    return 'stroke-info'
    case 'default':
    default:        return 'stroke-secondary'
  }
}

export function iconBgClass(tone: Tone): string {
  switch (tone) {
    case 'brand':   return 'bg-primary/10'
    case 'success': return 'bg-success/10'
    case 'warning': return 'bg-warning/10'
    case 'danger':  return 'bg-danger/10'
    case 'star':    return 'bg-star/10'
    case 'muted':   return 'bg-muted'
    case 'info':    return 'bg-info/10'
    case 'default':
    default:        return 'bg-secondary/10'
  }
}
