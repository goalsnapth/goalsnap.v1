"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { clsx } from "clsx";
import MatchCard from "@/components/MatchCard";
import PaymentModal from "@/components/PaymentModal";
import { Filter, Crown, LogOut, Loader2, Globe, LayoutDashboard, History, User, Menu } from "lucide-react";
import { translations, Language } from "@/lib/translations";

// --- Types (เหมือนเดิม) ---
interface Match {
  id: number;
  home_team: string;
  away_team: string;
  home_logo?: string;
  away_logo?: string;
  league: string;
  kickoff_time: string;
  status: string;
}

interface BackendPrediction {
  advice: string;
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  first_half_analysis?: {
    has_value: boolean;
    probability: number;
    text: string;
  };
  goals_market: {
    over_2_5: number;
    real_line: number;
    probability: number;
    analysis: string;
  };
}

interface AnalysisResponse {
  match_info: Match;
  ai_analysis: BackendPrediction;
}

interface MatchWithAnalysis extends Match {
  analysis?: BackendPrediction;
}

export default function Dashboard() {
  const router = useRouter();
  
  // 🔥 Language & UI State
  const [lang, setLang] = useState<Language>('en');
  const t = useMemo(() => translations[lang] || translations['en'], [lang]); // Fallback to EN
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang && ['en', 'th', 'zh'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  // --- Data States ---
  const [matches, setMatches] = useState<MatchWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Upcoming");
  const [selectedLeague, setSelectedLeague] = useState("All Leagues");
  const [isPremium, setIsPremium] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            setUserName(userObj.email.split('@')[0]);
        } catch (e) {}
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const matchesRes = await api.get<Match[]>("/api/v1/matches/");
        const basicMatches = matchesRes.data;

        // Fetch Analysis Parallel
        const analysisPromises = basicMatches.map((m) => 
          api.get<AnalysisResponse>(`/api/v1/matches/${m.id}/analyze`)
             .then(res => ({ id: m.id, data: res.data.ai_analysis }))
             .catch(() => null)
        );

        const analysisResults = await Promise.all(analysisPromises);

        const mergedData = basicMatches.map((match) => {
          const analysis = analysisResults.find(r => r?.id === match.id);
          return { ...match, analysis: analysis?.data || undefined };
        });

        setMatches(mergedData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const availableLeagues = useMemo(() => {
    const leagues = new Set(matches.map(m => m.league));
    const sortedLeagues = Array.from(leagues).sort();
    return ["All Leagues", ...sortedLeagues];
  }, [matches]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

// Filter Logic
  const filteredMatches = matches.filter(match => {
    // 1. League Filter
    if (selectedLeague !== "All Leagues" && match.league !== selectedLeague) {
      return false;
    }

    // 2. Status/Tab Filter
    const status = match.status; // ค่าสถานะจาก API (เช่น 'NS', '1H', 'FT')

    if (filter === "Live") {
       // 🔥 กรองเฉพาะคู่ที่กำลังแข่งขัน (ครึ่งแรก, พักครึ่ง, ครึ่งหลัง, ต่อเวลา, จุดโทษ)
       return ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(status);
    }

    if (filter === "Upcoming") {
       // 🔥 กรองเฉพาะคู่ที่ยังไม่เริ่ม (Not Started, To Be Defined, Postponed)
       return ['NS', 'TBD', 'PST'].includes(status);
    }

    if (filter === "Value") {
       // กรอง Value Bet: เอาเฉพาะคู่ยังไม่แข่ง และมีความน่าจะเป็นสูงกว่า 60%
       if (!['NS', 'TBD', 'PST'].includes(status)) return false;
       return (match.analysis?.goals_market.probability || 0) > 60;
    }

    if (filter === "1H Goal") {
      // 1. เอาเฉพาะคู่ที่ยังไม่เริ่ม หรือ กำลังแข่งครึ่งแรก
      if (!['NS', 'TBD', 'PST', '1H', 'LIVE'].includes(status)) return false;
      const htProb = match.analysis?.first_half_analysis?.probability || 0;
       return htProb > 60; 
    }

    return true;
  });

  // --- Components ---
  const NavLink = ({ href, active, icon: Icon, label }: any) => (
    <Link 
        href={href} 
        className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            active 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
    >
        <Icon size={18} />
        {label}
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsPremium(true)} />

      {/* 🔥 Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            
            {/* Logo & Desktop Menu */}
            <div className="flex items-center gap-8">
                <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    GoalSnap
                </div>
                <div className="hidden md:flex items-center gap-1">
                    <NavLink href="/dashboard" active={true} icon={LayoutDashboard} label={t.menu_dashboard || "Dashboard"} />
                    <NavLink href="/history" active={false} icon={History} label={t.menu_history || "History"} />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                 {/* Language Switcher */}
                <div className="hidden sm:flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    {(['en', 'th', 'zh'] as Language[]).map((l) => (
                    <button
                        key={l}
                        onClick={() => changeLanguage(l)}
                        className={clsx(
                        "px-2 py-1 text-[10px] font-bold rounded transition-all",
                        lang === l ? "bg-slate-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        {l.toUpperCase()}
                    </button>
                    ))}
                </div>

                {!isPremium && (
                    <button 
                    onClick={() => setIsModalOpen(true)}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-sm shadow-lg hover:scale-105 transition-transform"
                    >
                    <Crown size={16} /> {t.upgrade}
                    </button>
                )}

                <div className="h-6 w-px bg-slate-800 hidden sm:block mx-1" />

                <div className="flex items-center gap-3">
                     <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-xs text-slate-400">{t.welcome || "Welcome"}</span>
                        <span className="text-sm font-bold text-white">{userName}</span>
                     </div>
                     <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title={t.menu_logout}>
                        <LogOut size={20} />
                     </button>
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden p-2 text-slate-300"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu size={24} />
                </button>
            </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2">
                 <div className="flex flex-col gap-2">
                    <NavLink href="/dashboard" active={true} icon={LayoutDashboard} label={t.menu_dashboard} />
                    <NavLink href="/history" active={false} icon={History} label={t.menu_history} />
                    <div className="border-t border-slate-800 my-2" />
                    {!isPremium && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 w-full px-4 py-2 text-yellow-500 bg-yellow-500/10 rounded-lg">
                            <Crown size={18} /> {t.upgrade}
                        </button>
                    )}
                 </div>
                 {/* Mobile Lang Switcher */}
                 <div className="flex gap-2 justify-center pt-2">
                    {(['en', 'th', 'zh'] as Language[]).map((l) => (
                        <button key={l} onClick={() => changeLanguage(l)} className={`px-3 py-1 text-xs border rounded ${lang === l ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                 </div>
            </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
          
        {/* Welcome Section (Mobile Only) */}
        <div className="md:hidden mb-6">
            <h1 className="text-2xl font-bold text-white">{t.dashboard}</h1>
            <p className="text-slate-400 text-sm">{t.liveAnalysis}</p>
        </div>

        {/* Controls Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-2 px-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <select 
                value={selectedLeague} 
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer pr-8 py-2"
            >
                {availableLeagues.map(league => (
                <option key={league} value={league} className="bg-slate-900 text-white">
                    {league === "All Leagues" ? t.allLeagues : league}
                </option>
                ))}
            </select>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-lg w-full sm:w-auto">
            {["Upcoming", "Live", "Value","1H Goal"].map(f => (
                <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={clsx(
                    "flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                    filter === f ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                )}
                >
                {t[f.toLowerCase() as keyof typeof t] || f}
                </button>
            ))}
            </div>
        </div>

        {/* Match List */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs uppercase tracking-widest font-semibold px-2">
            <Filter className="w-3 h-3" />
            <span>{t.showing} {filteredMatches.length} {t.matches}</span>
            </div>

            {filteredMatches.length === 0 ? (
            <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                <p>{t.noMatches} <span className="text-emerald-500 font-semibold">{selectedLeague}</span></p>
            </div>
            ) : (
            filteredMatches.map((match, index) => {
                const isUnlocked = isPremium || index < 2; 
                const Wrapper = isUnlocked ? Link : ('div' as any);
                return (
                <Wrapper key={match.id} href={isUnlocked ? `/matches/${match.id}` : undefined} className={`block transition-all duration-300 ${isUnlocked ? 'hover:scale-[1.01] hover:shadow-xl cursor-pointer' : 'cursor-not-allowed opacity-80'}`}>
                    <MatchCard 
                    homeTeam={match.home_team} 
                    awayTeam={match.away_team} 
                    homeLogo={match.home_logo} 
                    awayLogo={match.away_logo}
                    league={match.league} 
                    time={match.kickoff_time} 
                    isPremium={isUnlocked}
                    prediction={match.analysis ? {
                        advice: match.analysis.advice,
                        probability: match.analysis.probabilities.home_win > match.analysis.probabilities.away_win 
                     ? match.analysis.probabilities.home_win 
                     : match.analysis.probabilities.away_win,
                        label: t.confidence,
                        first_half: match.analysis.first_half_analysis
                    } : undefined}
                    />
                </Wrapper>
                );
            })
            )}
        </section>
      </main>
    </div>
  );
}
