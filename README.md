# Hack With India — SAIU · ACCESS DENIED Quiz

A polished, single-page quiz experience for the **Hack With India × SAIU** event. Every session draws a fresh set of questions, every answer locks on submission, and the final report breaks down all 14 questions across three rounds.

Built with React 19, TypeScript, Vite, and Tailwind CSS v4.

---

## What it does

| Round | Section | Questions | Format |
| --- | --- | --- | --- |
| 01 | Computer Knowledge | 5 of 10, randomly selected | Multiple choice |
| 02 | Advanced Computer Knowledge | 5 of 10, randomly selected | Multiple choice |
| 03 | Computer Riddles | All 4 | Typed answer |

**14 questions total.** Both MCQ pools are shuffled independently with Fisher–Yates, so no two sessions are guaranteed to be the same. Riddles always run in their original document order.

### Core behaviour

- **Randomized once per session** — selection happens when the quiz starts, never during render, so the draw stays stable while navigating.
- **Instant MCQ feedback** — the chosen option turns green or red immediately. A wrong answer reveals the correct option.
- **Permanent answer lock** — each question accepts exactly one submission. There is no backward navigation and no way to re-score a question.
- **Riddle normalization** — answers are trimmed, lowercased, stripped of punctuation/articles, and checked against an accepted-variants list.
- **Section breaks** — a score summary appears between rounds before the next section unlocks.
- **Final report only after all 14** — team name, player names, per-section scores, total/14, percentage, correct/incorrect counts, and a full answer breakdown.
- **Clean restart** — clears the session and returns to check-in for a brand-new draw.
- **No backend or persistence** — everything runs locally in the browser; refreshing starts over.

### Design & accessibility

- Black / red / white event theme with the official HWI logo on the welcome, quiz, and results screens.
- Responsive layout from 320 px phones through desktop, with a desktop session sidebar and mobile-first stacking.
- Keyboard-friendly controls, visible focus rings, semantic headings, ARIA labels for progress and scores, and screen-reader-friendly live feedback.
- `prefers-reduced-motion` support disables entrance and pulse animations.
- Bundled Space Grotesk + Inter fonts via Fontsource — no external font requests.

---

## Tech stack

- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) icons
- [Vitest](https://vitest.dev/) + Testing Library + jsdom
- [Oxlint](https://oxc.rs/) for linting

---

## Getting started

**Requirements:** Node.js 20+ (developed on Node 24) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open the printed URL — usually <http://localhost:5173>.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with Oxlint |
| `npm run typecheck` | Type-check without emitting |

### Tests

The suite covers the question bank, shuffle sampling, scoring, riddle normalization, and the end-to-end UI flow (validation → locked answers → section break → riddles → results → restart).

```bash
npm test
```

Expected: **6 files, 28 tests passing.**

---

## Project structure

```text
src/
├─ App.tsx                  # Screen switching + scroll reset
├─ hooks/useQuiz.ts         # Reducer state machine, locking, navigation
├─ data/questions.ts        # Question bank, riddle keys, section metadata
├─ utils/
│  ├─ shuffle.ts            # Fisher–Yates sampling
│  ├─ session.ts            # Session creation and lookup helpers
│  ├─ scoring.ts            # Derived score summary
│  └─ answers.ts            # Riddle answer normalization
├─ pages/
│  ├─ WelcomePage.tsx       # Team/player check-in
│  ├─ QuizPage.tsx          # Question flow and section breaks
│  └─ ResultsPage.tsx       # Final report
├─ components/              # Cards, header, sidebar, score ring, breakdown
├─ index.css                # Theme tokens, surfaces, fields, motion
└─ test/setup.ts            # jsdom + Testing Library setup

public/
└─ hwi-logo.png             # Official event logo
```

---

## Editing the content

All content lives in **`src/data/questions.ts`**.

- `SECTION_1_POOL` and `SECTION_2_POOL` hold the 10 + 10 MCQs. Keep the exact supplied wording; each question stores its own `correctOptionId`.
- `RIDDLES` holds the four riddles and their answer keys.
- `QUIZ_SECTIONS` controls section names, descriptions, and counts.

### Riddle answer keys

The source document did not include riddle answers, so the keys shipped here are **provisional** and intentionally editable. Each key has:

```ts
answerKey: {
  canonical: 'Keyboard',          // shown to players after submission
  accepted: ['keyboard', 'a keyboard'], // normalized variants that score as correct
  note: 'Provisional answer …',
}
```

To change marking, edit `canonical` and `accepted` — no UI code changes required. Matching ignores case, surrounding whitespace, punctuation, and articles (`a`, `an`, `the`).

### Replacing the logo

Overwrite `public/hwi-logo.png` with a new square PNG (the app references `${BASE_URL}hwi-logo.png`). Keep the filename to avoid code changes. The current asset is the supplied 517 × 516 official logo.

---

## Deployment

The app is a fully static build:

```bash
npm run build
```

Deploy the generated `dist/` folder to any static host — Vercel, Netlify, Cloudflare Pages, Firebase Hosting, or GitHub Pages.

> **GitHub Pages:** project sites are served from `/<repo-name>/`. Set Vite's `base` option in `vite.config.ts` to `'/<repo-name>/'` before building; the logo path already uses `BASE_URL`, so it will follow automatically.

---

## Publishing to GitHub

The repository is prepared locally but **no remote has been configured and nothing has been pushed**. To publish under your own account:

```bash
# From the project root
git init
git add .
git commit -m "Build Hack With India SAIU Access Denied quiz"

# Create an empty repository on GitHub named e.g. hwi-saiu-quiz, then:
git branch -M main
git remote add origin https://github.com/<your-username>/hwi-saiu-quiz.git
git push -u origin main
```

With the GitHub CLI, steps 2–4 can be replaced by:

```bash
gh repo create hwi-saiu-quiz --public --source=. --remote=origin --push
```

---

## Notes

- Scores are always derived from the immutable answer records — they are never incremented on click, so double submissions cannot inflate a result.
- The app stores nothing in `localStorage`; a refresh intentionally resets the session.
- `Q6` (“largest storage capacity”) and the riddle keys include notes where the source answer is debatable or provisional.

---

Made for **Hack With India — SAIU**.
