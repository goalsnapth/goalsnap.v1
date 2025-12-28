import os
import requests
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import pathlib

load_dotenv()

class FootballDataService:
    def __init__(self):
        self.api_key = os.getenv("RAPIDAPI_KEY")
        self.base_url = "https://v3.football.api-sports.io"
        
        # สร้างโฟลเดอร์สำหรับเก็บ Cache ถ้ายังไม่มี
        self.cache_dir = "data_cache"
        pathlib.Path(self.cache_dir).mkdir(parents=True, exist_ok=True)

        # ระยะเวลา Cache (วินาที)
        self.STATS_CACHE_DURATION = 86400  # 24 ชั่วโมง (สำหรับค่าพลังทีม)
        self.MATCHES_CACHE_DURATION = 1800 # 30 นาที (สำหรับตารางแข่ง)

        # โหลด team_stats จาก Cache ทั้งหมดเข้า Memory เพื่อความเร็ว
        self.team_stats = {}
        self._load_all_stats_from_disk()

    # --- 💾 Cache System Helper Methods ---

    def _get_cache_path(self, filename):
        return os.path.join(self.cache_dir, filename)

    def _load_json_cache(self, filename, duration):
        """ อ่านไฟล์ Cache ถ้าไม่หมดอายุ """
        filepath = self._get_cache_path(filename)
        if not os.path.exists(filepath):
            return None
        
        try:
            # เช็คเวลาแก้ไขไฟล์
            file_mod_time = os.path.getmtime(filepath)
            if time.time() - file_mod_time > duration:
                return None # หมดอายุ
            
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return None

    def _save_json_cache(self, filename, data):
        """ บันทึกข้อมูลลงไฟล์ """
        try:
            filepath = self._get_cache_path(filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ Failed to save cache {filename}: {e}")

    def _load_all_stats_from_disk(self):
        """ โหลด Stats ของทุกลีกที่เคยบันทึกไว้เข้าตัวแปร self.team_stats """
        # วิธีนี้ช่วยให้ Server Restart แล้วข้อมูลไม่หาย ไม่ต้องโหลดใหม่
        for filename in os.listdir(self.cache_dir):
            if filename.startswith("stats_league_"):
                data = self._load_json_cache(filename, self.STATS_CACHE_DURATION) # ใช้กฎ 24 ชม.
                if data:
                    self.team_stats.update(data)
                    # เก็บ ID ลีกไว้ว่าโหลดแล้ว จะได้ไม่โหลดซ้ำ
                    league_id = int(filename.split('_')[2].split('.')[0])
                    # (เราอาจจะไม่ต้องใช้ set leagues_stats_loaded แบบเดิมแล้ว เพราะเช็คจากไฟล์เอา)

    # --- 📊 Logic การดึงข้อมูล ---

    def _fetch_team_stats_from_api(self, league_id, season):
        """ 
        ดึงตารางคะแนน (Standings) -> เก็บลงไฟล์ Cache แยกรายลีก 
        อายุ Cache: 24 ชั่วโมง (ประหยัด API มาก)
        """
        if not self.api_key: return

        # 1. เช็ค Cache ก่อนยิง API
        cache_filename = f"stats_league_{league_id}.json"
        cached_data = self._load_json_cache(cache_filename, self.STATS_CACHE_DURATION)
        
        if cached_data:
            # ถ้ามี Cache และยังไม่หมดอายุ ให้อัปเดต Memory แล้วจบเลย
            self.team_stats.update(cached_data)
            return

        # 2. ถ้ายิง API (กรณีไม่มี Cache หรือหมดอายุ)
        print(f"🔄 Fetching API: League Standings {league_id}...")
        url = f"{self.base_url}/standings"
        params = {"league": str(league_id), "season": str(season)}
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}

        try:
            response = requests.get(url, headers=headers, params=params)
            data = response.json()

            if "response" not in data or not data["response"]: return

            standings_group = data["response"][0]["league"]["standings"]
            standings = []
            for group in standings_group:
                standings.extend(group)

            total_goals = sum(t["all"]["goals"]["for"] for t in standings)
            total_matches = sum(t["all"]["played"] for t in standings)

            if total_matches == 0: return
            avg_goals = total_goals / total_matches

            new_stats = {}
            for t in standings:
                name = t["team"]["name"]
                played = t["all"]["played"]
                if played == 0: continue
                
                att = (t["all"]["goals"]["for"] / played) / avg_goals
                defi = (t["all"]["goals"]["against"] / played) / avg_goals
                form = t.get("form", "-----")

                new_stats[name] = {
                    "attack": round(att, 2), 
                    "defense": round(defi, 2),
                    "form": form
                }
            
            # 3. บันทึกลงไฟล์ และ อัปเดต Memory
            self._save_json_cache(cache_filename, new_stats)
            self.team_stats.update(new_stats)
            print(f"✅ Cached stats for League {league_id}")

        except Exception as e:
            print(f"❌ Stats Error (League {league_id}): {e}")

    def get_upcoming_matches(self):
        """
        🔥 ดึงแมตช์ (Cache 30 นาที) 
        และ ดึง Stats (Cache 24 ชม.) เฉพาะลีกที่จำเป็น
        """
        # 1. เช็ค Cache รายการแข่ง
        cache_filename = "matches_upcoming.json"
        cached_matches = self._load_json_cache(cache_filename, self.MATCHES_CACHE_DURATION)
        
        if cached_matches:
            print("⚡ Using File Cache for Matches")
            return cached_matches

        if not self.api_key: return []

        all_matches = []
        dates_to_fetch = [
            datetime.now().strftime("%Y-%m-%d"),
            (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        ]
        current_year = datetime.now().year
        season = current_year if datetime.now().month >= 7 else current_year - 1

        print(f"📡 Fetching Matches from API: {dates_to_fetch}")

        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}
        url = f"{self.base_url}/fixtures"

        for date_str in dates_to_fetch:
            params = {"date": date_str} # เอาทุกสถานะ

            try:
                res = requests.get(url, headers=headers, params=params)
                data = res.json()
                
                if "response" in data:
                    print(f"   found {len(data['response'])} matches on {date_str}")
                    
                    # รวบรวม League ID ที่ต้องใช้ เพื่อดึง Stats
                    # เราจะดึง Stats ให้ครบก่อน แล้วค่อย Loop สร้าง Match Object
                    leagues_needed = set()
                    for item in data["response"]:
                        leagues_needed.add(item["league"]["id"])
                    
                    # ดึง Stats เฉพาะลีกที่ยังไม่มีใน Memory
                    for lid in leagues_needed:
                        # เช็คว่ามีข้อมูลทีมในลีกนี้อยู่ใน Memory หรือยัง (เช็คแบบคร่าวๆ)
                        # แต่เพื่อความชัวร์ เรียก _fetch_team_stats_from_api เลย 
                        # เพราะข้างในฟังก์ชันมีระบบเช็ค Cache ไฟล์ให้อยู่แล้ว (เร็ว)
                        self._fetch_team_stats_from_api(lid, season)

                    # สร้าง Match List
                    for item in data["response"]:
                        home = item["teams"]["home"]["name"]
                        away = item["teams"]["away"]["name"]
                        
                        # กรอง: ถ้าไม่มี Stats ก็ข้าม (แสดงว่า API Standings มีปัญหา หรือ เป็นบอลถ้วยที่ไม่มีตารางคะแนน)
                        if home not in self.team_stats or away not in self.team_stats: continue
                        
                        all_matches.append({
                            "id": item["fixture"]["id"],
                            "home_team": home,
                            "away_team": away,
                            "home_id": item["teams"]["home"]["id"],
                            "away_id": item["teams"]["away"]["id"],
                            "home_logo": item["teams"]["home"]["logo"],
                            "away_logo": item["teams"]["away"]["logo"],
                            "league": item["league"]["name"],
                            "league_logo": item["league"]["logo"],
                            "kickoff_time": item["fixture"]["date"],
                            "status": item["fixture"]["status"]["short"],
                            "home_stats": self.team_stats.get(home, {"attack":1.0, "defense":1.0, "form": "-----"}),
                            "away_stats": self.team_stats.get(away, {"attack":1.0, "defense":1.0, "form": "-----"})
                        })
            except Exception as e:
                print(f"❌ Error fetching date {date_str}: {e}")
                continue

        all_matches.sort(key=lambda x: x["kickoff_time"])

        # บันทึก Cache รายการแข่ง
        self._save_json_cache(cache_filename, all_matches)
        
        print(f"✅ Total matches loaded & Cached: {len(all_matches)}")
        return all_matches

    # ... (ส่วน get_match_by_id, get_head_to_head, get_match_odds, etc. เหมือนเดิม) ...
    # หมายเหตุ: get_match_odds คือ Real-time เสมอ ไม่ต้อง Cache (หรือ Cache สั้นๆ 5 นาทีก็ได้ถ้าอยากประหยัดสุดๆ)

    def get_match_by_id(self, match_id: int):
        matches = self.get_upcoming_matches()
        for m in matches:
            if m['id'] == match_id: return m
        if self.api_key:
            return self._fetch_single_match_direct(match_id)
        return {}
    
    def _fetch_single_match_direct(self, match_id):
        # ... (เหมือนเดิม แต่เพิ่มการเรียก self._fetch_team_stats_from_api แบบใหม่) ...
        url = f"{self.base_url}/fixtures"
        params = {"id": str(match_id)}
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}
        try:
            res = requests.get(url, headers=headers, params=params).json()
            if "response" in res and res["response"]:
                item = res["response"][0]
                home = item["teams"]["home"]["name"]
                away = item["teams"]["away"]["name"]
                
                # Fetch Stats (Logic มี Cache รองรับแล้ว)
                self._fetch_team_stats_from_api(item["league"]["id"], item["league"]["season"])

                return {
                    "id": item["fixture"]["id"],
                    "home_team": home,
                    "away_team": away,
                    "home_id": item["teams"]["home"]["id"],
                    "away_id": item["teams"]["away"]["id"],
                    "league": item["league"]["name"],
                    "kickoff_time": item["fixture"]["date"],
                    "status": item["fixture"]["status"]["short"],
                    "home_stats": self.team_stats.get(home, {"attack":1.0, "defense":1.0, "form": "-----"}),
                    "away_stats": self.team_stats.get(away, {"attack":1.0, "defense":1.0, "form": "-----"})
                }
        except: pass
        return {}

    def get_head_to_head(self, team1_id: int, team2_id: int):
        # ... (Logic เดิม ไม่ต้อง Cache หรือจะ Cache เป็นไฟล์ก็ได้ถ้าอยากทำ)
        if not self.api_key: return []
        url = f"{self.base_url}/fixtures/headtohead"
        params = {"h2h": f"{team1_id}-{team2_id}", "last": "5"}
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}
        try:
            res = requests.get(url, headers=headers, params=params).json()
            history = []
            for item in res.get("response", []):
                 history.append({
                    "date": item["fixture"]["date"].split("T")[0],
                    "home_team": item["teams"]["home"]["name"],
                    "away_team": item["teams"]["away"]["name"],
                    "score_home": item["goals"]["home"],
                    "score_away": item["goals"]["away"],
                    "score": f"{item['goals']['home']} - {item['goals']['away']}"
                 })
            return history
        except: return []

    def get_match_odds(self, match_id: int):
        # ⚠️ Real-time Part: ส่วนนี้เราตั้งใจให้ดึงสดเสมอ
        if not self.api_key: return None
        url = f"{self.base_url}/odds"
        params = {"fixture": str(match_id), "bookmaker": "1"} 
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}
        try:
            res = requests.get(url, headers=headers, params=params).json()
            if not res.get("response"): return None

            bets = res["response"][0]["bookmakers"][0]["bets"]
            odds_data = {"handicap": None, "over_under": None, "winner": None}

            for bet in bets:
                if bet["id"] == 1: odds_data["winner"] = bet["values"]
                elif bet["id"] == 5:
                    best_line = None
                    min_diff = 999
                    for val in bet["values"]:
                        if "Over" in val["value"]:
                             try:
                                odd = float(val["odd"])
                                diff = abs(odd - 1.90) 
                                if diff < min_diff:
                                    min_diff = diff
                                    line = val["value"].replace("Over ", "")
                                    best_line = {"line": float(line), "over": odd}
                             except: continue
                    if best_line: odds_data["over_under"] = best_line

                elif bet["id"] == 4:
                    best_hdp = None
                    min_diff = 999
                    for val in bet["values"]:
                         if val["value"].startswith("Home"):
                             try:
                                odd = float(val["odd"])
                                diff = abs(odd - 1.90)
                                if diff < min_diff:
                                    min_diff = diff
                                    line = val["value"].replace("Home", "").strip()
                                    best_hdp = {"line": float(line), "odd": odd}
                             except: pass
                    if best_hdp: odds_data["handicap"] = best_hdp
            return odds_data
        except: return None

    def get_match_lineups(self, match_id: int):
        if not self.api_key: return []
        url = f"{self.base_url}/fixtures/lineups"
        params = {"fixture": str(match_id)}
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}
        try:
            res = requests.get(url, headers=headers, params=params).json()
            return res.get("response", [])
        except: return []

    def get_match_injuries(self, match_id: int):
        if not self.api_key: return []
        url = f"{self.base_url}/injuries"
        params = {"fixture": str(match_id)}
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io"}
        try:
            res = requests.get(url, headers=headers, params=params).json()
            return res.get("response", [])
        except: return []   

    def get_history_matches(self, date_str: str):
        # ⚠️ ประวัติย้อนหลัง อาจจะไม่ต้อง Cache ก็ได้ หรือจะ Cache เป็นรายวันก็ได้
        # แต่เพื่อความง่าย ใช้ Logic เดียวกับ upcoming แต่ไม่ Cache ไฟล์รวม
        if not self.api_key: return []
        
        url = f"{self.base_url}/fixtures"
        params = { "date": date_str, "status": "FT" }
        headers = { "x-rapidapi-key": self.api_key, "x-rapidapi-host": "v3.football.api-sports.io" }
        
        try:
            res = requests.get(url, headers=headers, params=params).json()
            response_data = res.get("response", [])
            
            matches = []
            for item in response_data:
                league_id = item["league"]["id"]
                season = item["league"]["season"]

                # ใช้ _fetch_team_stats_from_api ที่มี Cache ไฟล์รองรับ
                self._fetch_team_stats_from_api(league_id, season)

                home = item["teams"]["home"]["name"]
                away = item["teams"]["away"]["name"]
                
                if home not in self.team_stats or away not in self.team_stats: continue

                matches.append({
                    "id": item["fixture"]["id"],
                    "home_team": home,
                    "away_team": away,
                    "home_logo": item["teams"]["home"]["logo"],
                    "away_logo": item["teams"]["away"]["logo"],
                    "league": item["league"]["name"],
                    "score_home": item["goals"]["home"],
                    "score_away": item["goals"]["away"],
                    "home_stats": self.team_stats.get(home, {"attack":1.0, "defense":1.0, "form": "-----"}),
                    "away_stats": self.team_stats.get(away, {"attack":1.0, "defense":1.0, "form": "-----"})
                })
            return matches
        except Exception as e:
            print(f"Error fetching history: {e}")
            return []