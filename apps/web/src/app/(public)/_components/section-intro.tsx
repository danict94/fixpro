export function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={
        align === 'center'
          ? `mx-auto max-w-[520px] text-center ${className}`
          : `max-w-[560px] ${className}`
      }
    >
      <p className="text-primary text-[12px] font-semibold tracking-[0.1em] uppercase">
        {eyebrow}
      </p>

      <h2 className="text-secondary mt-2.5 text-[26px] leading-[1.1] font-semibold sm:text-[31px]">
        {title}
      </h2>

      {description && (
        <p className="text-muted-foreground mt-3 text-[13px] leading-6">
          {description}
        </p>
      )}

      <div
        className={
          align === 'center'
            ? 'mx-auto mt-4 h-[2px] w-12 rounded-full bg-primary'
            : 'mt-4 h-[2px] w-12 rounded-full bg-primary'
        }
      />
    </div>
  )
}
