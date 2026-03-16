type PlayerCharacterProps = {
  name: string
  sprite: string
  isAttacking?: boolean
}

export default function PlayerCharacter({ name, sprite, isAttacking }: PlayerCharacterProps) {
  return (
    <div className={`flex flex-col items-center transition-transform duration-200 ${isAttacking ? "-translate-x-16 scale-110" : "translate-x-0"}`}>

      <p className="text-white font-semibold text-lg drop-shadow mb-2">
        {name}
      </p>

      <img
        src={sprite}
        alt={name}
        className={`w-32 select-none pointer-events-none scale-x-[-1] ${isAttacking ? "brightness-125" : ""}`}
      />

    </div>
  )
}