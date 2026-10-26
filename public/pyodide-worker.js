/**
 * Web Worker for running Pyodide (Python in WebAssembly)
 * Handles stdout, stderr, interactive stdin via SharedArrayBuffer & Atomics,
 * and reliable interrupts via pyodide.setInterruptBuffer().
 */

let pyodide = null
let currentRunId = 0
let controlArray = null
let dataArray = null
let interruptArray = null

// Status constants
const STATUS_IDLE = 0
const STATUS_WAITING_FOR_INPUT = 1
const STATUS_INPUT_READY = 2
const STATUS_INTERRUPTED = 3

async function initPyodideRuntime() {
  try {
    self.postMessage({ type: 'STATUS', status: 'initializing' })

    // Load Pyodide script from CDN
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js')

    pyodide = await self.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      stdout: (text) => {
        self.postMessage({ type: 'STDOUT', runId: currentRunId, text })
      },
      stderr: (text) => {
        self.postMessage({ type: 'STDERR', runId: currentRunId, text })
      },
    })

    // Register interrupt buffer if available (allows interrupting infinite loops)
    if (interruptArray) {
      pyodide.setInterruptBuffer(interruptArray)
    }

    // Setup custom stdin handler for input()
    pyodide.setStdin({
      stdin: () => {
        // Signal main thread to display the input prompt box in the terminal
        self.postMessage({ type: 'WAITING_FOR_INPUT', runId: currentRunId })

        if (controlArray && dataArray) {
          // Put worker into waiting state
          Atomics.store(controlArray, 0, STATUS_WAITING_FOR_INPUT)

          // Wait synchronously until main thread updates status away from STATUS_WAITING_FOR_INPUT (1)
          Atomics.wait(controlArray, 0, STATUS_WAITING_FOR_INPUT)

          const status = Atomics.load(controlArray, 0)
          if (status === STATUS_INTERRUPTED) {
            Atomics.store(controlArray, 0, STATUS_IDLE)
            throw new Error('KeyboardInterrupt: Execution stopped by user.')
          }

          const length = Atomics.load(controlArray, 1)

          // IMPORTANT: TextDecoder throws TypeError if passed a TypedArray backed by SharedArrayBuffer!
          // We must copy the slice into a regular unshared Uint8Array before decoding.
          const unshared = new Uint8Array(length)
          for (let i = 0; i < length; i++) {
            unshared[i] = dataArray[i]
          }
          const text = new TextDecoder().decode(unshared)

          // Reset status to idle
          Atomics.store(controlArray, 0, STATUS_IDLE)
          return text + '\n'
        }

        // Fallback if no SharedArrayBuffer
        return '\n'
      },
      autoEOF: false,
      isatty: true,
    })

    self.postMessage({ type: 'READY' })
  } catch (err) {
    self.postMessage({
      type: 'INIT_ERROR',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

self.onmessage = async (event) => {
  const data = event.data
  if (!data) return

  switch (data.type) {
    case 'INIT': {
      if (data.controlBuffer && data.dataBuffer) {
        controlArray = new Int32Array(data.controlBuffer)
        dataArray = new Uint8Array(data.dataBuffer)
      }
      if (data.interruptBuffer) {
        interruptArray = new Uint8Array(data.interruptBuffer)
      }
      await initPyodideRuntime()
      break
    }

    case 'RUN': {
      currentRunId = data.runId
      const code = data.code
      if (!pyodide) {
        self.postMessage({
          type: 'RUN_ERROR',
          runId: currentRunId,
          error: 'Python runtime is not ready yet.',
        })
        return
      }

      // Ensure interrupt buffer is clean and registered
      if (interruptArray) {
        interruptArray[0] = 0
        try {
          pyodide.setInterruptBuffer(interruptArray)
        } catch {
          // ignore if already registered
        }
      }

      self.postMessage({ type: 'RUN_START', runId: currentRunId })

      try {
        await pyodide.runPythonAsync(code)
        self.postMessage({ type: 'RUN_COMPLETE', runId: currentRunId })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('KeyboardInterrupt')) {
          self.postMessage({ type: 'RUN_INTERRUPTED', runId: currentRunId })
        } else {
          self.postMessage({
            type: 'RUN_ERROR',
            runId: currentRunId,
            error: msg,
          })
        }
      } finally {
        if (interruptArray) {
          interruptArray[0] = 0
        }
      }
      break
    }

    case 'INTERRUPT': {
      if (interruptArray) {
        interruptArray[0] = 2 // SIGINT to raise KeyboardInterrupt in Pyodide eval loop
      }
      if (controlArray) {
        Atomics.store(controlArray, 0, STATUS_INTERRUPTED)
        Atomics.notify(controlArray, 0, 1)
      }
      break
    }
  }
}
