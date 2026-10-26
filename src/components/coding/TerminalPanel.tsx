import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  CornerDownLeft,
  Loader2,
  Terminal as TerminalIcon,
  Trash2,
} from 'lucide-react'
import type { ExecutionStatus, TerminalLine } from '../../types/codingChallenge'
import { cn } from '../../utils/cn'

interface TerminalPanelProps {
  lines: readonly TerminalLine[]
  status: ExecutionStatus
  onSendInput: (input: string) => void
  onClear: () => void
  className?: string
}

export function TerminalPanel({
  lines,
  status,
  onSendInput,
  onClear,
  className,
}: TerminalPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAwaitingInput = status === 'waiting_for_input'
  const isRunning = status === 'running'
  const isInitializing = status === 'initializing'

  // Auto-scroll to bottom on new messages or input requests
  useEffect(() => {
    if (typeof terminalEndRef.current?.scrollIntoView === 'function') {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lines, isAwaitingInput])

  // Focus input field when waiting for input
  useEffect(() => {
    if (isAwaitingInput) {
      inputRef.current?.focus()
    }
  }, [isAwaitingInput])

  function handleInputSubmit(e?: FormEvent) {
    e?.preventDefault()
    if (!isAwaitingInput) return
    const text = inputValue
    setInputValue('')
    onSendInput(text)
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden bg-[#0a0a0a]',
        className,
      )}
      aria-label="Integrated Python terminal"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0d0d0d] px-3.5 py-2">
        <div className="flex items-center gap-2.5">
          <TerminalIcon className="size-3.5 text-hwi" aria-hidden="true" />
          <span className="font-display text-xs font-bold uppercase tracking-wider text-white">
            Console Terminal
          </span>

          {/* Execution Status Pill */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
              status === 'idle' && 'border border-white/10 bg-white/[0.04] text-muted/50',
              status === 'initializing' && 'border border-blue-500/30 bg-blue-500/10 text-blue-400',
              status === 'running' && 'border border-amber-500/30 bg-amber-500/10 text-amber-300',
              status === 'waiting_for_input' &&
                'border border-amber-500/40 bg-amber-500/20 text-amber-300 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]',
              status === 'completed' && 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
              status === 'failed' && 'border border-red-500/30 bg-red-500/10 text-red-400',
              status === 'interrupted' && 'border border-neutral-500/30 bg-neutral-500/10 text-neutral-400',
            )}
          >
            {isInitializing && <Loader2 className="size-2.5 animate-spin" aria-hidden="true" />}
            {isRunning && <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />}
            {isAwaitingInput && <span className="size-1.5 rounded-full bg-amber-400" />}
            {status === 'completed' && <span className="size-1.5 rounded-full bg-emerald-400" />}
            {status === 'failed' && <span className="size-1.5 rounded-full bg-red-400" />}

            <span>
              {status === 'waiting_for_input'
                ? 'Awaiting Input'
                : status === 'initializing'
                  ? 'Initializing...'
                  : status === 'running'
                    ? 'Running'
                    : status}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            title="Clear terminal output"
            aria-label="Clear terminal output"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        tabIndex={0}
        aria-label="Terminal output text"
      >
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted/40">
            <TerminalIcon className="size-8 stroke-[1.2] text-white/20" aria-hidden="true" />
            <p className="text-xs">No active program output.</p>
            <p className="text-[10px] text-muted/30">
              Click <strong className="text-emerald-400">Run</strong> to execute your Python script.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {lines.map((line) => {
              switch (line.type) {
                case 'stdin':
                  return (
                    <div
                      key={line.id}
                      className="font-bold text-emerald-400"
                    >
                      {line.text}
                    </div>
                  )
                case 'stdout':
                  return (
                    <div
                      key={line.id}
                      className="whitespace-pre-wrap text-white/90"
                    >
                      {line.text}
                    </div>
                  )
                case 'stderr':
                case 'error':
                  return (
                    <div
                      key={line.id}
                      className="whitespace-pre-wrap rounded bg-red-500/[0.08] px-2 py-1 text-red-400"
                    >
                      {line.text}
                    </div>
                  )
                case 'success':
                  return (
                    <div
                      key={line.id}
                      className="whitespace-pre-wrap rounded bg-emerald-500/[0.08] px-2 py-1 font-semibold text-emerald-300"
                    >
                      {line.text}
                    </div>
                  )
                case 'system':
                  return (
                    <div
                      key={line.id}
                      className="text-[11px] text-muted/50 italic"
                    >
                      {line.text}
                    </div>
                  )
                case 'info':
                  return (
                    <div
                      key={line.id}
                      className="text-[11px] text-blue-400/80"
                    >
                      {line.text}
                    </div>
                  )
                default:
                  return (
                    <div key={line.id} className="whitespace-pre-wrap text-white/80">
                      {line.text}
                    </div>
                  )
              }
            })}

            {/* Interactive Input Form when waiting for input */}
            {isAwaitingInput && (
              <form
                onSubmit={handleInputSubmit}
                className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] p-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              >
                <span className="font-bold text-amber-400">❯</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleInputSubmit()
                    }
                  }}
                  placeholder="Type your response and press Enter..."
                  className="flex-1 bg-transparent font-mono text-xs text-white placeholder:text-amber-200/40 focus:outline-none"
                  autoFocus
                  aria-label="Interactive terminal input"
                />
                <button
                  type="submit"
                  title="Send input to Python"
                  aria-label="Send input"
                  className="flex items-center gap-1.5 rounded bg-amber-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/35"
                >
                  <span>Send</span>
                  <CornerDownLeft className="size-3" aria-hidden="true" />
                </button>
              </form>
            )}

            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
