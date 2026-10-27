import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CodingChallengePage } from './CodingChallengePage'

describe('CodingChallengePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the header, problem panel, editor, and terminal', async () => {
    const user = userEvent.setup()
    render(<CodingChallengePage onBackToQuiz={vi.fn()} teamName="Byte Force" />)

    // First see the CodingInstructions page
    expect(screen.getByText(/ready to code?/i)).toBeInTheDocument()
    
    // Click "Start Coding" button to proceed
    const startCodingBtn = screen.getByRole('button', { name: /start coding/i })
    await user.click(startCodingBtn)

    // Now Header & Branding should be visible
    expect(screen.getByText(/python lab/i)).toBeInTheDocument()
    expect(screen.getByText('Byte Force')).toBeInTheDocument()

    // Run & Submit buttons
    expect(
      screen.getByRole('button', { name: /run python code/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /submit solution/i }),
    ).toBeInTheDocument()

    // Instructions
    expect(
      screen.getAllByText(/part 1: input & validation/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/stage requirements/i)).toBeInTheDocument()

    // Terminal
    expect(
      screen.getByLabelText(/integrated python terminal/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/console terminal/i)).toBeInTheDocument()
  })

  it('runs code and displays terminal logs', async () => {
    const user = userEvent.setup()
    render(<CodingChallengePage onBackToQuiz={vi.fn()} />)

    // Click "Start Coding" to proceed to editor
    const startCodingBtn = screen.getByRole('button', { name: /start coding/i })
    await user.click(startCodingBtn)

    const runBtn = screen.getByRole('button', { name: /run python code/i })
    await user.click(runBtn)

    await waitFor(() => {
      expect(
        screen.getByLabelText(/integrated python terminal/i),
      ).toBeInTheDocument()
    })
  })

  it('submits solution and validates stage completion when user types code', async () => {
    const user = userEvent.setup()
    render(<CodingChallengePage onBackToQuiz={vi.fn()} />)

    // Click "Start Coding" to proceed to editor
    const startCodingBtn = screen.getByRole('button', { name: /start coding/i })
    await user.click(startCodingBtn)

    const editor = screen.getByTestId('code-editor-textarea')
    fireEvent.change(editor, {
      target: {
        value: `import random
target = random.randint(1, 100)
val = input("Guess: ")
if val.isdigit():
    guess = int(val)
    print("Valid guess")
`,
      },
    })

    const submitBtn = screen.getByRole('button', { name: /submit solution/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Verification Passed')).toBeInTheDocument()
    })
  })

  it('allows navigation back to the quiz arena', async () => {
    const user = userEvent.setup()
    const handleBack = vi.fn()
    render(<CodingChallengePage onBackToQuiz={handleBack} />)

    // Click "Start Coding" to proceed to editor
    const startCodingBtn = screen.getByRole('button', { name: /start coding/i })
    await user.click(startCodingBtn)

    const backBtn = screen.getByRole('button', {
      name: /return to quiz arena/i,
    })
    await user.click(backBtn)

    expect(handleBack).toHaveBeenCalledTimes(1)
  })
})
