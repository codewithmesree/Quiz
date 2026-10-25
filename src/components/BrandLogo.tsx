const LOGO_SRC = `${import.meta.env.BASE_URL}hwi-logo.png`

const LOGO_SIZES = {
  xs: 36,
  sm: 44,
  md: 64,
  lg: 112,
  xl: 176,
} as const

interface BrandLogoProps {
  size?: keyof typeof LOGO_SIZES
  className?: string
  /** Decorative use (e.g. next to a text brand that is already labelled). */
  decorative?: boolean
}

/**
 * Official HACK WITH INDIA — SAIU logo. The source artwork is used untouched;
 * only display size is controlled here.
 */
export function BrandLogo({
  size = 'md',
  className = '',
  decorative = false,
}: BrandLogoProps) {
  const pixels = LOGO_SIZES[size]

  return (
    <img
      src={LOGO_SRC}
      width={pixels}
      height={pixels}
      alt={decorative ? '' : 'Hack With India — SAIU official event logo'}
      aria-hidden={decorative || undefined}
      className={`shrink-0 rounded-full object-contain ${className}`}
      style={{ width: pixels, height: pixels }}
      draggable={false}
    />
  )
}
