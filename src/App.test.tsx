import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { MCQ_BY_ID, RIDDLE_BY_ID } from './data/questions'
import { LEADERBOARD_STORAGE_KEY } from './utils/leaderboard'
import { QUIZ_STORAGE_KEY } from './utils/persistence'

type User = ReturnType<typeof userEvent.setup>
type AppView = ReturnType<typeof render>

async function fillProfile(user: User) {
  await user.type(screen.getByLabelText(/team name/i), 'Byte Force')
}

async function startQuiz(user: User): Promise<AppView> {
  const view = render(<App />)
  await fillProfile(user)
  await user.click(screen.getByRole('button', { name: /start quiz/i }))
  await screen.findByTestId('question-card')
  return view
}

async function refresh(view: AppView) {
  view.unmount()
  render(<App />)
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
  return { card, question, feedback, optionId }
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
  await user.click(screen.getByRole('button', { name: /continue/i }))
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

describe('welcome and team setup', () => {
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

  it('blocks the quiz until the team name is entered', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start quiz/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      /complete the field/i,
    )
    expect(screen.getByLabelText(/team name/i)).toHaveAttribute(
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
    await screen.findByTestId('question-card')
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

describe('localStorage session persistence', () => {
  it('restores a locked incorrect answer and score in section 1', async () => {
    const user = userEvent.setup()
    const view = await startQuiz(user)

    const { card, question, optionId } = await answerCurrentMcq(user, false)
    const questionId = card.dataset.questionId
    expect(questionId).toBeDefined()
    expect(optionId).not.toBe(question.correctOptionId)

    await waitFor(() => {
      expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toContain(
        questionId,
      )
    })

    await refresh(view)

    const restored = screen.getByTestId('question-card')
    expect(restored).toHaveAttribute('data-question-id', questionId)
    expect(within(restored).getByTestId(`option-${optionId}`)).toHaveAttribute(
      'data-state',
      'wrong',
    )
    expect(
      within(restored).getByTestId(`option-${question.correctOptionId}`),
    ).toHaveAttribute('data-state', 'reveal')
    expect(within(restored).getByTestId('feedback')).toHaveTextContent(
      /incorrect/i,
    )
    expect(
      within(restored)
        .getAllByTestId(/^option-/)
        .every((option) => (option as HTMLButtonElement).disabled),
    ).toBe(true)
    expect(screen.getByTestId('live-score')).toHaveTextContent('0/14')
  })

  it('restores the section break after section 1', async () => {
    const user = userEvent.setup()
    const view = await startQuiz(user)

    await completeMcqSection(user)
    expect(screen.getByTestId('section-break')).toHaveTextContent(
      'Way to go! Keep it up!',
    )

    view.unmount()
    render(<App />)

    const breakScreen = await screen.findByTestId('section-break')
    expect(breakScreen).toHaveTextContent('Way to go! Keep it up!')
    expect(breakScreen).toHaveTextContent(/5\s*\/\s*5/i)
    expect(screen.getByTestId('live-score')).toHaveTextContent('5/14')

    await enterNextSection(user)
    await screen.findByTestId('question-card')
  })

  it('restores the drawn question and locked answer in section 2', async () => {
    const user = userEvent.setup()
    const view = await startQuiz(user)

    await completeMcqSection(user)
    await enterNextSection(user)

    const { card, optionId } = await answerCurrentMcq(user, true)
    const questionId = card.dataset.questionId
    expect(questionId).toBeDefined()

    await waitFor(() => {
      expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toContain(
        questionId,
      )
    })

    await refresh(view)

    const restored = screen.getByTestId('question-card')
    expect(restored).toHaveAttribute('data-question-id', questionId)
    expect(within(restored).getByTestId(`option-${optionId}`)).toHaveAttribute(
      'data-state',
      'correct',
    )
    expect(within(restored).getByTestId('feedback')).toHaveTextContent(
      /correct!/i,
    )
    expect(screen.getByTestId('live-score')).toHaveTextContent('6/14')
  })

  it('restores a locked riddle answer in section 3', async () => {
    const user = userEvent.setup()
    const view = await startQuiz(user)

    await completeMcqSection(user)
    await enterNextSection(user)
    await completeMcqSection(user)
    await enterNextSection(user)

    const { card } = await answerCurrentRiddle(user, riddleAnswer())
    const questionId = card.dataset.questionId
    const submitted = riddleAnswer()
    expect(questionId).toBe('r1')

    await waitFor(() => {
      expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toContain(
        questionId,
      )
    })

    await refresh(view)

    const restored = screen.getByTestId('question-card')
    expect(restored).toHaveAttribute('data-question-id', 'r1')
    const input = within(restored).getByTestId('riddle-input')
    expect(input).toBeDisabled()
    expect(input).toHaveValue(submitted)
    expect(within(restored).getByTestId('feedback')).toHaveTextContent(
      /correct!/i,
    )
    expect(screen.getByTestId('live-score')).toHaveTextContent('11/14')
  })

  it('restores completed results until a new quiz is explicitly started', async () => {
    const user = userEvent.setup()
    let view = await startQuiz(user)

    await completeMcqSection(user)
    await enterNextSection(user)
    await completeMcqSection(user)
    await enterNextSection(user)

    for (let index = 0; index < 4; index += 1) {
      const card = screen.getByTestId('question-card')
      const riddle = RIDDLE_BY_ID[card.dataset.questionId ?? '']
      await answerCurrentRiddle(user, riddle.answerKey.accepted[0])
      await goNext(user)
    }

    expect(screen.getByTestId('section-break')).toHaveTextContent(
      "Congratulations! You've completed the quiz!",
    )
    view.unmount()
    view = render(<App />)
    expect(
      await screen.findByTestId('section-break'),
    ).toHaveTextContent("Congratulations! You've completed the quiz!")
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('heading', { name: 'Byte Force' })
    expect(screen.getAllByTestId('answer-row')).toHaveLength(14)
    expect(
      screen.getByRole('button', { name: /leaderboard/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /leaderboard/i }))
    expect(
      screen.getByRole('heading', { name: /team leaderboard/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Byte Force')).toBeInTheDocument()
    expect(screen.getByText('14/14')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back to results/i }))
    await screen.findByRole('heading', { name: 'Byte Force' })
    expect(JSON.parse(window.localStorage.getItem(LEADERBOARD_STORAGE_KEY) ?? '[]')).toHaveLength(1)

    view.unmount()
    render(<App />)

    await screen.findByRole('heading', { name: 'Byte Force' })
    expect(
      screen.getByRole('img', {
        name: /final score: 14 out of 14, 100 percent/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('answer-row')).toHaveLength(14)
    expect(
      screen.queryByRole('button', { name: /restart quiz/i }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: /new session/i }),
    ).not.toBeInTheDocument()
  })

  it('confirms before resetting an unfinished quiz', async () => {
    const user = userEvent.setup()
    const view = await startQuiz(user)

    const { card, optionId } = await answerCurrentMcq(user, true)
    const questionId = card.dataset.questionId
    await waitFor(() => {
      expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toContain(
        questionId,
      )
    })

    await user.click(screen.getByRole('button', { name: /reset quiz/i }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/reset this quiz/i)
    expect(dialog).toHaveTextContent(/cannot be undone/i)

    await user.click(
      within(dialog).getByRole('button', { name: /keep playing/i }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('question-card')).toHaveAttribute(
      'data-question-id',
      questionId,
    )
    expect(
      within(screen.getByTestId('question-card')).getByTestId(
        `option-${optionId}`,
      ),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /reset quiz/i }))
    const confirmDialog = await screen.findByRole('dialog')
    await user.click(
      within(confirmDialog).getByRole('button', { name: /reset quiz/i }),
    )

    await screen.findByRole('heading', { name: /access denied/i })
    expect(screen.queryByTestId('question-card')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toBeNull()
    })

    view.unmount()
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /access denied/i }),
    ).toBeInTheDocument()
  })
})

function riddleAnswer() {
  return RIDDLE_BY_ID.r1.answerKey.accepted[0]
}

describe('complete quiz journey', () => {
  it('scores a perfect session, shows the full report, and restarts cleanly', async () => {
    const user = userEvent.setup()
    await startQuiz(user)

    // Section 1
    await completeMcqSection(user)
    expect(screen.getByTestId('section-break')).toHaveTextContent(
      'Way to go! Keep it up!',
    )
    await enterNextSection(user)

    // Section 2
    await completeMcqSection(user)
    expect(screen.getByTestId('section-break')).toHaveTextContent(
      "Great job! You're almost there!",
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

    expect(screen.getByTestId('section-break')).toHaveTextContent(
      "Congratulations! You've completed the quiz!",
    )
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('heading', { name: 'Byte Force' })

    expect(
      screen.getByRole('img', {
        name: /final score: 14 out of 14, 100 percent/i,
      }),
    ).toBeInTheDocument()
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

    expect(
      screen.queryByRole('button', { name: /restart quiz/i }),
    ).not.toBeInTheDocument()
  })
})
