import { useState, useEffect } from "react"

import bg  from "../assets/lobbybg.png"
import lv1 from "../assets/castlebg.png"
import lv2 from "../assets/graveyardbg.png"
import lv3 from "../assets/terracebg.png"
import lv4 from "../assets/cavebg.png"
import lv5 from "../assets/throneroombg.png"

import p1 from "../assets/blue.png"
import p2 from "../assets/red.png"
import p3 from "../assets/green.png"
import p4 from "../assets/pink.png"

const LEVEL_IMAGES  = [lv1, lv2, lv3, lv4, lv5]
const PLAYER_IMAGES = [p1, p2, p3, p4]

const NODES = [
  { id: 1, x: 18, y: 63 },
  { id: 2, x: 35, y: 36 },
  { id: 3, x: 52, y: 63 },
  { id: 4, x: 68, y: 36 },
  { id: 5, x: 85, y: 63 },
]

const NODE_SIZE = 120  
const NODE_R    = NODE_SIZE / 2  

function getLinePoints(
  ax: number, ay: number,
  bx: number, by: number,
  gapPct: number, totalW: number, totalH: number
) {
  const apx = ax / 100 * totalW
  const apy = ay / 100 * totalH
  const bpx = bx / 100 * totalW
  const bpy = by / 100 * totalH
  const dx  = bpx - apx
  const dy  = bpy - apy
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux  = dx / len
  const uy  = dy / len
  const gap = NODE_R + 8  
  return {
    x1: `${ax + (ux * gap / totalW * 100)}%`,
    y1: `${ay + (uy * gap / totalH * 100)}%`,
    x2: `${bx - (ux * gap / totalW * 100)}%`,
    y2: `${by - (uy * gap / totalH * 100)}%`,
  }
}

export default function Map() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [countdown, setCountdown]       = useState(10)
  const [animating, setAnimating]       = useState(false)
  const [allDone, setAllDone]           = useState(false)
  const [playerXY, setPlayerXY]         = useState({ x: 18, y: 58 })

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { clearInterval(t); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  function animateToNext(fromLevel: number) {
    if (fromLevel > 5) {
      setAllDone(true)
      return
    }
    if (fromLevel === 5) {
      setCurrentLevel(6)
      setAllDone(true)
      return
    }
    setAnimating(true)
    const from  = NODES[fromLevel - 1]
    const to    = NODES[fromLevel]
    const start = performance.now()
    function step(now: number) {
      const p = Math.min((now - start) / 1200, 1)
      setPlayerXY({ x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p })
      if (p < 1) {
        requestAnimationFrame(step)
      } else {
        const next = fromLevel + 1
        setCurrentLevel(next)
        setAnimating(false)
        setTimeout(() => animateToNext(next), 800)
      }
    }
    requestAnimationFrame(step)
  }

  useEffect(() => {
    const delay = setTimeout(() => animateToNext(1), 1000)
    return () => clearTimeout(delay)
  }, [])

  const W = window.innerWidth
  const H = window.innerHeight

  return (
    <div style={{
      width: "100vw", height: "100vh",
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover", backgroundPosition: "center",
      position: "relative", overflow: "hidden",
      fontFamily: "Nunito, sans-serif"
    }}>

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />

      {/* Countdown */}
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", textAlign: "center", zIndex: 10 }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Next battle in...</div>
        <div style={{ color: "#fff", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{countdown}</div>
      </div>

      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 5, pointerEvents: "none" }}>
        {NODES.slice(0, -1).map((node, i) => {
          const next = NODES[i + 1]
          const done = i + 1 < currentLevel
          const pts  = getLinePoints(node.x, node.y, next.x, next.y, NODE_R, W, H)
          return (
            <line key={i}
              x1={pts.x1} y1={pts.y1}
              x2={pts.x2} y2={pts.y2}
              stroke={done ? "#00e676" : "rgba(255,255,255,0.85)"}
              strokeWidth="4"           
              strokeLinecap="round"     
           
            />
          )
        })}
      </svg>

      {/* Level nodes */}
      {NODES.map((node, i) => {
        const done   = i + 1 < currentLevel || (allDone && i + 1 === 5)
        const active = i + 1 === currentLevel && !allDone
        return (
          <div key={node.id} style={{
            position: "absolute",
            left: `${node.x}%`, top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
            width: NODE_SIZE, height: NODE_SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            border: `4px solid ${done ? "#00e676" : active ? "#fff" : "rgba(255,255,255,0.7)"}`,
            boxShadow: done
              ? "0 0 0 5px rgba(0,230,118,0.35)"
              : active ? "0 0 0 6px rgba(255,255,255,0.25)"
              : "none",
            zIndex: 10,
          }}>
            <img src={LEVEL_IMAGES[i]} alt={`lv${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />

            <span style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",   // ← tengah persis
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 22,                          // ← lebih besar
              fontWeight: 900,
              width: 36, height: 36,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i + 1}
            </span>
          </div>
        )
      })}

      <div style={{
        position: "absolute",
        left: `${playerXY.x}%`, top: `${playerXY.y}%`,
        transform: "translate(-50%, -200%)",
        display: "flex", gap: 6,
        zIndex: 20, pointerEvents: "none"
      }}>
        {PLAYER_IMAGES.map((img, i) => (
          <div key={i} style={{
            width: 44, height: 44,
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid #fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            background: "#222",
          }}>
            <img src={img} alt={`player${i + 1}`} style={{
              width: "100%",
              height: "160%",         
              objectFit: "cover",
              objectPosition: "top",   
              display: "block",
            }} />
          </div>
        ))}
      </div>

      {allDone && (
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 30, color: "#00e676", fontWeight: 900, fontSize: 18 }}>
          All levels complete!
        </div>
      )}

    </div>
  )
}