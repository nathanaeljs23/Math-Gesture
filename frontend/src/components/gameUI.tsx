type GameState = {
  question: {
    a: number
    b: number
    answer: number
  }
  currentNumber: number | null
  holdProgress: number
  result: "correct" | "wrong" | null
}

export default function GameUI({ state }: { state: GameState }) {

  const opacity = state.holdProgress

  let feedbackClass = ""

  if (state.result === "correct") {
    feedbackClass = "text-green-400 drop-shadow-[0_0_25px_rgba(74,222,128,0.9)]"
  }

  if (state.result === "wrong") {
    feedbackClass = "text-red-400 drop-shadow-[0_0_25px_rgba(248,113,113,0.9)]"
  }

  return (
    <div className="absolute inset-0 pointer-events-none text-black font-bold">

      {/* Question */}
      <div className="absolute top-10 w-full text-center text-5xl">
        {state.question.a} + {state.question.b}
      </div>

      {/* Player number */}
      <div
        className={`absolute bottom-28 w-full text-center text-9xl transition-all duration-200 ${feedbackClass}`}
        style={{ opacity }}
      >
        {state.currentNumber ?? ""}
      </div>

    </div>
  )
}