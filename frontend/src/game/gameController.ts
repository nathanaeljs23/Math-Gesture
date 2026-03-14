import { generateQuestion } from "./questionGenerator"
import { HoldDetector } from "./holdDetector"
import type { Question } from "./questionGenerator"
export class GameController {

  private holdDetector = new HoldDetector(2000)

  private question: Question = generateQuestion()

  private lastLocked = false

  private result: "correct" | "wrong" | null = null

  private feedbackEnd = 0

  getQuestion() {
    return this.question
  }

  update(number: number | null) {

  const now = performance.now()

  const hold = this.holdDetector.update(number)

  if (hold.locked && !this.lastLocked) {

    if (hold.number === this.question.answer) {
      this.result = "correct"
    } else {
      this.result = "wrong"
    }

    // keep feedback visible for 700ms
    this.feedbackEnd = now + 700
  }

  if (this.result && now > this.feedbackEnd) {
    this.result = null
    this.question = generateQuestion()
  }

  this.lastLocked = hold.locked

  return {
    holdProgress: hold.progress,
    currentNumber: hold.number,
    locked: hold.locked,
    result: this.result,
    question: this.question
  }
}
}