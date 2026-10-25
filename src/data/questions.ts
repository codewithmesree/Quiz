import type {
  MCQQuestion,
  RiddleQuestion,
  SectionId,
  SectionMeta,
} from '../types/quiz'

/**
 * AUTHORITATIVE QUESTION BANK
 * ---------------------------
 * Multiple-choice wording and options below follow the supplied Hack With India
 * source document. Answer keys are stored next to each question so the UI never
 * has to guess. Questions are intentionally kept out of the components.
 */

export const SECTION_1_POOL: readonly MCQQuestion[] = [
  {
    id: 'q1',
    section: 1,
    prompt: 'What is the full form of RAM?',
    options: [
      { id: 'A', text: 'Random Access Memory' },
      { id: 'B', text: 'Read Access Memory' },
      { id: 'C', text: 'Readily Available Memory' },
      { id: 'D', text: 'Random Available Memory' },
    ],
    correctOptionId: 'A',
  },
  {
    id: 'q2',
    section: 1,
    prompt: 'Which device is used to input data into a computer?',
    options: [
      { id: 'A', text: 'Printer' },
      { id: 'B', text: 'Monitor' },
      { id: 'C', text: 'Keyboard' },
      { id: 'D', text: 'Speaker' },
    ],
    correctOptionId: 'C',
  },
  {
    id: 'q3',
    section: 1,
    prompt: 'Which of the following is an example of system software?',
    options: [
      { id: 'A', text: 'Microsoft Excel' },
      { id: 'B', text: 'Windows 10' },
      { id: 'C', text: 'Google Chrome' },
      { id: 'D', text: 'Adobe Reader' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q4',
    section: 1,
    prompt: 'Which of the following is NOT a programming language?',
    options: [
      { id: 'A', text: 'Python' },
      { id: 'B', text: 'HTML' },
      { id: 'C', text: 'Java' },
      { id: 'D', text: 'Microsoft Word' },
    ],
    correctOptionId: 'D',
    answerNote: 'Matches the intended answer in the source document.',
  },
  {
    id: 'q5',
    section: 1,
    prompt: 'Which part of the computer is responsible for executing instructions?',
    options: [
      { id: 'A', text: 'Hard Disk' },
      { id: 'B', text: 'RAM' },
      { id: 'C', text: 'CPU' },
      { id: 'D', text: 'Motherboard' },
    ],
    correctOptionId: 'C',
  },
  {
    id: 'q6',
    section: 1,
    prompt: 'Which storage device has the largest capacity?',
    options: [
      { id: 'A', text: 'DVD' },
      { id: 'B', text: 'USB Flash Drive' },
      { id: 'C', text: 'SSD' },
      { id: 'D', text: 'Hard Disk Drive' },
    ],
    correctOptionId: 'D',
    answerNote:
      'Intended source answer: Hard Disk Drive. Real-world capacities vary by device, which is why this key is kept editable here.',
  },
  {
    id: 'q7',
    section: 1,
    prompt: 'What does GUI stand for?',
    options: [
      { id: 'A', text: 'Graphical User Interface' },
      { id: 'B', text: 'General User Interface' },
      { id: 'C', text: 'Guided User Interface' },
      { id: 'D', text: 'Graphical User Interaction' },
    ],
    correctOptionId: 'A',
  },
  {
    id: 'q8',
    section: 1,
    prompt: 'Which of the following is a volatile memory?',
    options: [
      { id: 'A', text: 'SSD' },
      { id: 'B', text: 'Hard Disk' },
      { id: 'C', text: 'RAM' },
      { id: 'D', text: 'ROM' },
    ],
    correctOptionId: 'C',
  },
  {
    id: 'q9',
    section: 1,
    prompt: 'What is the main function of an operating system?',
    options: [
      { id: 'A', text: 'Perform calculations' },
      { id: 'B', text: 'Manage hardware and software resources' },
      { id: 'C', text: 'Browse the internet' },
      { id: 'D', text: 'Create documents' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q10',
    section: 1,
    prompt: 'What does URL stand for?',
    options: [
      { id: 'A', text: 'Uniform Resource Locator' },
      { id: 'B', text: 'Uniform Resource Link' },
      { id: 'C', text: 'Universal Resource Locator' },
      { id: 'D', text: 'Universal Resource Link' },
    ],
    correctOptionId: 'A',
  },
]

export const SECTION_2_POOL: readonly MCQQuestion[] = [
  {
    id: 'q11',
    section: 2,
    prompt: 'What is the purpose of a firewall in a computer network?',
    options: [
      { id: 'A', text: 'To speed up the internet' },
      { id: 'B', text: 'To protect against unauthorized access' },
      { id: 'C', text: 'To manage network traffic' },
      { id: 'D', text: 'To boost Wi-Fi signal' },
    ],
    correctOptionId: 'B',
    answerNote: 'Matches the intended answer in the source document.',
  },
  {
    id: 'q12',
    section: 2,
    prompt: 'What type of software is used to surf the web?',
    options: [
      { id: 'A', text: 'Operating system' },
      { id: 'B', text: 'Web browser' },
      { id: 'C', text: 'Database' },
      { id: 'D', text: 'Text editor' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q13',
    section: 2,
    prompt: "What does 'HTTP' stand for?",
    options: [
      { id: 'A', text: 'HyperText Transmission Protocol' },
      { id: 'B', text: 'HyperText Transfer Protocol' },
      { id: 'C', text: 'HyperTransfer Text Protocol' },
      { id: 'D', text: 'Hyper Transmission Transfer Protocol' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q14',
    section: 2,
    prompt: 'Which of the following is an example of an input device?',
    options: [
      { id: 'A', text: 'Printer' },
      { id: 'B', text: 'Monitor' },
      { id: 'C', text: 'Mouse' },
      { id: 'D', text: 'Speaker' },
    ],
    correctOptionId: 'C',
  },
  {
    id: 'q15',
    section: 2,
    prompt: 'What is the smallest unit of data in a computer?',
    options: [
      { id: 'A', text: 'Byte' },
      { id: 'B', text: 'Bit' },
      { id: 'C', text: 'Nibble' },
      { id: 'D', text: 'Kilobyte' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q16',
    section: 2,
    prompt: 'What is the purpose of the ALU in a computer?',
    options: [
      { id: 'A', text: 'To manage memory' },
      { id: 'B', text: 'To perform arithmetic and logic operations' },
      { id: 'C', text: 'To control input and output' },
      { id: 'D', text: 'To manage storage' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q17',
    section: 2,
    prompt: 'Which file format is used for images?',
    options: [
      { id: 'A', text: '.docx' },
      { id: 'B', text: '.xlsx' },
      { id: 'C', text: '.jpg' },
      { id: 'D', text: '.pptx' },
    ],
    correctOptionId: 'C',
  },
  {
    id: 'q18',
    section: 2,
    prompt: 'Which key is used to delete the character to the left of the cursor?',
    options: [
      { id: 'A', text: 'Enter' },
      { id: 'B', text: 'Backspace' },
      { id: 'C', text: 'Delete' },
      { id: 'D', text: 'Shift' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q19',
    section: 2,
    prompt: 'Which of the following is a search engine?',
    options: [
      { id: 'A', text: 'Firefox' },
      { id: 'B', text: 'Bing' },
      { id: 'C', text: 'Outlook' },
      { id: 'D', text: 'Skype' },
    ],
    correctOptionId: 'B',
  },
  {
    id: 'q20',
    section: 2,
    prompt: 'What does the shortcut Ctrl + C do?',
    options: [
      { id: 'A', text: 'Cuts the selected text' },
      { id: 'B', text: 'Copies the selected text' },
      { id: 'C', text: 'Pastes the copied text' },
      { id: 'D', text: 'Saves the document' },
    ],
    correctOptionId: 'B',
  },
]

/**
 * RIDDLE ANSWER KEY
 * -----------------
 * The source document does not include an answer key for these riddles. The
 * answers below are provisional intended answers supplied for this build.
 * Edit `canonical` (shown to players) and `accepted` (normalized variants) to
 * tune marking without touching any UI code.
 */
export const RIDDLES: readonly RiddleQuestion[] = [
  {
    id: 'r1',
    section: 3,
    prompt:
      'I am full of letters but I am not a book. I have Space but no room, and you can Enter but never step inside. What am I?',
    answerKey: {
      canonical: 'Keyboard',
      accepted: ['keyboard', 'computer keyboard', 'a keyboard'],
      note: 'Provisional answer — no riddle answer key was supplied in the source document.',
    },
  },
  {
    id: 'r2',
    section: 3,
    prompt:
      'I travel across your screen without taking a step. I can become an arrow, a hand, or a blinking line, and I obey a small creature with a tail. What am I?',
    answerKey: {
      canonical: 'Cursor (mouse pointer)',
      accepted: [
        'cursor',
        'mouse pointer',
        'mouse cursor',
        'cursor pointer',
        'pointer',
        'mouse arrow',
        'arrow pointer',
      ],
      note: 'Provisional answer — no riddle answer key was supplied in the source document.',
    },
  },
  {
    id: 'r3',
    section: 3,
    prompt:
      'I remember everything you save, even after the computer sleeps, but I have no brain. What am I?',
    answerKey: {
      canonical: 'Hard drive (storage device)',
      accepted: [
        'hard drive',
        'hard disk',
        'hard disk drive',
        'hdd',
        'harddrive',
        'storage',
        'storage device',
        'storage drive',
        'disk',
        'drive',
        'ssd',
        'solid state drive',
        'flash drive',
        'usb drive',
      ],
      note: 'Provisional answer — no riddle answer key was supplied in the source document.',
    },
  },
  {
    id: 'r4',
    section: 3,
    prompt:
      'I guard the gate of your computer. I ask for a secret before letting you enter, but I am not a security guard. What am I?',
    answerKey: {
      canonical: 'Password (login authentication)',
      accepted: [
        'password',
        'pass word',
        'passcode',
        'login',
        'login password',
        'authentication',
        'login authentication',
        'user authentication',
        'password authentication',
        'credentials',
      ],
      note: 'Provisional answer — no riddle answer key was supplied in the source document.',
    },
  },
]

export const QUIZ_SECTIONS: readonly SectionMeta[] = [
  {
    id: 1,
    eyebrow: 'Section 01',
    name: 'Computer Knowledge',
    shortName: 'Knowledge',
    description:
      'Five randomized fundamentals. One submission per question — choose carefully.',
    count: 5,
    type: 'mcq',
  },
  {
    id: 2,
    eyebrow: 'Section 02',
    name: 'Advanced Computer Knowledge',
    shortName: 'Advanced',
    description:
      'Five randomized questions on networks, hardware and everyday computing.',
    count: 5,
    type: 'mcq',
  },
  {
    id: 3,
    eyebrow: 'Section 03',
    name: 'Computer Riddles',
    shortName: 'Riddles',
    description:
      'All four riddles. Type your answer, submit once, and lock it in.',
    count: 4,
    type: 'riddle',
  },
]

export const SECTION_BY_ID: Record<SectionId, SectionMeta> = {
  1: QUIZ_SECTIONS[0],
  2: QUIZ_SECTIONS[1],
  3: QUIZ_SECTIONS[2],
}

export const TOTAL_QUESTIONS = 14

export const ALL_MCQ_QUESTIONS: readonly MCQQuestion[] = [
  ...SECTION_1_POOL,
  ...SECTION_2_POOL,
]

export const MCQ_BY_ID: Readonly<Record<string, MCQQuestion>> =
  Object.fromEntries(ALL_MCQ_QUESTIONS.map((question) => [question.id, question]))

export const RIDDLE_BY_ID: Readonly<Record<string, RiddleQuestion>> =
  Object.fromEntries(RIDDLES.map((riddle) => [riddle.id, riddle]))
