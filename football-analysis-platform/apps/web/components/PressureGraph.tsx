"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

// Mock data generator for the visual effect
const generateMockPressure = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    homePressure: Math.floor(Math.random() * 60) + 20, // Random 20-80
    awayPressure: Math.floor(Math.random() * 40),      // Random 0-40
  }));
};

const data = generateMockPressure();

export default function PressureGraph() {
  return (
    <div className="h-12 w-32 md:w-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorHome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF3B30" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAway" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 100]} />
          {/* Home Pressure (Red) */}
          <Area 
            type="monotone" 
            dataKey="homePressure" 
            stroke="#FF3B30" 
            fillOpacity={1} 
            fill="url(#colorHome)" 
            strokeWidth={2}
          />
          {/* Away Pressure (Blue) - Rendered behind or below if needed, here simplified */}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}