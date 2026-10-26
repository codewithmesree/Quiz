import type {
  CodingStageId,
  TerminalLine,
  ValidationDetail,
  ValidationResult,
} from '../types/codingChallenge'

/**
 * Validates Python syntax and structure statically.
 * This runs fast and gives immediate feedback before or during submission.
 */
export function checkBasicPythonSyntax(code: string): {
  valid: boolean
  error?: string
} {
  const trimmed = code.trim()
  if (!trimmed) {
    return { valid: false, error: 'Source code is empty.' }
  }

  // Check balanced parentheses, brackets, and braces
  const stack: { char: string; line: number }[] = []
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  const lines = code.split('\n')

  let inSingleQuote = false
  let inDoubleQuote = false
  let inTripleSingle = false
  let inTripleDouble = false

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    let i = 0
    while (i < line.length) {
      const ch = line[i]
      const next3 = line.slice(i, i + 3)

      if (next3 === "'''" && !inDoubleQuote && !inTripleDouble) {
        inTripleSingle = !inTripleSingle
        i += 3
        continue
      }
      if (next3 === '"""' && !inSingleQuote && !inTripleSingle) {
        inTripleDouble = !inTripleDouble
        i += 3
        continue
      }

      if (inTripleSingle || inTripleDouble) {
        i++
        continue
      }

      if (ch === "'" && !inDoubleQuote) {
        if (i === 0 || line[i - 1] !== '\\') inSingleQuote = !inSingleQuote
      } else if (ch === '"' && !inSingleQuote) {
        if (i === 0 || line[i - 1] !== '\\') inDoubleQuote = !inDoubleQuote
      } else if (!inSingleQuote && !inDoubleQuote) {
        if (ch === '#') {
          // Comment line
          break
        }
        if (ch === '(' || ch === '[' || ch === '{') {
          stack.push({ char: ch, line: lineIdx + 1 })
        } else if (ch === ')' || ch === ']' || ch === '}') {
          const expected = pairs[ch]
          const top = stack.pop()
          if (!top || top.char !== expected) {
            return {
              valid: false,
              error: `SyntaxError: Unmatched '${ch}' on line ${lineIdx + 1}.`,
            }
          }
        }
      }
      i++
    }
  }

  if (stack.length > 0) {
    const unclosed = stack.pop()!
    return {
      valid: false,
      error: `SyntaxError: Unclosed bracket '${unclosed.char}' opened on line ${unclosed.line}.`,
    }
  }

  return { valid: true }
}

/**
 * Stage 1 Validator: Part 1 — Input and Validation
 * Checks:
 * 1. Random number generation (random.randint or randrange)
 * 2. User input prompt via input()
 * 3. Validation logic (.isdigit() or try...except int())
 * 4. Conversion to integer using int()
 */
export function validatePart1(
  code: string,
  _outputs: readonly TerminalLine[],
): ValidationResult {
  const syntax = checkBasicPythonSyntax(code)
  if (!syntax.valid) {
    return {
      success: false,
      message: 'Syntax check failed. Please resolve Python syntax errors.',
      error: syntax.error,
    }
  }

  const hasRandom =
    /import\s+random/i.test(code) &&
    (/random\.(randint|randrange)/i.test(code) || /randint\s*\(/i.test(code))

  const hasInput = /input\s*\(/i.test(code)

  const hasValidation =
    /\.isdigit\s*\(\s*\)/i.test(code) ||
    /try\s*:[\s\S]*?except\s+(ValueError|Exception)/i.test(code) ||
    /isnumeric\s*\(\s*\)/i.test(code)

  const hasIntConversion = /int\s*\(/i.test(code)

  const details: ValidationDetail[] = [
    {
      title: 'Target Random Number Generation',
      passed: hasRandom,
      description: 'Uses random.randint(1, 100) to select a secret number.',
    },
    {
      title: 'Interactive User Input',
      passed: hasInput,
      description: 'Prompts the player for input using input().',
    },
    {
      title: 'Input Validation',
      passed: hasValidation,
      description: 'Checks that input is a valid number (e.g. with .isdigit() or try-except).',
    },
    {
      title: 'Integer Conversion',
      passed: hasIntConversion,
      description: 'Converts validated user input string into an integer with int().',
    },
  ]

  const allPassed = details.every((d) => d.passed)

  return {
    success: allPassed,
    message: allPassed
      ? 'Part 1 Completed! Input collection and validation successfully verified.'
      : 'Part 1 Requirements Incomplete. Please check the requirements checklist below.',
    details,
  }
}

/**
 * Stage 2 Validator: Part 2 — Game Logic
 * Checks:
 * 1. Loop structure (while loop)
 * 2. Attempt counter tracking (attempts += 1)
 * 3. Branching comparison logic (too low, too high, correct)
 * 4. Termination when correct (break or condition)
 */
export function validatePart2(
  code: string,
  _outputs: readonly TerminalLine[],
): ValidationResult {
  const syntax = checkBasicPythonSyntax(code)
  if (!syntax.valid) {
    return {
      success: false,
      message: 'Syntax check failed. Please resolve Python syntax errors.',
      error: syntax.error,
    }
  }

  const hasLoop = /while\s+/i.test(code)
  const hasAttemptCounter =
    /(attempts?|count|guesses?)\s*(\+=|=[\w\s]+\+)\s*1/i.test(code)
  const hasBranchLow =
    /(<|less|too\s*low)/i.test(code) && /print\s*\(.*(low|higher)/i.test(code)
  const hasBranchHigh =
    /(>|greater|too\s*high)/i.test(code) && /print\s*\(.*(high|lower)/i.test(code)
  const hasBreakOrWin =
    /break/i.test(code) || /(congrat|guessed|win|correct)/i.test(code)

  const details: ValidationDetail[] = [
    {
      title: 'Game Loop',
      passed: hasLoop,
      description: 'Implements a while loop to allow repeated guessing.',
    },
    {
      title: 'Attempt Counter',
      passed: hasAttemptCounter,
      description: 'Increments an attempt counter for each valid guess.',
    },
    {
      title: 'Too Low Comparison Branch',
      passed: hasBranchLow,
      description: 'Informs player when their guess is too low.',
    },
    {
      title: 'Too High Comparison Branch',
      passed: hasBranchHigh,
      description: 'Informs player when their guess is too high.',
    },
    {
      title: 'Winning Condition & Loop Exit',
      passed: hasBreakOrWin,
      description: 'Terminates game loop upon correct guess with a success message.',
    },
  ]

  const allPassed = details.every((d) => d.passed)

  return {
    success: allPassed,
    message: allPassed
      ? 'Part 2 Completed! Full game loop and comparison logic successfully verified.'
      : 'Part 2 Requirements Incomplete. Review the comparison branches and attempt counter.',
    details,
  }
}

/**
 * Stage 3 Validator: Debugging
 * In Stage 3, the participant is given buggy starter code and must fix 3 bugs:
 * 1. Upper range must be 100 (not 99).
 * 2. raw_guess must be converted to int before comparing.
 * 3. Comparison logic must NOT be inverted (guess < secret_number -> Too low, guess > secret_number -> Too high).
 */
export function validateStage3Debugging(
  code: string,
  _outputs: readonly TerminalLine[],
): ValidationResult {
  const syntax = checkBasicPythonSyntax(code)
  if (!syntax.valid) {
    return {
      success: false,
      message: 'Syntax check failed. Please resolve Python syntax errors.',
      error: syntax.error,
    }
  }

  // Bug 1 fixed: range 1 to 100
  const hasFixedRange =
    /randint\s*\(\s*1\s*,\s*100\s*\)/i.test(code) ||
    /randrange\s*\(\s*1\s*,\s*101\s*\)/i.test(code)
  const hasBuggy99Range = /randint\s*\(\s*1\s*,\s*99\s*\)/i.test(code)

  // Bug 2 fixed: integer conversion
  const hasFixedConversion =
    /int\s*\(\s*(raw_guess|raw_input|raw|user_input|guess)\s*\)/i.test(code) &&
    !/guess\s*=\s*(raw_guess|raw_input|raw)\s*($|\n|#)/i.test(code)

  // Bug 3 fixed: proper comparison direction
  // Look for: guess < secret_number ... "Too low" or guess > secret_number ... "Too high"
  const hasCorrectLow =
    /guess\s*<\s*(secret_number|target)[\s\S]{0,80}(Too low|higher|increase)/i.test(
      code,
    )
  const hasCorrectHigh =
    /guess\s*>\s*(secret_number|target)[\s\S]{0,80}(Too high|lower|decrease)/i.test(
      code,
    )
  const hasInvertedLogic =
    /guess\s*>\s*(secret_number|target)[\s\S]{0,80}Too low/i.test(code)

  const bug1Passed = hasFixedRange && !hasBuggy99Range
  const bug2Passed = hasFixedConversion
  const bug3Passed = (hasCorrectLow || hasCorrectHigh) && !hasInvertedLogic

  const details: ValidationDetail[] = [
    {
      title: 'Bug 1: Correct Upper Range Bound',
      passed: bug1Passed,
      description: 'Random secret number upper bound corrected to 100 (inclusive).',
    },
    {
      title: 'Bug 2: Integer Type Conversion',
      passed: bug2Passed,
      description: 'User input converted to int() before numeric comparisons.',
    },
    {
      title: 'Bug 3: Comparison Direction Fix',
      passed: bug3Passed,
      description: 'Too high / too low branches match the numerical comparison conditions.',
    },
  ]

  const allPassed = details.every((d) => d.passed)

  return {
    success: allPassed,
    message: allPassed
      ? 'Debugging Challenge Completed! All program errors have been identified and resolved.'
      : 'Debugging Incomplete. Some bugs remain in the code. Inspect the checklist below.',
    details,
  }
}

export function getValidatorForStage(
  stageId: CodingStageId,
): (
  code: string,
  outputs: readonly TerminalLine[],
) => Promise<ValidationResult> | ValidationResult {
  switch (stageId) {
    case 'part-1':
      return validatePart1
    case 'part-2':
      return validatePart2
    case 'debugging':
      return validateStage3Debugging
  }
}
