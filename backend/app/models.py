from pydantic import BaseModel, Field
from typing import Dict

class Player(BaseModel):
    session_id: str
    nickname: str
    score: int=0
    combo_multiplier: int=1
    
class Room(BaseModel):
    pin: str
    status: str="lobby"
    time_limit_seconds: int
    time_remaining: int
    creator_session_id: str
    
    players: Dict[str, Player] = Field(default_factory=dict)
    
    current_stage: int = 1
    shared_monster_hp: int=0
    shared_monster_max_hp: int=0