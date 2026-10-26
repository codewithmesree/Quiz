import type { ExecutionStatus, TerminalLine } from '../types/codingChallenge'

export interface PythonRunnerCallbacks {
  onOutput: (line: TerminalLine) => void
  onStatusChange: (status: ExecutionStatus) => void
  onWaitingForInput?: () => void
}

const STATUS_IDLE = 0
const STATUS_INPUT_READY = 2
const STATUS_INTERRUPTED = 3

let lineCounter = 0
function makeLine(
  text: string,
  type: TerminalLine['type'],
): TerminalLine {
  lineCounter += 1
  return {
    id: `line-${Date.now()}-${lineCounter}`,
    text,
    type,
    timestamp: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/* Skulpt real Python execution (fallback when Pyodide unavailable)   */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    Sk?: {
      configure: (cfg: object) => void
      misceval: {
        asyncToPromise: (fn: () => unknown) => Promise<unknown>
      }
      importMainWithBody: (
        name: string,
        dumpJS: boolean,
        body: string,
        canSuspend: boolean
      ) => unknown
      builtinFiles?: { files: Record<string, string> }
      python3?: unknown
    }
  }
}

let skulptLoaded = false
let skulptLoading = false
let skulptLoadCallbacks: Array<() => void> = []

async function loadSkulpt(): Promise<void> {
  if (skulptLoaded) return
  if (skulptLoading) {
    return new Promise((resolve) => skulptLoadCallbacks.push(resolve))
  }

  skulptLoading = true

  return new Promise((resolve, reject) => {
    const loadScript = (src: string) =>
      new Promise<void>((res, rej) => {
        const s = document.createElement('script')
        s.src = src
        s.onload = () => res()
        s.onerror = () => rej(new Error(`Failed to load ${src}`))
        document.head.appendChild(s)
      })

    loadScript('https://skulpt.org/js/skulpt.min.js')
      .then(() => loadScript('https://skulpt.org/js/skulpt-stdlib.js'))
      .then(() => {
        skulptLoaded = true
        skulptLoading = false
        skulptLoadCallbacks.forEach((cb) => cb())
        skulptLoadCallbacks = []
        resolve()
      })
      .catch((err) => {
        skulptLoading = false
        reject(err)
      })
  })
}

function runWithSkulpt(
  code: string,
  onOutput: (line: TerminalLine) => void,
  onStatus: (s: ExecutionStatus) => void,
): void {
  if (!window.Sk) {
    onOutput(makeLine('[Error] Python engine not available.', 'error'))
    onStatus('failed')
    return
  }

  let inputResolve: ((value: string) => void) | null = null
  let inputReject: ((err: Error) => void) | null = null

  window.Sk.configure({
    output: (text: string) => {
      const trimmed = text.replace(/\n$/, '')
      if (trimmed !== '') {
        onOutput(makeLine(trimmed, 'stdout'))
      }
    },
    read: (x: string) => {
      const files = window.Sk?.builtinFiles?.files
      if (!files?.[x] && !files?.[`src/lib/${x}`])
        throw new Error(`File not found: '${x}'`)
      return files[x] ?? files[`src/lib/${x}`]
    },
    inputfun: (prompt: string) => {
      if (prompt && prompt.trim() !== '') {
        onOutput(makeLine(prompt, 'stdout'))
      }
      return new Promise<string>((resolve, reject) => {
        inputResolve = resolve
        inputReject = reject
        onStatus('waiting_for_input')
      })
    },
    inputfunTakesPrompt: true,
    __future__: window.Sk?.python3,
  })

  const win = window as Window & {
    __pythonInputResolve?: (v: string) => void
    __pythonInputReject?: (err: Error) => void
  }

  win.__pythonInputResolve = (v: string) => {
    if (inputResolve) {
      const fn = inputResolve
      inputResolve = null
      inputReject = null
      onStatus('running')
      fn(v)
    }
  }

  win.__pythonInputReject = (err: Error) => {
    if (inputReject) {
      const fn = inputReject
      inputResolve = null
      inputReject = null
      fn(err)
    }
  }

  onStatus('running')

  window.Sk.misceval.asyncToPromise(() =>
    window.Sk!.importMainWithBody('<stdin>', false, code, true),
  )
    .then(() => {
      win.__pythonInputResolve = undefined
      win.__pythonInputReject = undefined
      onOutput(makeLine('--- Process finished with exit code 0 ---', 'system'))
      onStatus('completed')
    })
    .catch((err: unknown) => {
      win.__pythonInputResolve = undefined
      win.__pythonInputReject = undefined
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('KeyboardInterrupt')) {
        onOutput(makeLine('KeyboardInterrupt: Execution stopped by user.', 'error'))
        onStatus('idle')
      } else {
        onOutput(makeLine(msg, 'error'))
        onOutput(makeLine('--- Process finished with error ---', 'system'))
        onStatus('failed')
      }
    })
}

/* ------------------------------------------------------------------ */
/* Main PythonRunner class                                             */
/* ------------------------------------------------------------------ */

export class PythonRunner {
  private worker: Worker | null = null
  private controlBuffer: SharedArrayBuffer | null = null
  private controlArray: Int32Array | null = null
  private dataBuffer: SharedArrayBuffer | null = null
  private dataArray: Uint8Array | null = null
  private interruptBuffer: SharedArrayBuffer | null = null
  private interruptArray: Uint8Array | null = null
  private callbacks: PythonRunnerCallbacks
  private runId = 0
  private status: ExecutionStatus = 'idle'
  private isWorkerReady = false
  private isUsingFallback = false
  private hasInitStarted = false
  private interruptTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(callbacks: PythonRunnerCallbacks) {
    this.callbacks = callbacks
  }

  public getStatus(): ExecutionStatus {
    return this.status
  }

  private setStatus(status: ExecutionStatus) {
    this.status = status
    this.callbacks.onStatusChange(status)
  }

  /**
   * Initializes the Python runtime in background.
   */
  public async initialize(): Promise<void> {
    if (this.isWorkerReady || this.isUsingFallback) return
    if (this.hasInitStarted) return

    this.hasInitStarted = true
    this.setStatus('initializing')

    // Allocate SharedArrayBuffers for stdin Atomics & interrupt signaling
    const supportsSharedArrayBuffer =
      typeof window !== 'undefined' &&
      typeof SharedArrayBuffer !== 'undefined' &&
      typeof Atomics !== 'undefined'

    if (supportsSharedArrayBuffer) {
      try {
        this.controlBuffer = new SharedArrayBuffer(16)
        this.controlArray = new Int32Array(this.controlBuffer)
        this.dataBuffer = new SharedArrayBuffer(65536)
        this.dataArray = new Uint8Array(this.dataBuffer)
        this.interruptBuffer = new SharedArrayBuffer(1)
        this.interruptArray = new Uint8Array(this.interruptBuffer)
      } catch {
        this.controlBuffer = null
        this.controlArray = null
        this.dataBuffer = null
        this.dataArray = null
        this.interruptBuffer = null
        this.interruptArray = null
      }
    }

    const isJsdom =
      typeof window !== 'undefined' &&
      window.navigator.userAgent.includes('jsdom')

    if (isJsdom) {
      await this.enableFallback('Testing environment detected (jsdom).')
      return
    }

    // Try starting Web Worker (Pyodide)
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker('/pyodide-worker.js')
        this.setupWorkerListeners()

        this.worker.postMessage({
          type: 'INIT',
          controlBuffer: this.controlBuffer,
          dataBuffer: this.dataBuffer,
          interruptBuffer: this.interruptBuffer,
        })
        return
      } catch {
        await this.enableFallback('Web Worker not supported in this environment.')
      }
    } else {
      await this.enableFallback('Environment does not support Web Workers.')
    }
  }

  private async enableFallback(reason?: string) {
    this.isUsingFallback = true

    if (reason) {
      this.callbacks.onOutput(
        makeLine(`[System] ${reason} Loading Python engine...`, 'info'),
      )
    }

    try {
      await loadSkulpt()
      this.isWorkerReady = true
      this.setStatus('idle')
    } catch {
      this.isWorkerReady = true
      this.setStatus('idle')
      this.callbacks.onOutput(
        makeLine('[System] Python engine unavailable. Check your internet connection.', 'error'),
      )
    }
  }

  private setupWorkerListeners() {
    if (!this.worker) return

    this.worker.onmessage = (event) => {
      const data = event.data
      if (!data) return

      switch (data.type) {
        case 'STATUS':
          this.setStatus(data.status)
          break

        case 'READY':
          this.isWorkerReady = true
          this.setStatus('idle')
          break

        case 'INIT_ERROR':
          this.worker?.terminate()
          this.worker = null
          this.isWorkerReady = false
          this.enableFallback()
          break

        case 'STDOUT':
          if (data.runId === this.runId) {
            this.callbacks.onOutput(makeLine(data.text, 'stdout'))
          }
          break

        case 'STDERR':
          if (data.runId === this.runId) {
            this.callbacks.onOutput(makeLine(data.text, 'stderr'))
          }
          break

        case 'WAITING_FOR_INPUT':
          if (data.runId === this.runId) {
            this.setStatus('waiting_for_input')
            this.callbacks.onWaitingForInput?.()
          }
          break

        case 'RUN_START':
          if (data.runId === this.runId) {
            this.setStatus('running')
          }
          break

        case 'RUN_COMPLETE':
          if (data.runId === this.runId) {
            this.setStatus('completed')
            this.callbacks.onOutput(
              makeLine('--- Process finished with exit code 0 ---', 'system'),
            )
          }
          break

        case 'RUN_INTERRUPTED':
          if (data.runId === this.runId) {
            if (this.interruptTimeoutId) {
              clearTimeout(this.interruptTimeoutId)
              this.interruptTimeoutId = null
            }
            this.callbacks.onOutput(
              makeLine('KeyboardInterrupt: Execution stopped by user.', 'error'),
            )
            this.setStatus('idle')
          }
          break

        case 'RUN_ERROR':
          if (data.runId === this.runId) {
            this.setStatus('failed')
            this.callbacks.onOutput(makeLine(data.error, 'error'))
            this.callbacks.onOutput(
              makeLine('--- Process finished with error ---', 'system'),
            )
          }
          break
      }
    }

    this.worker.onerror = (err) => {
      this.callbacks.onOutput(
        makeLine(
          `Worker notice: ${err.message || 'Worker error'}. Loading fallback Python engine...`,
          'info',
        ),
      )
      this.worker?.terminate()
      this.worker = null
      this.isWorkerReady = false
      this.enableFallback()
    }
  }

  /**
   * Runs the provided Python code string.
   */
  public async run(code: string): Promise<void> {
    this.runId += 1
    const currentId = this.runId

    if (!this.isWorkerReady && !this.isUsingFallback) {
      await this.initialize()
    }

    if (this.worker && !this.isUsingFallback && this.controlArray) {
      // Pyodide worker path (with SharedArrayBuffer)
      this.setStatus('running')
      Atomics.store(this.controlArray, 0, STATUS_IDLE)
      if (this.interruptArray) {
        this.interruptArray[0] = 0
      }
      this.worker.postMessage({
        type: 'RUN',
        runId: currentId,
        code,
      })
    } else if (this.isUsingFallback) {
      // Real Skulpt execution
      runWithSkulpt(
        code,
        this.callbacks.onOutput,
        (s) => {
          if (currentId === this.runId) {
            this.setStatus(s)
            if (s === 'waiting_for_input') {
              this.callbacks.onWaitingForInput?.()
            }
          }
        },
      )
    } else {
      this.setStatus('running')
      this.worker?.postMessage({
        type: 'RUN',
        runId: currentId,
        code,
      })
    }
  }

  /**
   * Supplies user input to the running program.
   */
  public sendInput(text: string): void {
    if (this.status !== 'waiting_for_input') return

    // Display the submitted input line in the terminal
    this.callbacks.onOutput(makeLine(`❯ ${text}`, 'stdin'))

    if (this.worker && !this.isUsingFallback && this.controlArray && this.dataArray) {
      // Encode input into SharedArrayBuffer
      const encoded = new TextEncoder().encode(text)
      const length = Math.min(encoded.length, this.dataArray.length)
      this.dataArray.set(encoded.subarray(0, length))
      Atomics.store(this.controlArray, 1, length)
      Atomics.store(this.controlArray, 0, STATUS_INPUT_READY)
      Atomics.notify(this.controlArray, 0, 1)
      this.setStatus('running')
    } else if (this.isUsingFallback) {
      // Skulpt path
      const win = window as Window & { __pythonInputResolve?: (v: string) => void }
      if (win.__pythonInputResolve) {
        win.__pythonInputResolve(text)
      }
    }
  }

  /**
   * Interrupts/cancels the currently running program.
   */
  public interrupt(): void {
    if (this.status !== 'running' && this.status !== 'waiting_for_input') return

    this.setStatus('interrupted')

    if (this.worker && !this.isUsingFallback) {
      // Signal interrupt buffer for Pyodide's internal SIGINT check
      if (this.interruptArray) {
        this.interruptArray[0] = 2 // SIGINT
      }

      // Wake up worker if it is currently sleeping inside Atomics.wait on input()
      if (this.controlArray) {
        Atomics.store(this.controlArray, 0, STATUS_INTERRUPTED)
        Atomics.notify(this.controlArray, 0, 1)
      }

      this.worker.postMessage({ type: 'INTERRUPT' })

      // Forceful watchdog: if worker doesn't cleanly exit within 300ms, terminate and reinit
      if (this.interruptTimeoutId) {
        clearTimeout(this.interruptTimeoutId)
      }
      this.interruptTimeoutId = setTimeout(() => {
        if (this.status === 'interrupted') {
          this.callbacks.onOutput(
            makeLine('KeyboardInterrupt: Execution stopped by user.', 'error'),
          )
          this.worker?.terminate()
          this.worker = null
          this.isWorkerReady = false
          this.hasInitStarted = false
          this.setStatus('idle')
          void this.initialize()
        }
      }, 300)
    } else if (this.isUsingFallback) {
      // Skulpt fallback interrupt
      const win = window as Window & { __pythonInputReject?: (err: Error) => void }
      if (win.__pythonInputReject) {
        win.__pythonInputReject(new Error('KeyboardInterrupt: Execution stopped by user.'))
      } else {
        this.callbacks.onOutput(
          makeLine('KeyboardInterrupt: Execution stopped by user.', 'error'),
        )
      }
      this.setStatus('idle')
    } else {
      this.setStatus('idle')
    }
  }

  /**
   * Cleanly resets the runner.
   */
  public reset(): void {
    this.interrupt()
    this.setStatus('idle')
  }
}
