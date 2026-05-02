export function WaveDivider({
  fillClassName = 'fill-[#F6F7FB]',
  flip = false,
  className = '',
}: {
  fillClassName?: string
  flip?: boolean
  className?: string
}) {
  return (
    <div
      className={`pointer-events-none overflow-hidden leading-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        className={`block h-12 w-full sm:h-16 ${flip ? 'rotate-180' : ''}`}
      >
        <path
          d="M0,64 C180,96 360,96 540,64 C720,32 900,0 1080,24 C1260,48 1350,80 1440,56 L1440,96 L0,96 Z"
          className={fillClassName}
        />
      </svg>
    </div>
  )
}