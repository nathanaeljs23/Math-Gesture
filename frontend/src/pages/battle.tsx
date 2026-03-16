import { useState, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom" // Added for navigation
import HandCamera from "../components/handcamera"
import { GameController } from "../game/gameController"
import GameUI from "../components/GameUI"
import PlayerCharacterLeft from "../components/playermodelleft"
import PlayerCharacterRight from "../components/playermodelright"
import Boss from "../components/centipede"
import BossHealthBar from "../components/healthbar"
import red from "../assets/red.png"
import blue from "../assets/blue.png"
import green from "../assets/green.png"
import pink from "../assets/pink.png"
import cave from "../assets/cavebg.png"
import AttackEffect from "../components/AttackEffect"
import DamageLog from "../components/damageLog"

import { socket } from "../network/socket"

const TEST_PIN = "1234" 

export default function Battle() {
  const navigate = useNavigate() // Initialize navigation
  const gameRef = useRef(new GameController())
  const roomDataRef = useRef<any>(null)
  
  const [state, setState] = useState<any>(null)
  const [damageLog, setDamageLog] = useState<any[]>([])
  const [roomData, setRoomData] = useState<any>(null)
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null)

  // Sync Ref for socket listeners
  useEffect(() => {
    roomDataRef.current = roomData

    // NAVIGATION LOGIC: Move to Map when monster dies
    if (roomData && roomData.status === "playing" && roomData.shared_monster_hp <= 0) {
      console.log("Monster defeated! Navigating to Map...")
      
      // Short timeout so players can see the 0 HP/final attack animation
      const timer = setTimeout(() => {
        navigate("/Map")
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [roomData, navigate])

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    socket.on("connect", () => {
      socket.emit("join_room", { nickname: "calvin", pin: TEST_PIN })
    })

    socket.on("error", (err) => console.error("Socket Error:", err))

    socket.on("lobby_updated", (data) => {
      setRoomData(data)
      if (data.status === "lobby") {
        socket.emit("start_game", { pin: TEST_PIN })
      }
    })

    socket.on("game_started", (data) => {
      setRoomData(data)
      const firstState = gameRef.current.update(0)
      setState(firstState)
    })
    
    socket.on("monster_damaged", (data) => {
      setRoomData((prev: any) => {
        if (!prev) return prev;
        return { ...prev, shared_monster_hp: data.shared_monster_hp };
      })

      setActiveAttackerId(data.player_id);
      setTimeout(() => setActiveAttackerId(null), 800);

      const attackerNickname = roomDataRef.current?.players?.[data.player_id]?.nickname || "Someone";
      const damageDealt = data.damage || 10;
      const id = Date.now();

      setDamageLog(prev => [
        { id, text: `${attackerNickname} just did ${damageDealt} damage!` }, 
        ...prev
      ].slice(0, 3));

      setTimeout(() => setDamageLog(prev => prev.filter(e => e.id !== id)), 5000);
    })

    return () => {
      socket.off("connect");
      socket.off("error");
      socket.off("lobby_updated"); 
      socket.off("game_started"); 
      socket.off("monster_damaged")
      socket.disconnect()
    }
  }, [])

  const handleNumber = useCallback((num: number) => {
    if (roomData?.status !== "playing" || (roomData?.shared_monster_hp ?? 0) <= 0) return;
    
    const newState = gameRef.current.update(num)
    if (newState.event === "attack") {
      socket.emit("damage_monster", { pin: TEST_PIN.toString(), damage: 10 })
    }
    setState(newState)
  }, [roomData])

  const players = roomData?.players ? Object.values(roomData.players) : []
  const isPlaying = roomData?.status === "playing"

  const leftColPlayers = [0, 2].map(i => players[i]).filter(Boolean).length;
  const rightColPlayers = [1, 3].map(i => players[i]).filter(Boolean).length;

  return (
    <div className="relative w-screen h-screen bg-cover bg-center bg-no-repeat overflow-hidden" 
          style={{ backgroundImage: `url(${cave})`}}>

      <DamageLog entries={damageLog} />
      
      {state ? (
        <GameUI state={state} />
      ) : (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-white text-2xl font-bold bg-black/50 p-4 rounded z-50">
          Show your hands in the camera...
        </div>
      )}
      
      <div className="absolute top-0 right-0 w-120 bg-black/60 p-2 rounded-lg z-50">
        <HandCamera onNumberDetected={handleNumber} />
      </div>

      <AttackEffect trigger={state?.event === "attack"} />

      {/* BOSS CONTAINER */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-10 pointer-events-none">
          <BossHealthBar hp={roomData?.shared_monster_hp ?? 200} maxHp={roomData?.shared_monster_max_hp ?? 250} />
          <Boss isHit={state?.event === "attack"} />
      </div>

      {/* PLAYER BATTLEFIELD */}
      <div className="absolute top-[55%] left-0 w-full -translate-y-1/2 h-[40vh] pointer-events-none">
        
        {/* LEFT PLAYERS */}
        <div className={`absolute left-[15%] h-full flex flex-col-reverse items-center gap-6 transition-all duration-500
          ${leftColPlayers === 1 ? 'justify-center' : 'justify-end'}`}>
          {[0, 2].map((index) => {
            const p: any = players[index];
            if (p) return <PlayerCharacterLeft key={p.session_id} name={p.nickname} sprite={index === 0 ? red : pink} isAttacking={activeAttackerId === p.session_id} />;
            return !isPlaying ? <PlayerCharacterLeft key={`empty-${index}`} name="Waiting..." sprite={index === 0 ? red : pink} /> : null;
          })}
        </div>

        {/* RIGHT PLAYERS */}
        <div className={`absolute right-[15%] h-full flex flex-col-reverse items-center gap-6 transition-all duration-500
          ${rightColPlayers === 1 ? 'justify-center' : 'justify-end'}`}>
          {[1, 3].map((index) => {
            const p: any = players[index];
            if (p) return <PlayerCharacterRight key={p.session_id} name={p.nickname} sprite={index === 1 ? blue : green} isAttacking={activeAttackerId === p.session_id} />;
            return !isPlaying ? <PlayerCharacterRight key={`empty-${index}`} name="Waiting..." sprite={index === 1 ? blue : green} /> : null;
          })}
        </div>

      </div>
    </div>
  )
}