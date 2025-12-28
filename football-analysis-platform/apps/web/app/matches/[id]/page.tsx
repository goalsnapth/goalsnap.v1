"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Trophy, Activity, TrendingUp, Calendar, Users, AlertCircle, Info } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

export default function MatchAnalysisPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🔥 ระบบจัดการภาษา (ดึงจาก LocalStorage)
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/matches/${id}/analyze`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Activity size={48} className="animate-spin" />
        <span className="text-xl font-semibold">{t.loading}</span>
      </div>
    </div>
  );

  if (!data) return <div className="text-white p-10">Match not found</div>;

  const { match_info, ai_analysis, history, injuries, lineups } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-20">
      {/* Header & Language Switcher */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> {t.back}
        </Link>
        
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
          {(['en', 'th', 'zh'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => changeLanguage(l)}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                lang === l ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Match Title Card */}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
          <div className="text-sm font-semibold text-emerald-400 mb-4 uppercase tracking-widest">{match_info.league}</div>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
            <div className="flex flex-col items-center md:items-end flex-1 gap-3">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center p-3 border border-slate-700">
                 {match_info.home_logo ? <img src={match_info.home_logo} alt={match_info.home_team} className="w-full h-full object-contain" /> : <div className="text-2xl font-bold text-slate-600">{match_info.home_team[0]}</div>}
              </div>
              <div className="text-2xl md:text-4xl font-bold text-white">{match_info.home_team}</div>
              <div className="text-slate-500 font-mono text-xs tracking-widest">{t.home}</div>
            </div>
            
            <div className="px-6 py-2 bg-slate-800 rounded-full text-slate-400 font-bold text-xl border border-slate-700">{t.vs}</div>
            
            <div className="flex flex-col items-center md:items-start flex-1 gap-3">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center p-3 border border-slate-700">
                 {match_info.away_logo ? <img src={match_info.away_logo} alt={match_info.away_team} className="w-full h-full object-contain" /> : <div className="text-2xl font-bold text-slate-600">{match_info.away_team[0]}</div>}
              </div>
              <div className="text-2xl md:text-4xl font-bold text-white">{match_info.away_team}</div>
              <div className="text-slate-500 font-mono text-xs tracking-widest">{t.away}</div>
            </div>
          </div>
          
          <div className="mt-8 text-slate-400 text-sm flex items-center justify-center gap-2">
            <Calendar size={14} className="text-emerald-500" />
            {new Date(match_info.kickoff_time).toLocaleString(lang === 'zh' ? 'zh-CN' : lang === 'th' ? 'th-TH' : 'en-US')}
          </div>
        </div>

        {/* AI Analysis Reasoning (Multi-language) */}
        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl shadow-xl">
          <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 text-lg">
            <Info size={20} /> {t.reasoning}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed text-slate-300">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <p className="text-emerald-400 font-semibold mb-2">{t.whyHandicap}</p>
              <p>
                {lang === 'th' ? `AI เลือก ${ai_analysis.handicap_market.suggested_line} จากส่วนต่างประตูที่คาดการณ์ ${ai_analysis.handicap_market.expected_goal_diff} ลูก โดยคำนวณจากประสิทธิภาพการทำประตูล่าสุด` : 
                 lang === 'zh' ? `基于 ${ai_analysis.handicap_market.expected_goal_diff} 的预期进球差，AI 选择了 ${ai_analysis.handicap_market.suggested_line}。该分析考虑了主场优势和进攻效率。` : 
                 `AI selects ${ai_analysis.handicap_market.suggested_line} based on a calculated goal differential of ${ai_analysis.handicap_market.expected_goal_diff}.`}
              </p>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <p className="text-emerald-400 font-semibold mb-2">{t.whyGoal}</p>
              <p>
                {lang === 'th' ? `โอกาสเกิดสกอร์สูงที่ ${ai_analysis.goals_market.probability}% มาจากค่า xG รวมที่ ${ai_analysis.expected_score} ประตู ซึ่งสอดคล้องกับแผนการเล่นที่เน้นเกมบุกในวันนี้` : 
                 lang === 'zh' ? `进球大盘的概率为 ${ai_analysis.goals_market.probability}%，这是基于双方 ${ai_analysis.expected_score} 的总预期进球数计算得出的。` : 
                 `The ${ai_analysis.goals_market.probability}% probability for Over ${ai_analysis.goals_market.real_line} is derived from combined xG of ${ai_analysis.expected_score}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-slate-400 text-sm font-semibold uppercase mb-4">Win Probability</h4>
            <div className="space-y-4">
               {[
                 { label: t.home, val: ai_analysis.probabilities.home_win, color: "bg-emerald-500" },
                 { label: "Draw", val: ai_analysis.probabilities.draw, color: "bg-yellow-500" },
                 { label: t.away, val: ai_analysis.probabilities.away_win, color: "bg-red-500" }
               ].map((item) => (
                 <div key={item.label}>
                    <div className="flex justify-between mb-1 text-sm"><span>{item.label}</span> <span>{item.val}%</span></div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className={`${item.color} h-full transition-all`} style={{width: `${item.val}%`}}></div></div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center text-center">
            <h4 className="text-slate-400 text-sm font-semibold uppercase mb-2">{t.mainPick}</h4>
            <div className="text-3xl font-bold text-white mb-2">{ai_analysis.ai_insight.main_pick}</div>
            <div className="text-emerald-500 text-sm font-bold bg-emerald-500/10 py-1 px-3 rounded-full inline-block self-center">{t.confidence}: {ai_analysis.ai_insight.confidence}</div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center text-center">
            <h4 className="text-slate-400 text-sm font-semibold uppercase mb-2">{t.goalProb} (O {ai_analysis.goals_market.real_line})</h4>
            <div className="text-4xl font-bold text-white mb-1">{ai_analysis.goals_market.probability}%</div>
          </div>
        </div>

        {/* Lineups & Injuries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Users size={20} className="text-blue-400" /> {t.lineups}</h3>
            {lineups?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {lineups.map((team: any, idx: number) => (
                  <div key={idx} className={idx === 1 ? "border-l border-slate-800 pl-4" : ""}>
                    <div className="text-emerald-400 font-bold text-center mb-4">{team.formation}</div>
                    {team.startXI.map((p: any) => (
                      <div key={p.player.id} className="text-xs text-slate-400 mb-1.5 flex gap-2">
                        <span className="text-slate-600 font-mono w-4">{p.player.number}</span> {p.player.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-10 text-slate-500 text-sm italic">Available 60m before kickoff</div>}
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2"><AlertCircle size={20} className="text-red-400" /> {t.missing}</h3>
            {injuries?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {injuries.map((ij: any) => (
                  <div key={ij.player.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div className="truncate pr-2">
                      <div className="text-sm font-bold text-slate-200 truncate">{ij.player.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{ij.team.name}</div>
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 shrink-0">{ij.type}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-10 text-slate-500 text-sm italic">No confirmed injuries</div>}
          </div>
        </div>

        {/* H2H Section */}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500" /> {t.h2h}</h3>
          {history?.length > 0 ? (
            <div className="space-y-3">
              {history.map((match: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                   <div className="text-slate-400 text-sm shrink-0">{match.date}</div>
                   <div className="flex items-center gap-4 font-semibold text-sm flex-1 justify-center">
                      <span className="flex-1 text-right truncate">{match.home_team}</span>
                      <span className="bg-slate-800 px-3 py-1 rounded-lg text-white border border-slate-700 min-w-[60px] text-center">{match.score}</span>
                      <span className="flex-1 text-left truncate">{match.away_team}</span>
                   </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-10 text-slate-500 italic">No recent H2H data</div>}
        </div>
      </div>
    </div>
  );
}