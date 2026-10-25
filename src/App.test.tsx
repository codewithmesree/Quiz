import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { MCQ_BY_ID, RIDDLE_BY_ID } from './data/questions'

type User = ReturnType<typeof userEvent.setup>

async function fillProfile(user: User) {
  await user.type(screen.getByLabelText(/team name/i), 'Byte Force')
  await user.type(screen.getByLabelText('Player 1'), 'Aarav')
  await user.type(screen.getByLabelText('Player 2'), 'Meera')
  await user.type(screen.getByLabelText('Player 3'), 'Kabir')
}

async function startQuiz(user: User) {
  render(<App />)
  await fillProfile(user)
  await user.click(screen.getByRole('button', { name: /start quiz/i }))
  await screen.findByTestId('question-card')
}

async function answerCurrentMcq(user: User, correct = true) {
  const card = screen.getByTestId('question-card')
  const question = MCQ_BY_ID[card.dataset.questionId ?? '']
  expect(question).toBeDefined()

  const optionId = correct
    ? question.correctOptionId
    : question.options.find((option) => option.id !== question.correctOptionId)!
        .id

  await user.click(within(card).getByTestId(`option-${optionId}`))
  const feedback = within(card).getByTestId('feedback')
  expect(feedback).toHaveTextContent(correct ? /correct!/i : /incorrect/i)
  return { card, question, feedback }
}

async function goNext(user: User) {
  await user.click(
    screen.getByRole('button', {
      name: /next question|finish section|finish & view results/i,
    }),
  )
}

async function completeMcqSection(user: User) {
  for (let index = 0; index < 5; index += 1) {
    await answerCurrentMcq(user)
    await goNext(user)
  }
  await screen.findByTestId('section-break')
}

async function enterNextSection(user: User) {
  await user.click(
    screen.getByRole('button', { name: /enter section 0[23]/i }),
  )
  await screen.findByTestId('question-card')
}

async function answerCurrentRiddle(user: User, answer: string) {
  const card = screen.getByTestId('question-card')
  const riddle = RIDDLE_BY_ID[card.dataset.questionId ?? '']
  expect(riddle).toBeDefined()

  await user.type(within(card).getByTestId('riddle-input'), answer)
  await user.click(within(card).getByRole('button', { name: /submit answer/i }))
  return { card, riddle }
}

describe('welcome and player setup', () => {
  it('shows the branding, quiz structure and logo', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /access denied/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/questions per quiz session/i)).toBeInTheDocument()
    expect(screen.getByText('Computer Knowledge')).toBeInTheDocument()
    expect(
      screen.getByText('Advanced Computer Knowledge'),
    ).toBeInTheDocument()
    expect(screen.getByText('Computer Riddles')).toBeInTheDocument()

    const logo = screen.getAllByAltText(/official event logo/i)[0]
    expect(logo).toHaveAttribute('src', '/hwi-logo.png')
  })

  it('blocks the quiz until all four fields are completed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start quiz/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      /complete all four fields/i,
    )
    expect(screen.getByLabelText(/team name/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Player 1')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Player 2')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Player 3')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.queryByTestId('question-card')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/team name/i), 'Byte Force')
    expect(screen.getByLabelText(/team name/i)).toHaveAttribute(
      'aria-invalid',
      'false',
    )
    await user.click(screen.getByRole('button', { name: /start quiz/i }))
    expect(screen.queryByTestId('question-card')).not.toBeInTheDocument()
  })
})

describe('multiple-choice answer locking', () => {
  it('locks an incorrect answer, reveals the correct option, and never double-scores', async () => {
    const user = userEvent.setup()
    await startQuiz(user)

    const card = screen.getByTestId('question-card')
    const questionId = card.dataset.questionId
    const { question } = await answerCurrentMcq(user, false)
    const correctOptionId = question.correctOptionId

    expect(card).toHaveAttribute('data-question-id', questionId)
    expect(
      within(card).getByTestId(`option-${correctOptionId}`),
    ).toHaveAttribute('data-state', 'reveal')
    expect(within(card).getByText(/the correct answer is/i)).toBeInTheDocument()
    expect(within(card).getByTestId('feedback')).toHaveTextContent(
      /incorrect/i,
    )
    expect(
      screen
        .getAllByTestId(/^option-/)
        .every((option) => (option as HTMLButtonElement).disabled),
    ).toBe(true)
    expect(screen.getByTestId('live-score')).toHaveTextContent('0/14')

    // Direct clicks after locking cannot change the selection or award points.
    fireEvent.click(within(card).getByTestId(`option-${correctOptionId}`))
    fireEvent.click(within(card).getByTestId(`option-${correctOptionId}`))

    expect(within(card).getByTestId('feedback')).toHaveTextContent(
      /incorrect/i,
    )
    expect(screen.getByTestId('live-score')).toHaveTextContent('0/14')
    expect(card).toHaveAttribute('data-question-id', questionId)
    expect(
      screen.getByRole('button', { name: /next question/i }),
    ).toBeEnabled()
  })

  it('awards exactly one point for a correct answer', async () => {
    const user = userEvent.setup()
    await startQuiz(user)

    const { card, question } = await answerCurrentMcq(user, true)
    expect(within(card).getByText(/correct!/i)).toBeInTheDocument()
    expect(within(card).getByText(/\+1/)).toBeInTheDocument()
    expect(screen.getByTestId('live-score')).toHaveTextContent('1/14')

    const questionId = card.dataset.questionId
    fireEvent.click(within(card).getByTestId(`option-${question.correctOptionId}`))
    expect(screen.getByTestId('live-score')).toHaveTextContent('1/14')
    expect(card).toHaveAttribute('data-question-id', questionId)
  })
})

describe('riddle answer locking', () => {
  it('locks an incorrect riddle, reveals the accepted answer, and blocks edits', async () => {
    const user = userEvent.setup()
    await startQuiz(user)

    await completeMcqSection(user)
    await enterNextSection(user)
    await completeMcqSection(user)
    await enterNextSection(user)

    const card = screen.getByTestId('question-card')
    const riddle = RIDDLE_BY_ID[card.dataset.questionId ?? '']
    const input = within(card).getByTestId('riddle-input')

    await user.type(input, 'definitely not the answer')
    await user.click(
      within(card).getByRole('button', { name: /submit answer/i }),
    )

    const feedback = within(card).getByTestId('feedback')
    expect(feedback).toHaveTextContent(/incorrect/i)
    expect(feedback).toHaveTextContent(/accepted answer/i)
    expect(feedback).toHaveTextContent(riddle.answerKey.canonical)
    expect(input).toBeDisabled()
    expect(
      within(card).getByRole('button', { name: /submit answer/i }),
    ).toBeDisabled()
    expect(screen.getByTestId('live-score')).toHaveTextContent('10/14')

    const lockedValue = (input as HTMLInputElement).value
    fireEvent.change(input, { target: { value: riddle.answerKey.accepted[0] } })
    expect(input).toHaveValue(lockedValue)
    expect(screen.getByTestId('live-score')).toHaveTextContent('10/14')
  })
})

describe('complete quiz journey', () => {
  it('scores a perfect session, shows the full report, and restarts cleanly', async () => {
    const user = userEvent.setup()
    await startQuiz(user)

    // Section 1
    await completeMcqSection(user)
    expect(screen.getByTestId('section-break')).toHaveTextContent(
      /section 01 cleared/i,
    )
    expect(screen.getByTestId('section-break')).toHaveTextContent(
      /5\s*\/\s*5/i,
    )
    await enterNextSection(user)

    // Section 2
    await completeMcqSection(user)
    expect(screen.getByTestId('section-break')).toHaveTextContent(
      /section 02 cleared/i,
    )
    await enterNextSection(user)

    // Section 3 — all four riddles, original order, accepted variants.
    for (let index = 0; index < 4; index += 1) {
      const card = screen.getByTestId('question-card')
      const riddle = RIDDLE_BY_ID[card.dataset.questionId ?? '']
      expect(riddle).toBeDefined()
      expect(card.dataset.questionId).toBe(`r${index + 1}`)

      const { card: answeredCard } = await answerCurrentRiddle(
        user,
        riddle.answerKey.accepted[0],
      )
      expect(within(answeredCard).getByTestId('feedback')).toHaveTextContent(
        /correct!/i,
      )
      expect(within(answeredCard).getByTestId('riddle-input')).toBeDisabled()
      await goNext(user)
    }

    await screen.findByRole('heading', { name: 'Byte Force' })

    expect(
      screen.getByRole('img', {
        name: /final score: 14 out of 14, 100 percent/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Aarav')).toBeInTheDocument()
    expect(screen.getByText('Meera')).toBeInTheDocument()
    expect(screen.getByText('Kabir')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Computer Knowledge: 5 out of 5'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Advanced Computer Knowledge: 5 out of 5'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Computer Riddles: 4 out of 4'),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('answer-row')).toHaveLength(14)
    expect(
      screen.getAllByAltText(/official event logo/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/perfect run/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /restart quiz/i }))

    expect(
      screen.getByRole('heading', { name: /access denied/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/team name/i)).toHaveValue('')
    expect(screen.getByLabelText('Player 1')).toHaveValue('')
    expect(screen.queryByTestId('answer-row')).not.toBeInTheDocument()
    expect(screen.queryByTestId('live-score')).not.toBeInTheDocument()
  })
})
