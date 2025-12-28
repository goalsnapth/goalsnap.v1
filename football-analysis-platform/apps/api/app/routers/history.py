from fastapi import APIRouter
from app.services.football_data import FootballDataService
from app.services.ai_engine import AIEngine

router = APIRouter()
football_service = FootballDataService()
ai_engine = AIEngine()

@router.get("/")
def get_history(date: str):
    # 1. ดึงแมตช์ที่จบแล้ว
    matches = football_service.get_history_matches(date)
    
    summary = {"win": 0, "loss": 0, "draw": 0, "total": 0}
    results = []
    
    for match in matches:
        # 2. ให้ AI วิเคราะห์แมตช์นี้ (Simulate Prediction)
        analysis = ai_engine.predict_match(match)
        main_pick = analysis["ai_insight"]["main_pick"]
        
        # 3. ตรวจคำตอบ (Check Result)
        outcome = "N/A"
        
        # ตรวจ Logic Over/Under
        if "GOAL" in main_pick:
            outcome = ai_engine.check_outcome(main_pick, match["score_home"], match["score_away"])
        
        # ตรวจ Logic Handicap (แบบ Manual Check เพื่อความชัวร์)
        elif "HANDICAP" in main_pick:
            # ดึง Line และ ทีมที่เชียร์ จาก analysis structure
            sugg = analysis["handicap_market"]["suggested_line"] # Ex: "Bet: Arsenal -0.5 (70%)"
            if "Bet:" in sugg:
                try:
                    parts = sugg.replace("Bet: ", "").split(" ")
                    team_name = parts[0]
                    line = float(parts[1])
                    
                    diff = match["score_home"] - match["score_away"]
                    
                    # ถ้าเชียร์ทีมเหย้า
                    if team_name == match["home_team"]:
                        if diff + line > 0: outcome = "Win"
                        elif diff + line == 0: outcome = "Push"
                        else: outcome = "Loss"
                    # ถ้าเชียร์ทีมเยือน
                    else:
                        # มุมมองทีมเยือน: ผลต่างต้องเป็นลบ (Away ชนะ) หรือบวกน้อยๆ
                        # วิธีคิด Asian Handicap: Score Away - Score Home + Line > 0
                        # หรือคิดง่ายๆ: ปรับ Line ให้เป็นมุมมอง Home แล้วเทียบ Diff
                        # แต่เพื่อความง่าย ใช้ Logic: (ScoreHome + Line) vs ScoreAway
                        if (match["score_away"] + line) > match["score_home"]: outcome = "Win" # Logic แบบง่าย
                        else: outcome = "Loss"
                except: pass

        # นับคะแนน
        if outcome == "Win": summary["win"] += 1
        elif outcome == "Loss": summary["loss"] += 1
        elif outcome == "Push": summary["draw"] += 1
        
        if outcome != "N/A": summary["total"] += 1
        
        results.append({
            "match": match,
            "prediction": main_pick,
            "outcome": outcome
        })
        
    return {
        "date": date,
        "summary": summary,
        "matches": results
    }