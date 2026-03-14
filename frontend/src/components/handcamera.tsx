import { useRef, useEffect } from "react"
import { initHandTracker } from "../vision/handTracker"
import { countFingers } from "../vision/fingerCounter"
import { FingerStabilizer } from "../vision/fingerStabilizer"

type Props = {
  onNumberDetected: (num: number) => void
}

const stabilizers = [
  new FingerStabilizer(5),
  new FingerStabilizer(5)
]

export default function HandCamera({ onNumberDetected }: Props) {

  const videoRef = useRef<HTMLVideoElement | null>(null)

  // store latest callback without restarting camera
  const callbackRef = useRef(onNumberDetected)

  useEffect(() => {
    callbackRef.current = onNumberDetected
  }, [onNumberDetected])

  useEffect(() => {
    if (!videoRef.current) return

    const handleResults = (results: any) => {

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        stabilizers.forEach(s => s.reset?.())
        return
      }

      let total = 0
      let detectedHands = 0

      results.multiHandLandmarks.forEach((hand: any, i: number) => {

        const handedness = results.multiHandedness?.[i]?.label

        const fingers = countFingers(hand, handedness)

        const stable = stabilizers[i]?.update(fingers)

        if (stable !== null) {
          total += stable
          detectedHands++
        }

      })

      if (detectedHands > 0) {
        callbackRef.current(total)
      }

    }

    initHandTracker(videoRef.current, handleResults)

  }, []) // run only once

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: "640px", transform: "scaleX(-1)" }}
    />
  )
}