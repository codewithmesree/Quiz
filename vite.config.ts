import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// NOTE on cross-origin isolation:
// We intentionally do NOT set `Cross-Origin-Opener-Policy: same-origin` /
// `Cross-Origin-Embedder-Policy: require-corp` here. Those headers enable
// cross-origin isolation, which unlocks SharedArrayBuffer (used by the
// Pyodide worker for interactive `input()`). However, cross-origin isolation
// BREAKS Firebase Authentication: signInWithRedirect/signInWithPopup rely on a
// cross-origin iframe from `<project>.firebaseapp.com`, which COEP blocks, so
// the Google sign-in redirect returns with no signed-in user.
//
// Without these headers the main page is not cross-origin isolated, so the
// Pyodide worker cannot use SharedArrayBuffer. PythonRunner detects that and
// degrades gracefully: control buffers stay null, the worker's stdin handler
// returns immediately, and output-only Python still runs. Interactive stdin in
// the coding challenge is reduced; if you need interactive stdin back, host
// the coding challenge on a separate cross-origin-isolated origin/page.

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {},
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 20000,
  },
})
