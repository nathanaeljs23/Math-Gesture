import { useEffect } from "react"

import confetti from "canvas-confetti"
import blue from "../assets/blue.png"
import red  from "../assets/red.png"
import pink from "../assets/pink.png"
import bg from "../assets/lobbybg.png"

const PLAYERS = [
  { name: "Calvin", sprite: blue, damage: 4290, rank: 2 },
  { name: "Alex",   sprite: red,  damage: 7590, rank: 1 },
  { name: "Nael",   sprite: pink, damage: 3850, rank: 3 },
]

const podiumOrder = [
  PLAYERS.find(p => p.rank === 2)!,
  PLAYERS.find(p => p.rank === 1)!,
  PLAYERS.find(p => p.rank === 3)!,
]

const PODIUM_H: Record<number, string> = {
  1: "52vh",
  2: "42vh",
  3: "34vh",
}

const SPRITE_H: Record<number, number> = {
  1: 110,
  2: 80,
  3: 72,
}

export default function Results() {
  const time = "9:23.20" // pake real time dari game

  useEffect(() => {
    const colors = ["#ffd700", "#ff5e7e", "#26ccff", "#88ff5a", "#a25afd"]
    const end = Date.now() + 1500

    const frame = () => {
      if (Date.now() > end) return
      confetti({ particleCount: 3, angle: 60,  spread: 55, startVelocity: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 999 })
      confetti({ particleCount: 3, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.9 }, colors, zIndex: 999 })
      requestAnimationFrame(frame)
    }
    frame()
  }, [])

  return (
    <div style={{
      width: "100vw", height: "100vh",
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover", backgroundPosition: "center",
      position: "relative", overflow: "hidden",
      fontFamily: "'Poppins', sans-serif",
    }}>

      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

      <div style={{
        position: "absolute", top: "8%", left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center", zIndex: 10, width: "100%",
      }}>
        <div style={{ color: "#fff", fontSize: "clamp(20px, 3.5vw, 34px)", fontWeight: 400}}>
          You cleared the game in:
        </div>
        <div style={{ color: "#fff", fontSize: "clamp(28px, 5.5vw, 52px)", fontWeight: 600, lineHeight: 1.1 }}>
          {time}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 10,
      }}>
        {podiumOrder.map((player) => {
          const isFirst = player.rank === 1

          return (
            <div key={player.name} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              flex: 1, maxWidth: 220,
            }}>

              <img
                src={player.sprite}
                alt={player.name}
                style={{
                  height: SPRITE_H[player.rank],
                  width: "auto",
                  imageRendering: "pixelated",
                  marginBottom: -6,
                  zIndex: 2, position: "relative",
                }}
              />

              <div style={{
                background: "#fff",
                borderRadius: "14px 14px 0 0",
                width: "100%",
                height: PODIUM_H[player.rank],
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-start",
                paddingTop: 20,
                boxShadow: isFirst ? "0 -6px 24px rgba(255,215,0,0.35)" : "0 -2px 12px rgba(0,0,0,0.25)",
                borderTop: isFirst ? "4px solid #ffd700"
                  : player.rank === 2 ? "4px solid #c0c0c0"
                  : "4px solid #cd7f32",
              }}>
                <div style={{ fontSize: isFirst ? 50 : 35, fontWeight: 700, color: "#222", fontFamily: "'Pixelify Sans', sans-serif" }}>
                  {player.name}
                </div>
                <div style={{ fontSize: isFirst ? 50 : 35, fontWeight: 900, color: "#111", lineHeight: 1.1, marginTop: 8 }}>
                  {player.damage.toLocaleString()}
                </div>
                <div style={{ fontSize: 25, color: "#888", marginTop: 4 }}>
                  damage
                </div>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}