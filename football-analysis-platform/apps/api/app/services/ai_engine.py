import numpy as np
from scipy.stats import poisson

class AIEngine:
    def __init__(self):
        self.league_avg_home_goals = 1.5
        self.league_avg_away_goals = 1.2

    def calculate_momentum_score(self, form_str: str):
        """ แปลงฟอร์มเป็นคะแนน (Return native float) """
        if not form_str or form_str == "-----": 
            return 1.0 

        score = 0
        for char in form_str[-5:]:
            if char == 'W': score += 3
            elif char == 'D': score += 1
        
        factor = 0.85 + (score * 0.02)
        return float(factor)

    def check_outcome(self, advice: str, home_score: int, away_score: int):
        advice = advice.upper()
        if "HOME WIN" in advice: return "Win" if home_score > away_score else "Loss"
        if "AWAY WIN" in advice: return "Win" if away_score > home_score else "Loss"
        if "DRAW" in advice: return "Win" if home_score == away_score else "Loss"
        if "OVER" in advice:
            try:
                line = float(advice.split("OVER")[-1].strip())
                return "Win" if (home_score + away_score) > line else "Loss"
            except: pass
        if "UNDER" in advice:
            try:
                line = float(advice.split("UNDER")[-1].strip())
                return "Win" if (home_score + away_score) < line else "Loss"
            except: pass
        return "N/A"

    def calculate_expected_goals(self, home_attack, away_defense, away_attack, home_defense):
        home_lambda = home_attack * away_defense * self.league_avg_home_goals
        away_lambda = away_attack * home_defense * self.league_avg_away_goals
        return float(home_lambda), float(away_lambda)

    def predict_match(self, match_data, real_odds=None, injuries=None, lineups=None):
        home_team = match_data['home_team']
        away_team = match_data['away_team']
        home_stats = match_data['home_stats'].copy()
        away_stats = match_data['away_stats'].copy()

        # 🔥 1. Momentum Analysis
        home_form = home_stats.get("form", "-----")
        away_form = away_stats.get("form", "-----")
        
        home_momentum = self.calculate_momentum_score(home_form)
        away_momentum = self.calculate_momentum_score(away_form)
        
        home_stats['attack'] = float(home_stats['attack'] * home_momentum)
        away_stats['attack'] = float(away_stats['attack'] * away_momentum)
        
        momentum_insight = ""
        if home_momentum > 1.1 and away_momentum < 0.95:
            momentum_insight = f"{home_team} is on fire ({home_form}) vs poor form away."
        elif away_momentum > 1.1 and home_momentum < 0.95:
            momentum_insight = f"{away_team} has strong momentum ({away_form})."

        # 🛡️ 2. Injury Impact
        if injuries:
            home_injuries = [i for i in injuries if i['team']['id'] == match_data['home_id']]
            away_injuries = [i for i in injuries if i['team']['id'] == match_data['away_id']]
            
            home_stats['attack'] *= max(0.85, 1 - (len(home_injuries) * 0.03))
            away_stats['attack'] *= max(0.85, 1 - (len(away_injuries) * 0.03))
            
            home_stats['attack'] = float(home_stats['attack'])
            away_stats['attack'] = float(away_stats['attack'])

        # 📋 3. Lineup Impact
        lineup_insight = ""
        if lineups:
            try:
                home_formation = lineups[0].get('formation', 'N/A')
                away_formation = lineups[1].get('formation', 'N/A')
                lineup_insight = f"Tactics: {home_formation} vs {away_formation}"
                if home_formation and home_formation.startswith('5'): 
                    home_stats['defense'] = float(home_stats['defense'] * 0.9)
            except: pass

        # 4. คำนวณความน่าจะเป็น (Poisson)
        home_lambda, away_lambda = self.calculate_expected_goals(
            home_stats['attack'], away_stats['defense'],
            away_stats['attack'], home_stats['defense']
        )
        home_lambda = float(home_lambda * 1.1) # Home Advantage

        # 🔥 5. First Half Analysis
        ht_factor = 0.45 
        ht_home_lambda = home_lambda * ht_factor
        ht_away_lambda = away_lambda * ht_factor
        
        total_ht_lambda = ht_home_lambda + ht_away_lambda
        prob_0_goal_ht = poisson.pmf(0, total_ht_lambda)
        prob_goal_ht = (1 - prob_0_goal_ht) * 100 

        # ⚠️ ปรับ Threshold ลงเหลือ 50% เพื่อทดสอบ
        threshold = 50.0 
        is_high_chance = prob_goal_ht > threshold
        
        # 🖨️ Print Debug: ดูใน Terminal ว่าคู่ไหนได้กี่ %
        print(f"DEBUG 1H: {home_team} vs {away_team} -> {prob_goal_ht:.1f}% (Pass: {is_high_chance})")

        ht_analysis = {
            "has_value": bool(is_high_chance), 
            "probability": float(round(prob_goal_ht, 1)),
            "text": "High Chance" if prob_goal_ht > 65 else "Moderate Chance"
        }

        # 6. Full Match Simulation & Odds Analysis
        max_goals = 10
        home_probs = [poisson.pmf(i, home_lambda) for i in range(max_goals)]
        away_probs = [poisson.pmf(i, away_lambda) for i in range(max_goals)]

        home_win_prob = 0.0
        draw_prob = 0.0
        away_win_prob = 0.0
        over_2_5_prob = 0.0
        diff_probs = {}

        for i in range(max_goals):
            for j in range(max_goals):
                prob = float(home_probs[i] * away_probs[j])
                if i > j: home_win_prob += prob
                elif i == j: draw_prob += prob
                else: away_win_prob += prob
                
                if (i + j) > 2.5: over_2_5_prob += prob
                diff = i - j
                diff_probs[diff] = diff_probs.get(diff, 0.0) + prob

        # 7. AI Decision Making
        advice = "No Advice"
        confidence = "Low"
        
        # 7.1 Handicap / Winner
        hdp_text = "N/A"
        hdp_diff = float(home_lambda - away_lambda)
        
        if real_odds and real_odds.get("handicap"):
            line = float(real_odds["handicap"]["line"])
            prob_cover = sum(p for d, p in diff_probs.items() if d + line > 0) * 100
            
            if prob_cover > 65:
                advice = f"HANDICAP: {home_team} {line}"
                confidence = "High"
                hdp_text = f"Bet: {home_team} {line} ({prob_cover:.1f}%)"
            elif prob_cover < 35:
                advice = f"HANDICAP: {away_team} {-line}"
                confidence = "High"
                hdp_text = f"Bet: {away_team} {-line} ({100-prob_cover:.1f}%)"
            else:
                hdp_text = f"Skipped Line {line}"
        else:
            if hdp_diff > 1.2: hdp_text = f"{home_team} -1.0 (Stats)"
            elif hdp_diff > 0.5: hdp_text = f"{home_team} -0.5 (Stats)"
            elif hdp_diff < -1.2: hdp_text = f"{away_team} -1.0 (Stats)"
            elif hdp_diff < -0.5: hdp_text = f"{away_team} -0.5 (Stats)"
            else: hdp_text = "0.0 (Level)"

        # 7.2 Over/Under
        target_line = 2.5
        if real_odds and real_odds.get("over_under"):
            target_line = float(real_odds["over_under"]["line"])
        
        prob_over_line = 0.0
        for i in range(max_goals):
            for j in range(max_goals):
                if (i + j) > target_line:
                    prob_over_line += float(home_probs[i] * away_probs[j])
        
        ou_prob_pct = prob_over_line * 100
        ou_text = f"Over {target_line}: {ou_prob_pct:.1f}%"

        if ou_prob_pct > 60:
            if confidence == "Low": 
                advice = f"GOAL: OVER {target_line}"
                confidence = "Medium"
        elif ou_prob_pct < 40:
             if confidence == "Low":
                advice = f"GOAL: UNDER {target_line}"
                confidence = "Medium"

        return {
            "teams": f"{home_team} vs {away_team}",
            "probabilities": {
                "home_win": float(round(home_win_prob * 100, 1)),
                "draw": float(round(draw_prob * 100, 1)),
                "away_win": float(round(away_win_prob * 100, 1))
            },
            "first_half_analysis": ht_analysis,
            "expected_score": f"{round(home_lambda)} - {round(away_lambda)}",
            "goals_market": {
                "over_2_5": float(round(over_2_5_prob * 100, 1)),
                "real_line": float(target_line),
                "probability": float(round(ou_prob_pct, 1)),
                "analysis": ou_text
            },
            "handicap_market": {
                "suggested_line": hdp_text,
                "expected_goal_diff": float(round(hdp_diff, 2))
            },
            "ai_insight": {
                "main_pick": advice,
                "confidence": confidence,
                "momentum_analysis": momentum_insight,
                "lineup_analysis": lineup_insight
            },
            "form_analysis": {
                "home": home_form,
                "away": away_form
            }
        }