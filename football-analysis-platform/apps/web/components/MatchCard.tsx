"use client";

import { useEffect, useState } from "react";
import { Lock, TrendingUp, Clock, CalendarDays, Flame } from "lucide-react"; // 🔥 เพิ่ม Flame
import PressureGraph from "./PressureGraph";
import { clsx } from "clsx";

// Interface สำหรับชื่อแบบหลายภาษา
interface LocalizedName {
  en: string;
  th: string;
  zh: string;
}

interface MatchProps {
  homeTeam: string | LocalizedName; // รองรับทั้ง String และ Object
  awayTeam: string | LocalizedName;
  homeLogo?: string;
  awayLogo?: string;
  league: string | LocalizedName;
  time: string;
  prediction?: {
    advice: string;
    probability: number;
    // 🔥 เพิ่มส่วนนี้
    first_half?: {
        has_value: boolean;
        probability: number;
    };
  };
  isPremium?: boolean;
}

export default function MatchCard({ 
  homeTeam, 
  awayTeam, 
  homeLogo,
  awayLogo,
  league, 
  time, 
  prediction,
  isPremium = false 
}: MatchProps) {
  
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [formattedTime, setFormattedTime] = useState<string>("");

  useEffect(() => {
    const dateObj = new Date(time);
    const dateStr = dateObj.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    setFormattedDate(dateStr);
    setFormattedTime(timeStr);
  }, [time]);

  // Helper ดึงชื่อภาษาอังกฤษ (กรณีส่งมาเป็น Object)
  const getName = (val: string | LocalizedName) => {
      if (typeof val === 'object') return val.en; 
      return val;
  };

  const hName = getName(homeTeam);
  const aName = getName(awayTeam);
  const lName = getName(league);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
      
      {/* Column 1: Time & League */}
      <div className="flex flex-row md:flex-col items-center md:items-start gap-2 min-w-[120px]">
        <div className="flex flex-col items-start">
          <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-full">
            <Clock className="w-3 h-3 mr-1.5" />
            {formattedTime || "--:--"}
          </span>
          <span className="flex items-center text-[10px] text-slate-500 mt-1 ml-1 whitespace-nowrap">
            <CalendarDays className="w-3 h-3 mr-1" />
            {formattedDate || "Loading..."}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold md:mt-1 truncate max-w-[100px] hidden md:block">
          {lName}
        </span>
      </div>

      {/* Column 2: Teams with Logos */}
      <div className="flex-1 flex justify-center md:justify-start gap-4 md:gap-8 items-center text-slate-100 font-medium w-full">
        
        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1 justify-end md:flex-none md:w-48">
          <span className="text-sm md:text-lg truncate text-right">{hName}</span>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center p-1.5 border border-slate-700 shrink-0">
            {homeLogo ? (
              <img src={homeLogo} alt={hName} className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-slate-500">{hName[0]}</div>
            )}
          </div>
        </div>

        <div className="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-500 font-bold shrink-0">VS</div>

        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1 justify-start md:flex-none md:w-48">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center p-1.5 border border-slate-700 shrink-0">
            {awayLogo ? (
              <img src={awayLogo} alt={aName} className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-slate-500">{aName[0]}</div>
            )}
          </div>
          <span className="text-sm md:text-lg truncate text-left">{aName}</span>
        </div>
      </div>

      {/* Column 3: Pressure Graph (Hidden on Mobile) */}
      <div className="hidden lg:block w-32 opacity-80 group-hover:opacity-100 transition-opacity">
        <PressureGraph />
      </div>

      {/* Column 4: AI Prediction */}
      <div className="relative min-w-[160px] flex justify-end">
        <div className={clsx(
          "flex flex-col items-end gap-1 transition-all duration-300",
          !isPremium && "blur-sm opacity-30 select-none"
        )}>
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">{prediction?.advice.split(' ')[0] || "Value"}</span>
          </div>
          <span className="text-xs text-slate-400">
            Confidence: <span className="text-slate-200">{prediction?.probability.toFixed(1)}%</span>
          </span>

          {/* 🔥 ส่วนแสดง Badge 1H Goal */}
          {prediction?.first_half?.has_value && (
             <div className="mt-1 flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded-full animate-pulse">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-[10px] font-bold text-orange-400 uppercase">
                    1H Goal {prediction.first_half.probability}%
                </span>
             </div>
          )}

        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-slate-950/90 p-2 rounded-full border border-slate-800 shadow-xl">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile League Label */}
      <div className="md:hidden w-full text-center border-t border-slate-800 pt-2 mt-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{lName}</span>
      </div>
    </div>
  );
}