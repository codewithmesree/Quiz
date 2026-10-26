import { useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { Code2, FileCode, RotateCcw } from 'lucide-react'
import type { CodingStageId } from '../../types/codingChallenge'
import { cn } from '../../utils/cn'

interface CodeEditorProps {
  code: string
  stageId: CodingStageId
  onChange: (value: string) => void
  onRun?: () => void
  onReset?: () => void
  readOnly?: boolean
  className?: string
}

export function CodeEditor({
  code,
  stageId,
  onChange,
  onRun,
  onReset,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const editorRef = useRef<unknown>(null)
  const isJsdom =
    typeof window !== 'undefined' &&
    window.navigator.userAgent.includes('jsdom')

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Add keyboard shortcut for Run: Ctrl+Enter or Cmd+Enter
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        onRun?.()
      },
    )

    // Customize theme colors to match ACCESS DENIED dark palette
    monaco.editor.defineTheme('access-denied-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF0055', fontStyle: 'bold' },
        { token: 'string', foreground: '98C379' },
        { token: 'number', foreground: 'D19A66' },
        { token: 'identifier', foreground: 'E6E6E6' },
      ],
      colors: {
        'editor.background': '#0e0e0e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#181818',
        'editorCursor.foreground': '#ff0055',
        'editorWhitespace.foreground': '#252525',
        'editorIndentGuide.background': '#202020',
        'editorIndentGuide.activeBackground': '#3a3a3a',
        'editorLineNumber.foreground': '#454545',
        'editorLineNumber.activeForeground': '#ff0055',
        'editor.selectionBackground': '#ff005533',
      },
    })
    monaco.editor.setTheme('access-denied-dark')
  }

  const lineCount = (code || '').split('\n').length

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden border-r border-white/[0.08] bg-[#0e0e0e]',
        className,
      )}
    >
      {/* Editor Tab Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0a0a] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-t-lg border-t-2 border-hwi bg-[#0e0e0e] px-3 py-1.5 text-xs font-semibold text-white">
            <FileCode className="size-3.5 text-hwi" aria-hidden="true" />
            <span className="font-mono">guess_the_number.py</span>
            <span className="ml-1 rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted/60">
              {stageId}
            </span>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset code to original stage starter"
            aria-label="Reset code to starter code"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            <span className="hidden sm:inline">Reset Code</span>
          </button>
        )}
      </div>

      {/* Editor Main Canvas */}
      <div className="relative flex-1 min-h-[300px]">
        {!isJsdom ? (
          <Editor
            height="100%"
            defaultLanguage="python"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => onChange(val ?? '')}
            onMount={handleEditorDidMount}
            options={{
              readOnly,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
            loading={
              <div className="flex h-full items-center justify-center gap-2 text-xs text-muted/50">
                <Code2 className="size-4 animate-spin text-hwi" aria-hidden="true" />
                <span>Loading Python Editor...</span>
              </div>
            }
          />
        ) : (
          <textarea
            data-testid="code-editor-textarea"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            spellCheck={false}
            className="size-full resize-none border-none bg-[#0e0e0e] p-4 font-mono text-xs text-white focus:outline-none"
            placeholder="# Write your Python code here..."
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#0a0a0a] px-3 py-1 text-[10px] text-muted/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-white/70">
            <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Python 3.12 (Pyodide)
          </span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span className="hidden sm:inline">Spaces: 4</span>
        </div>
      </div>
    </div>
  )
}
