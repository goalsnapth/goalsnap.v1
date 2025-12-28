"use client";
import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Lock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const MatchRow = ({ match, userIsPremium }: any) => {
  const chartData = match.pressure.map((val: number, i: number) => ({ i, val }));

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-800/50 p-3 border-b border-slate-700 hover:bg-slate-800 transition-colors">
      {/* Time */}
      <div className="w-full md:w-24 shrink-0 text-emerald-400 font-bold text-sm">{match.time}</div>
      
      {/* Teams */}
      <div className="flex-1 w-full">
        <div className="flex justify-between text-slate-200 font-semibold text-sm mb-1">
          <span>{match.homeTeam}</span>
          <span>{match.awayTeam}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
          <div className="bg-blue-500 h-full" style={{ width: '55%' }} />
          <div className="bg-red-500 h-full" style={{ width: '45%' }} />
        </div>
      </div>

      {/* Pressure Chart */}
      <div className="h-10 w-full md:w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Signal */}
      <div className="w-full md:w-40 shrink-0 relative">
         <div className={cn("bg-indigo-900/30 border border-indigo-500/30 p-2 rounded text-center", !userIsPremium && "blur-sm")}>
            <div className="text-xs text-indigo-200 font-bold uppercase">AI Prediction</div>
            <div className="text-white font-bold">{match.aiSignal.type}</div>
         </div>
         {!userIsPremium && (
             <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-xs gap-1">
                <Lock size={12} /> PRO
             </div>
         )}
      </div>
    </div>
  );
};