import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Hash,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { QUIZ_SECTIONS, TOTAL_QUESTIONS } from '../data/questions'
import type { PlayerProfile } from '../types/quiz'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import { SectionIcon } from '../components/SectionIcon'

interface WelcomePageProps {
  onStart: (profile: PlayerProfile) => void
}

type FieldName = 'teamName'

type FormValues = Record<FieldName, string>
type FormErrors = Partial<Record<FieldName, string>>

const FIELD_ORDER: FieldName[] = ['teamName']

const EMPTY_FORM: FormValues = {
  teamName: '',
}

interface FieldProps {
  id: FieldName
  label: string
  value: string
  placeholder: string
  error?: string
  icon: ReactNode
  autoComplete?: string
  autoFocus?: boolean
  onChange: (value: string) => void
}

function Field({
  id,
  label,
  value,
  placeholder,
  error,
  icon,
  autoComplete,
  autoFocus,
  onChange,
}: FieldProps) {
  const errorId = `${id}-error`
  const isInvalid = Boolean(error)

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/70"
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/40"
          aria-hidden="true"
        >
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          maxLength={48}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : undefined}
          className="field-input field-input-with-icon"
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-red-400"
        >
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

export function WelcomePage({ onStart }: WelcomePageProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  function updateField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {}
    if (!values.teamName.trim()) {
      nextErrors.teamName = 'Enter your team name to continue.'
    }
    return nextErrors
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
      if (firstInvalid) {
        formRef.current
          ?.querySelector<HTMLInputElement>(`#${firstInvalid}`)
          ?.focus()
      }
      return
    }

    onStart({
      teamName: values.teamName.trim(),
    })
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="animate-fade-up flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Hack With India <span className="text-hwi">/</span> SAIU
            </p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.3em] text-muted/50">
              Official event quiz
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:flex">
          <span className="live-dot" aria-hidden="true" />
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted/70">
            Quiz arena online
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-14 pt-2 sm:px-8 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-x-14 lg:gap-y-8 xl:gap-x-20">
          <section className="animate-fade-up lg:col-start-1 lg:row-start-1">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-hwi" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-hwi">
                Hack With India · SAIU
              </p>
            </div>

            <div className="mt-7 flex items-center gap-6 sm:mt-9 sm:gap-8">
              <div className="relative shrink-0">
                <span
                  className="absolute -inset-3 rounded-full border border-hwi/20"
                  aria-hidden="true"
                />
                <span
                  className="absolute -inset-6 hidden rounded-full border border-dashed border-white/10 sm:block"
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-0 rounded-full bg-hwi/20 blur-2xl"
                  aria-hidden="true"
                />
                <BrandLogo
                  size="lg"
                  className="relative ring-1 ring-hwi/40 sm:hidden"
                />
                <BrandLogo
                  size="xl"
                  className="relative hidden ring-1 ring-hwi/40 sm:block"
                />
              </div>
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.34em] text-white/50">
                  Three sections.
                  <br />
                  One sealed score.
                </p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold leading-none text-white">
                    14
                  </span>
                  <span className="text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-muted/60">
                    questions
                    <br />
                    per session
                  </span>
                </p>
              </div>
            </div>

            <h1
              aria-label="ACCESS DENIED — QUIZ"
              className="mt-8 font-display font-bold leading-[0.82] tracking-[-0.055em] sm:mt-10"
            >
              <span className="block text-[clamp(3.6rem,10vw,7.8rem)] text-white">
                ACCESS
              </span>
              <span className="block text-[clamp(3.6rem,10vw,7.8rem)] text-hwi drop-shadow-[0_0_38px_rgba(255,0,85,0.28)]">
                DENIED
              </span>
              <span className="mt-4 flex items-center gap-3 sm:mt-5 sm:gap-4">
                <span
                  className="h-1 w-10 bg-hwi sm:w-16"
                  aria-hidden="true"
                />
                <span className="font-display text-lg font-semibold tracking-[0.42em] text-white/85 sm:text-2xl">
                  — QUIZ
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted/75 sm:text-[15px]">
              Hack With India — SAIU presents a three-stage computer knowledge
              challenge. Randomized questions. Locked answers. No second
              chances. Assemble your team, clear every round, and prove you
              belong inside.
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3">
                <p className="font-display text-2xl font-bold text-white">03</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/50">
                  Sections
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3">
                <p className="font-display text-2xl font-bold text-white">04</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/50">
                  Riddles
                </p>
              </div>
              <div className="rounded-xl border border-hwi/20 bg-hwi/[0.04] px-3 py-3">
                <p className="font-display text-2xl font-bold text-hwi">14</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/50">
                  Max points
                </p>
              </div>
            </div>
          </section>

          <section
            className="surface animate-fade-up relative overflow-hidden lg:col-start-2 lg:row-span-2 lg:row-start-1"
            style={{ animationDelay: '100ms' }}
            aria-labelledby="setup-heading"
          >
            <div className="h-1 w-full bg-gradient-to-r from-hwi via-hwi/40 to-transparent" />
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
                    Team check-in
                  </p>
                  <h2
                    id="setup-heading"
                    className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white"
                  >
                    Name your team
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted/60">
                    Enter a team name to unlock the arena.
                  </p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hwi/25 bg-hwi/[0.07]">
                  <Users className="size-4 text-hwi" aria-hidden="true" />
                </span>
              </div>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="mt-6 space-y-4"
              >
                {hasErrors && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3 py-2.5 text-[10px] font-medium leading-relaxed text-red-300"
                  >
                    <AlertCircle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Complete the field before starting the quiz.
                  </div>
                )}

                <Field
                  id="teamName"
                  label="Team name"
                  value={values.teamName}
                  placeholder="e.g. Byte Force"
                  error={errors.teamName}
                  icon={<Hash className="size-3.5" />}
                  autoComplete="organization"
                  autoFocus
                  onChange={(value) => updateField('teamName', value)}
                />

                <Button type="submit" size="lg" className="mt-2 w-full">
                  Start Quiz
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>

                <div className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2.5">
                  <ShieldCheck
                    className="mt-0.5 size-3.5 shrink-0 text-hwi"
                    aria-hidden="true"
                  />
                  <p className="text-[10px] leading-relaxed text-muted/55">
                    Your team name is used only for this quiz session. Each
                    answer locks permanently once submitted.
                  </p>
                </div>
              </form>

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.12em] text-muted/50">
                  <LockKeyhole className="size-3 text-hwi" aria-hidden="true" />
                  Locked answers
                </div>
                <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.12em] text-muted/50">
                  <Sparkles className="size-3 text-hwi" aria-hidden="true" />
                  Instant scoring
                </div>
              </div>
            </div>
          </section>

          <section
            className="surface animate-fade-up p-5 lg:col-start-1 lg:row-start-2"
            style={{ animationDelay: '160ms' }}
            aria-labelledby="structure-heading"
          >
            <div className="flex items-center justify-between">
              <p
                id="structure-heading"
                className="text-[9px] font-bold uppercase tracking-[0.26em] text-muted/50"
              >
                Quiz structure
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-hwi">
                {TOTAL_QUESTIONS} total
              </p>
            </div>

            <ol className="mt-3 space-y-2">
              {QUIZ_SECTIONS.map((section) => (
                <li
                  key={section.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] px-3.5 py-3 transition-colors hover:border-hwi/25 hover:bg-hwi/[0.03]"
                >
                  <span className="font-display text-xs font-bold tabular-nums text-hwi">
                    {String(section.id).padStart(2, '0')}
                  </span>
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-hwi"
                    aria-hidden="true"
                  >
                    <SectionIcon section={section.id} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white/90">
                      {section.name}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted/45">
                      {section.type === 'riddle'
                        ? 'Type & lock your answer'
                        : '5 randomized questions'}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-white/70">
                    {section.count}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-hwi/15 bg-hwi/[0.04] px-3.5 py-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">
                Questions per quiz session
              </span>
              <span className="font-display text-sm font-bold tabular-nums text-hwi">
                {TOTAL_QUESTIONS}
              </span>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted/35">
            Hack With India — SAIU · Access Denied Quiz
          </p>
          <p className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-muted/35">
            <span className="size-1.5 rounded-full bg-hwi" aria-hidden="true" />
            Answer · Lock · Learn
          </p>
        </div>
      </footer>
    </div>
  )
}
