import type {
  ChallengeDefinition,
  CodingStageId,
  StageDefinition,
} from '../types/codingChallenge'
import {
  validatePart1,
  validatePart2,
  validateStage3Debugging,
} from '../services/stageValidator'

export const GUESS_THE_NUMBER_STAGES: readonly StageDefinition[] = [
  {
    id: 'part-1',
    index: 1,
    title: 'Part 1: Input & Validation',
    subtitle: 'Generate secret number & validate user input',
    tagline: 'Stage 01 — Foundation',
    description:
      'In this first part of the Guess the Number challenge, you will initialize the target number using Python’s random module, prompt the player for a guess, and validate that the input is a valid positive integer.',
    instructions: [
      'Import Python’s `random` module.',
      'Generate a target integer between 1 and 100 inclusive using `random.randint(1, 100)`.',
      'Display a welcoming prompt instructing the player to guess.',
      'Prompt the user for input using `input("Enter your guess: ")`.',
      'Validate the input using `.isdigit()` or a try/except block to ensure only digits are processed.',
      'Convert the validated string input into an integer with `int()`.',
    ],
    requirements: [
      'Must import and use random.randint(1, 100)',
      'Must prompt the player using Python’s input() function',
      'Must check if the input contains valid numeric digits',
      'Must convert the validated input to an int type',
      'Must print an informative message if input is invalid',
    ],
    hints: [
      'Python strings have a built-in method `string.isdigit()` that returns True if all characters are digits.',
      'To convert a string to a number, pass it to `int(value)`. Be sure to only do this after validating!',
      'You can test with both valid numbers (e.g. 42) and invalid characters (e.g. "abc") in the terminal.',
    ],
    starterCode: ``,
    validate: validatePart1,
  },
  {
    id: 'part-2',
    index: 2,
    title: 'Part 2: Game Logic',
    subtitle: 'Implement the game loop, attempt counter & comparison',
    tagline: 'Stage 02 — Core Engine',
    description:
      'Now that input collection and validation are established, implement the complete gameplay loop. Track how many attempts the player makes and provide feedback whether their guess is too low, too high, or correct.',
    instructions: [
      'Initialize an attempt counter variable (e.g., `attempts = 0`).',
      'Create a `while True:` loop so the player can keep guessing until they find the secret number.',
      'For each valid guess, increment `attempts` by 1.',
      'If `guess < target`, print "Too low! Try again."',
      'If `guess > target`, print "Too high! Try again."',
      'If `guess == target`, congratulate the player, display the total attempts taken, and `break` out of the loop.',
    ],
    requirements: [
      'Wrap guessing logic inside a repeating while loop',
      'Maintain an attempt counter that increments on valid guesses',
      'Display "Too low" when the guess is less than target',
      'Display "Too high" when the guess is greater than target',
      'Display victory message with total attempts and exit the loop when correct',
    ],
    hints: [
      'Use `attempts += 1` inside the loop right after validating the guess.',
      'Use `if...elif...else` branching to compare `guess` against `target`.',
      'The `break` statement exits the nearest enclosing while loop when the user wins.',
    ],
    starterCode: ``,
    validate: validatePart2,
  },
  {
    id: 'debugging',
    index: 3,
    title: 'Stage 3: Debugging Challenge',
    subtitle: 'Find and fix three critical bugs in the game',
    tagline: 'Stage 03 — Final Audit',
    description:
      'A fellow developer submitted their Guess the Number implementation, but security testing revealed 3 subtle bugs. Inspect the code, run it in the terminal, identify each bug, and fix them to complete the audit.',
    instructions: [
      'Bug 1: The random number range was configured incorrectly and misses the upper limit of 100. Correct it.',
      'Bug 2: The player’s raw input is not converted into an integer, leading to comparison bugs or runtime type mismatches. Ensure proper conversion.',
      'Bug 3: The comparison logic between the player’s guess and secret number has inverted directions. Fix the branches so "Too low" and "Too high" give accurate guidance.',
      'Run and test the program in the terminal to verify all fixes before clicking Submit.',
    ],
    requirements: [
      'Fix secret number range to include 1 through 100 inclusive (random.randint(1, 100))',
      'Convert raw user input into an int before numerical comparisons',
      'Ensure "Too low" is shown when guess < secret_number and "Too high" when guess > secret_number',
      'Program runs without errors and terminates cleanly upon victory',
    ],
    hints: [
      'Check `random.randint(1, 99)` — randint includes both endpoints, so 99 excludes 100!',
      'Check what type `input()` returns — it always returns a `str`. Comparing a string to an int in Python 3 causes a TypeError!',
      'Look closely at the `>` and `<` operators in the comparison `if...elif` statements.',
    ],
    starterCode: `# ============================================================
# ACCESS DENIED // Python Code Lab
# Stage 3: Debugging Challenge
# ------------------------------------------------------------
# System Audit: 3 bugs detected in this implementation.
# Find them, fix them, and submit your verified solution!
# ============================================================

import random

def play_guessing_game():
    # BUG #1: Range is incorrect! (Should pick between 1 and 100 inclusive)
    secret_number = random.randint(1, 99)
    attempts = 0
    
    print("=" * 44)
    print(">>> ACCESS DENIED: DEBUGGING LAB <<<")
    print("Audit the code and fix all 3 bugs to proceed.")
    print("=" * 44)
    
    while True:
        raw_input = input("Enter your guess (1-100): ")
        
        if not raw_input.isdigit():
            print("[!] Please enter a valid positive number.")
            continue
            
        # BUG #2: raw_input is stored as a string without integer conversion!
        # Fix this line by converting raw_input to an int:
        guess = raw_input
        attempts += 1
        
        # BUG #3: Comparison logic is inverted!
        # "Too low" is printed when guess is greater, and "Too high" when smaller!
        if guess > secret_number:
            print("[-] Too low! Try a higher number.")
        elif guess < secret_number:
            print("[+] Too high! Try a lower number.")
        else:
            print("=" * 44)
            print(f"[SYSTEM CLEARED] Correct number {secret_number} found!")
            print(f"Attempts: {attempts}")
            print("=" * 44)
            break

if __name__ == "__main__":
    play_guessing_game()
`,
    validate: validateStage3Debugging,
  },
]

export const GUESS_THE_NUMBER_CHALLENGE: ChallengeDefinition = {
  id: 'guess-the-number',
  title: 'Guess the Number',
  subtitle: 'Interactive Python Challenge (3 Stages)',
  description:
    'A three-part Python programming challenge where participants implement an interactive number guessing game, write input validation, orchestrate game loops, and debug existing programs in the browser.',
  stages: GUESS_THE_NUMBER_STAGES,
}

export function getStageById(id: CodingStageId): StageDefinition {
  const stage = GUESS_THE_NUMBER_STAGES.find((s) => s.id === id)
  if (!stage) {
    return GUESS_THE_NUMBER_STAGES[0]
  }
  return stage
}

export const STAGE_ORDER: readonly CodingStageId[] = [
  'part-1',
  'part-2',
  'debugging',
]
