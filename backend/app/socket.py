import socketio
import asyncio
import random
import string
from app.models import Room, Player
from app.state import active_rooms

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

def generate_pin(length=4):
    return ''.join(random.choices(string.digits, k=length))

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    
@sio.event
async def disconnect(sid, environ):
    print(f"Client disconnected: {sid}")
    room_to_delete = None
    for pin, room in active_rooms.items():
        if sid in room.players:
            if room.creator_session_id == sid:
                room_to_delete = pin
            else:
                del room.players[sid]
                await sio.emit("player_left", {"session_id": sid}, room=pin)
            break
        
    if room_to_delete:
        await sio.emit("room_closed", {"reason": "Creator Disconnected"}, room=room_to_delete)
        del active_rooms[room_to_delete]
        print(f"Room {room_to_delete} destroyed because creator left.")
            
@sio.event
async def create_room(sid,data):
    """
    Expected data from client: {"nickname": "Player1", "time_limit_seconds": 180}
    """
    nickname = data.get("nickname", "Host")
    time_limit = data.get("time_limit_seconds", 300)
    
    pin = generate_pin()
    while pin in active_rooms:
        pin = generate_pin()
        
    host_player = Player(session_id = sid, nickname=nickname)
    
    new_room = Room(
        pin = pin,
        time_limit_seconds=time_limit,
        time_remaining=time_limit,
        creator_session_id=sid,
        players={sid:host_player},
    )
    active_rooms[pin] = new_room
    sio.enter_room(sid, pin)
    await sio.emit("room_created", new_room.model_dump(), to=sid)
    print(f"Room {pin} created by {nickname} ({sid})")
    
@sio.event
async def join_room(sid, data):
    """
    Expected data from client: {"nickname": "Player2", "pin": "ABCD"}
    """
    nickname = data.get("nickname", "Guest")
    pin = data.get("pin", "").upper()
    
    if pin not in active_rooms:
        await sio.emit("error", {"message": "Room not found"}, to=sid)
        return
    room = active_rooms[pin]
    if room.status != 'lobby':
        await sio.emit("error", {"message": "Game has already started"}, to=sid)
        return
    if len(room.players) >= 4:
        await sio.emit("error", {"message": "Room is full (Max 4 Players)"}, to=sid)
        return
    new_player = Player(session_id=sid, nickname=nickname)
    room.players[sid] = new_player
    
    sio.enter_room(sid,pin)
    
    await sio.emit("lobby_updated", room.model_dump(), room=pin)
    print(f"{nickname} ({sid}) joined room {pin}")
    
async def game_timer_task(pin:str):
    room = active_rooms.get(pin)
    while room and room.status == "playing" and room.time_remaining > 0:
        await asyncio.sleep(1)
        
        room.time_remaining -= 1
        await sio.emit("timer_tick", {"time_remaining": room.time_remaining}, room=pin)
        
    if room and room.status == "playing" and room.time_remaining <= 0:
        print(f"Time's up for room {pin}")
        await end_game(pin, reason = "time_up")
        
@sio.event
async def start_game(sid, data):
    pin = data.get("pin", "").upper()
    if pin not in active_rooms:
        await sio.emit("error", {"message": "Room not found"}, to=sid)
        return
    
    room = active_rooms[pin]
    
    if room.creator_session_id != sid:
        await sio.emit("error", {"message": "only the creator can start the game."}, to=sid)
        return
    if room.status != "lobby":
        await sio.emit("error", {"message": "Game has already started."}, to=sid)
        return
    room.status = "playing"
    
    player_count = len(room.players)
    
    room.shared_monster_max_hp = 50 * player_count
    room.shared_monster_hp = room.shared_monster_max_hp
    room.current_stage = 1
    
    print(f"Game started in room {pin}! Stage 1 HP set to {room.shared_monster_max_hp}")
    
    await sio.emit("game_started", room.model_dump(), room=pin)
    
    sio.start_background_task(game_timer_task, pin)
    
async def end_game(pin:str, reason:str):
    room = active_rooms.get(pin)
    if not room:
        return
    room.status = "finished"
    
    leaderboard = sorted(
        [player.model_dump() for player in room.players.values()],
        key = lambda x : x["score"],
        reverse=True
    )
    await sio.emit("game_over",{
        "reason": reason,
        "leaderboard": leaderboard,
    }, room=pin)
    print(f"Game over in room {pin}. Reason: {reason}")
    
async def advance_stage(pin:str):
    room = active_rooms.get(pin)
    if not room:
        return
    if room.current_stage>=5:
        print(f"Room {pin} cleared all 5 stages!")
        await end_game(pin,reason="victory")
        return
    
    room.current_stage +=1
    player_count = len(room.players)
    
    room.shared_monster_max_hp = 50 * player_count * room.current_stage
    room.shared_monster_hp = room.shared_monster_max_hp
    
    print(f"Room {pin} advanced to Stage {room.current_stage}! New HP: {room.shared_monster_max_hp}")
    await sio.emit("stage_advanced", room.model_dump(), room=pin)
    
@sio.event
async def damage_monster(sid, data):
    """
    Expected data from client: {"pin": "ABCD", "damage": 1}
    """
    pin = data.get("pin", "").upper()
    damage = data.get("damage",1)
    if pin not in active_rooms:
        return
    room = active_rooms[pin]
    
    if room.status != "playing":
        return
    
    if room.shared_monster_hp <= 0:
        return
    
    room.shared_monster_hp -=damage
    room.players[sid].score +=damage
    
    if room.shared_monster_hp <= 0:
        room.shared_monster_hp = 0
        await advance_stage(pin)
    else:
        await sio.emit("monster_damaged",{
            "shared_monster_hp": room.shared_monster_hp,
            "player_id": sid,
            "new_score": room.players[sid].score
        },room=pin)