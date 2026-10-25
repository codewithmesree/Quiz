import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border border-hwi bg-hwi text-black shadow-[0_14px_45px_-18px_rgba(255,0,85,0.85)] hover:bg-hwi-bright hover:shadow-[0_18px_55px_-16px_rgba(255,0,85,0.95)] active:translate-y-px',
  outline:
    'border border-white/15 bg-white/[0.03] text-white hover:border-hwi/60 hover:bg-hwi/[0.08] active:translate-y-px',
  ghost:
    'border border-transparent bg-transparent text-muted hover:bg-white/[0.05] hover:text-white',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-2.5 text-xs',
  lg: 'min-h-13 px-7 py-3.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-[0.16em] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hwi disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-hwi',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
