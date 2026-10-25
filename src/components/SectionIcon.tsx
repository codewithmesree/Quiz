import { Cpu, Lightbulb, Network } from 'lucide-react'
import type { SectionId } from '../types/quiz'
import { cn } from '../utils/cn'

interface SectionIconProps {
  section: SectionId
  className?: string
}

export function SectionIcon({ section, className }: SectionIconProps) {
  const Icon = section === 1 ? Cpu : section === 2 ? Network : Lightbulb
  return <Icon className={cn('size-3.5', className)} aria-hidden="true" />
}
