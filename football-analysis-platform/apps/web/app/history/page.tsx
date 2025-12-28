"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";

export default function HistoryPage() {
  // Default วันที่เมื่อวาน
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [date, setDate] = useState(yesterday.toISOString().split('T')[0]);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (selectedDate: string) => {
    setLoading(true);
    try {
        const res = await api.get(`/api/v1/history/?date=${selectedDate}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(date);
  }, [date]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">AI Performance History</h1>
      </div>

      {/* Date Picker */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-center">
        <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
            <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
        </div>
      </div>

      {/* Stats Summary Cards */}
      {data && (
        <div className="max-w-4xl mx-auto mb-8 grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center">
            <div className="text-3xl font-bold text-emerald-500">{data.summary.win}</div>
            <div className="text-xs uppercase text-slate-400 mt-1 font-semibold tracking-wider">Correct (Win)</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center">
            <div className="text-3xl font-bold text-red-500">{data.summary.loss}</div>
            <div className="text-xs uppercase text-slate-400 mt-1 font-semibold tracking-wider">Incorrect (Loss)</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl text-center">
            <div className="text-3xl font-bold text-slate-300">
               {data.summary.total > 0 ? Math.round((data.summary.win / data.summary.total) * 100) : 0}%
            </div>
            <div className="text-xs uppercase text-slate-400 mt-1 font-semibold tracking-wider">Win Rate</div>
          </div>
        </div>
      )}

      {/* Match List */}
      <div className="max-w-4xl mx-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          </div>
        ) : (
          data?.matches?.map((item: any, idx: number) => (
            <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-slate-700 transition-colors">
              
              {/* Teams & Score */}
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className="w-16 text-center text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden md:block">
                    {item.match.league.substring(0, 10)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className={item.match.score_home > item.match.score_away ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {item.match.home_team}
                    </span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded ml-2">
                        {item.match.score_home}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={item.match.score_away > item.match.score_home ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {item.match.away_team}
                    </span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded ml-2">
                        {item.match.score_away}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Result */}
              <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end md:justify-center gap-1 md:pl-6 md:border-l border-slate-800">
                <div className="text-xs text-slate-500">AI Pick: <span className="text-slate-300 font-semibold">{item.prediction}</span></div>
                
                {item.outcome === "Win" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle size={14} /> WIN
                  </span>
                )}
                {item.outcome === "Loss" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    <XCircle size={14} /> LOSS
                  </span>
                )}
                {item.outcome === "Push" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                    <MinusCircle size={14} /> DRAW
                  </span>
                )}
                {item.outcome === "N/A" && (
                   <span className="text-xs text-slate-600 italic">Pending</span>
                )}
              </div>
            </div>
          ))
        )}
        
        {!loading && data?.matches?.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                No finished matches found for this date.
            </div>
        )}
      </div>
    </div>
  );
}