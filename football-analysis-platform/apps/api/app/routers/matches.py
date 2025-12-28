from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.football_data import FootballDataService
from app.services.ai_engine import AIEngine
from app.routers.auth import get_current_user
from app.models import User

router = APIRouter()
football_service = FootballDataService()
ai_engine = AIEngine()

@router.get("/")
def get_matches():
    return football_service.get_upcoming_matches()

@router.get("/{match_id}/analyze")
def analyze_match(
    match_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. ดึงข้อมูลแมตช์พื้นฐาน
    match_data = football_service.get_match_by_id(match_id)
    if not match_data:
        raise HTTPException(status_code=404, detail="Match not found")

    # 2. ดึงราคา Odds จริงจาก API (Bet365)
    real_odds = football_service.get_match_odds(match_id)

    # 3. 🔥 ดึงข้อมูลผู้เล่นบาดเจ็บ (Injuries) และ ไลน์อัป (Lineups)
    injuries = football_service.get_match_injuries(match_id)
    lineups = football_service.get_match_lineups(match_id)

    # 4. 🔥 ส่งข้อมูลทั้งหมดเข้าไปให้ AI ประมวลผล (รวมถึงตัวผู้เล่นด้วย)
    try:
        ai_analysis = ai_engine.predict_match(
            match_data, 
            real_odds=real_odds,
            injuries=injuries,
            lineups=lineups
        )
    except Exception as e:
        print(f"AI Logic Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Calculation failed: {str(e)}")

    # 5. ดึงข้อมูลสถิติการเจอกัน (H2H)
    h2h_stats = []
    if "home_id" in match_data and "away_id" in match_data:
        h2h_stats = football_service.get_head_to_head(
            match_data["home_id"], 
            match_data["away_id"]
        )

    # 6. ส่ง Data ทั้งหมดกลับไปที่ Frontend
    return {
        "match_info": match_data,
        "is_locked": False,
        "ai_analysis": ai_analysis,
        "history": h2h_stats,
        "injuries": injuries,   # ส่งไปโชว์ที่หน้าเว็บด้วย
        "lineups": lineups,     # ส่งไปโชว์ที่หน้าเว็บด้วย
        "real_odds_debug": real_odds
    }