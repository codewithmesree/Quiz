import { ArrowRight, Clock, AlertCircle, Zap } from 'lucide-react'
import { Button } from '../Button'

interface CodingInstructionsProps {
  onStart: () => void
}

/**
 * Coding instructions page shown before the coding interface opens.
 * Explains the rules and 40-minute shared timer.
 * Timer does NOT start until the user clicks "Start Coding".
 */
export function CodingInstructions({ onStart }: CodingInstructionsProps) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <section className="surface animate-fade-up w-full overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-hwi via-hwi/50 to-transparent" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-hwi/25 bg-hwi/[0.08] text-hwi">
              <Zap className="size-6" />
            </div>

            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
              Coding Round
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">
              Ready to code?
            </h1>
            <p className="mt-3 text-sm text-white/70">
              You have 40 minutes to complete all three coding challenges.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <Clock className="size-4 text-hwi" />
                  What to Expect
                </h2>
                <ul className="space-y-2 text-sm text-white/75">
                  <li className="flex gap-3">
                    <span className="font-bold text-hwi">1.</span>
                    <span>
                      <strong>Coding Question 1</strong> — Input validation & number
                      generation
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-hwi">2.</span>
                    <span>
                      <strong>Coding Question 2</strong> — Game logic & flow control
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-hwi">3.</span>
                    <span>
                      <strong>Debugging Round</strong> — Identify and fix bugs in provided
                      code
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-hwi/25 bg-hwi/[0.05] p-4">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <AlertCircle className="size-4 text-hwi" />
                  Important Timer Rules
                </h2>
                <ul className="space-y-2 text-sm text-white/75">
                  <li>
                    ⏱️ The <strong>40-minute timer starts when you begin writing
                    code</strong>, not when you open this interface.
                  </li>
                  <li>
                    ⚡ The timer <strong>keeps running</strong> as you move between questions,
                    submit answers, or retry challenges.
                  </li>
                  <li>
                    🔒 When time expires, the editor locks and you <strong>cannot submit
                    further code</strong>.
                  </li>
                  <li>
                    💾 Your latest code is <strong>always saved</strong>, even if time runs out.
                  </li>
                  <li>
                    🔄 You can retry any challenge while time remains — <strong>retries do not
                    reset the timer</strong>.
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4">
                <h2 className="mb-2 font-semibold text-white">Before You Start</h2>
                <ul className="space-y-1 text-sm text-white/75">
                  <li>✓ Read each question carefully.</li>
                  <li>✓ Use the provided starter code as a template.</li>
                  <li>✓ Test your code with the Run button before submitting.</li>
                  <li>✓ Submit only when you are confident in your solution.</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={onStart}
              size="lg"
              className="mt-8 w-full"
            >
              Start Coding <ArrowRight className="size-4" />
            </Button>

            <p className="mt-4 text-center text-xs text-white/40">
              Your timer will start with your first code edit.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
