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
          ? `mx-auto max-w-[560px] text-center ${className}`
          : `max-w-[640px] ${className}`
      }
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-[15px] leading-[1.65] text-muted-foreground">
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