import { describe, expect, it } from 'vitest'
import {
  checkBasicPythonSyntax,
  validatePart1,
  validatePart2,
  validateStage3Debugging,
} from './stageValidator'

describe('stageValidator', () => {
  describe('checkBasicPythonSyntax', () => {
    it('approves well-formed Python code', () => {
      const code = `
import random
x = [1, 2, 3]
d = {"key": (4 + 5)}
print("Hello world")
`
      expect(checkBasicPythonSyntax(code).valid).toBe(true)
    })

    it('rejects unclosed brackets or unmatched parentheses', () => {
      const code = 'total = (1 + 2'
      const result = checkBasicPythonSyntax(code)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unclosed bracket')
    })

    it('rejects unmatched closing parentheses', () => {
      const code = 'total = [1, 2])'
      const result = checkBasicPythonSyntax(code)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unmatched')
    })
  })

  describe('validatePart1', () => {
    it('passes on valid Stage 1 implementation', () => {
      const code = `
import random

target = random.randint(1, 100)
user_input = input("Enter your guess: ")

if user_input.isdigit():
    guess = int(user_input)
    print(f"Valid: {guess}")
else:
    print("Invalid digits")
`
      const result = validatePart1(code, [])
      expect(result.success).toBe(true)
      expect(result.details?.every((d) => d.passed)).toBe(true)
    })

    it('fails when user input prompt is missing', () => {
      const code = `
import random
target = random.randint(1, 100)
# missing input()
`
      const result = validatePart1(code, [])
      expect(result.success).toBe(false)
    })
  })

  describe('validatePart2', () => {
    it('passes on complete game loop with comparison branches', () => {
      const code = `
import random
target = random.randint(1, 100)
attempts = 0

while True:
    val = input("Guess: ")
    if not val.isdigit():
        continue
    guess = int(val)
    attempts += 1
    if guess < target:
        print("Too low! Try higher.")
    elif guess > target:
        print("Too high! Try lower.")
    else:
        print(f"Congratulations! Guessed in {attempts} attempts!")
        break
`
      const result = validatePart2(code, [])
      expect(result.success).toBe(true)
      expect(result.details?.every((d) => d.passed)).toBe(true)
    })

    it('fails when game loop is missing', () => {
      const code = `
import random
target = 50
guess = int(input("Guess: "))
print("Only one guess")
`
      const result = validatePart2(code, [])
      expect(result.success).toBe(false)
    })
  })

  describe('validateStage3Debugging', () => {
    it('detects uncorrected bugs in buggy starter code', () => {
      const buggyCode = `
import random
def play():
    secret_number = random.randint(1, 99) # BUG 1
    attempts = 0
    while True:
        raw = input("Guess: ")
        guess = raw # BUG 2
        attempts += 1
        if guess > secret_number: # BUG 3
            print("Too low! Try higher.")
        elif guess < secret_number:
            print("Too high! Try lower.")
        else:
            break
`
      const result = validateStage3Debugging(buggyCode, [])
      expect(result.success).toBe(false)
    })

    it('passes when all three bugs are corrected', () => {
      const fixedCode = `
import random
def play():
    secret_number = random.randint(1, 100) # FIXED 1
    attempts = 0
    while True:
        raw = input("Guess: ")
        if not raw.isdigit():
            continue
        guess = int(raw) # FIXED 2
        attempts += 1
        if guess < secret_number: # FIXED 3
            print("Too low! Try higher.")
        elif guess > secret_number:
            print("Too high! Try lower.")
        else:
            print("Correct!")
            break
`
      const result = validateStage3Debugging(fixedCode, [])
      expect(result.success).toBe(true)
      expect(result.details?.every((d) => d.passed)).toBe(true)
    })
  })
})
