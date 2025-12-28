from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.football_data import FootballDataService
from app.services.ai_engine import AIEngine
from app.routers.auth import get_current_user
from app.models import User, AnalysisResponse

router = APIRouter()
football_service = FootballDataService()
ai_engine = AIEngine()

@router.get("/{match_id}/analyze", response_model=AnalysisResponse)
def analyze_match(
    match_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match_data = football_service.get_match_by_id(match_id)
    if not match_data:
        raise HTTPException(status_code=404, detail="Match not found")

    # เรียก AI คำนวณ (ซึ่ง ai_engine ตัวใหม่มี first_half_analysis แล้ว)
    ai_res = ai_engine.predict_match(match_data)
    
    return {
        "match": match_data,
        "prediction": {
            "teams": ai_res["teams"],
            "advice": ai_res["ai_insight"]["main_pick"], # 🔥 ต้องมีเพื่อให้หน้าบ้านดึงไปโชว์
            "probabilities": ai_res["probabilities"],
            "first_half_analysis": ai_res.get("first_half_analysis"), 
            "expected_score": ai_res["expected_score"],
            "goals_market": ai_res["goals_market"],
            "handicap_market": ai_res["handicap_market"],
            "ai_insight": ai_res["ai_insight"],
            "form_analysis": ai_res.get("form_analysis")
        }
    }