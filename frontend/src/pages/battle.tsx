import { useState } from "react"
import HandCamera from "../components/handcamera"
import { GameController } from "../game/gameController"
import GameUI from "../components/GameUI"
import PlayerCharacter from "../components/playermodel"
import red from "../assets/red.png"
import blue from "../assets/blue.png"
import green from "../assets/green.png" 
import pink from "../assets/pink.png"
import { useCallback } from "react"

const game = new GameController()

export default function Battle() {

  const [state, setState] = useState<any>(null)

  const handleNumber = useCallback((num: number) => {
     const newState = game.update(num)
     setState(newState)
  }, [])

  return (
    <div className="relative w-screen h-screen">

      <PlayerCharacter
        name="calvin"
        sprite={red}
        className="absolute left-32 bottom-48"
      />

      <PlayerCharacter
        name="alex"
        sprite={blue}
        className="absolute left-32 bottom-12"
      />

      <PlayerCharacter
        name="nael"
        sprite={pink}
        className="absolute right-32 bottom-48"
      />

      <PlayerCharacter
        name="nick"
        sprite={green}
        className="absolute right-32 bottom-12"
      />

	    <HandCamera onNumberDetected={handleNumber} />

      {state && <GameUI state={state} />}

    </div>
  )
}