from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base
from pydantic import BaseModel
from typing import Optional, List, Union, Dict

# ==========================================
# 🗄️ Database Models (SQLAlchemy)
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) 
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ==========================================
# 🚀 Pydantic Models (Schemas)
# ==========================================

# --- Basic Models ---

class Team(BaseModel):
    id: int
    name: str
    logo: str

class League(BaseModel):
    id: int
    name: str
    logo: str
    flag: Optional[str] = None
    season: int

class Match(BaseModel):
    id: int
    home_team: str
    away_team: str
    home_logo: Optional[str] = None
    away_logo: Optional[str] = None
    league: str
    league_logo: Optional[str] = None
    kickoff_time: str
    status: str
    home_stats: Optional[Dict] = None
    away_stats: Optional[Dict] = None

# --- Analysis Models ---

class Probabilities(BaseModel):
    home_win: float
    draw: float
    away_win: float

# 🔥 [จุดสำคัญ] ต้องมี Model นี้
class FirstHalfAnalysis(BaseModel):
    has_value: bool
    probability: float
    text: str

class GoalsMarket(BaseModel):
    over_2_5: float
    real_line: float
    probability: float
    analysis: str

class HandicapMarket(BaseModel):
    suggested_line: str
    expected_goal_diff: float

class AIInsight(BaseModel):
    main_pick: str
    confidence: str
    momentum_analysis: Optional[str] = ""
    lineup_analysis: Optional[str] = ""

class FormAnalysis(BaseModel):
    home: str
    away: str

class PredictionResponse(BaseModel):
    teams: str
    probabilities: Probabilities
    
    # 🔥 [จุดสำคัญ] ต้องมี Field นี้ เพื่อให้ข้อมูลส่งออกไปได้
    first_half_analysis: Optional[FirstHalfAnalysis] = None
    
    expected_score: str
    goals_market: GoalsMarket
    handicap_market: HandicapMarket
    ai_insight: AIInsight
    form_analysis: Optional[FormAnalysis] = None

class AnalysisResponse(BaseModel):
    match: Match
    prediction: PredictionResponse