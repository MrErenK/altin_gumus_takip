"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistoryItem {
  id: number;
  symbol: string;
  buy: number;
  sell: number;
  createdAt: Date;
  time: string;
  date: string;
}

interface PriceChartProps {
  data: HistoryItem[];
  title: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    payload: HistoryItem;
    value: number | string;
    dataKey: string;
  }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HistoryItem;
    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 shadow-2xl rounded-xl">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-900 pb-2">
          {data.date} — {data.time}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-50" />
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                Satış
              </span>
            </div>
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
              {data.sell.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺
            </span>
          </div>
          <div className="flex items-center justify-between gap-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight">
                Alış
              </span>
            </div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
              {data.buy.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PriceChart({ data, title }: PriceChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Neutral grey color for the chart to keep the UI clean
  const color = "#71717a";

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-600">
        <p className="text-sm font-bold tracking-tight uppercase">
          Veri bekleniyor
        </p>
        <p className="text-[10px] uppercase tracking-widest mt-1 opacity-50">
          Grafik oluşturuluyor...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 py-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-zinc-400 dark:bg-zinc-600"></div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-50 tracking-[0.15em] uppercase">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
            Canlı
          </div>
        </div>
      </div>

      <div className="h-75 w-full relative" style={{ minWidth: 0 }}>
        {isMounted && (
          <ResponsiveContainer width="99%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800 opacity-50"
              />
              <XAxis
                dataKey="time"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                minTickGap={45}
                tick={{ fontWeight: 700, fill: "#71717a" }}
                dy={15}
              />
              <YAxis
                fontSize={9}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(value) => `${value}`}
                tick={{ fontWeight: 700, fill: "#71717a" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#71717a",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="sell"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="buy"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                className="text-zinc-300 dark:text-zinc-700"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-start gap-8 px-2 border-t border-zinc-50 dark:border-zinc-900 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
          <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Satış Trendi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-0.5 border-t border-dashed border-zinc-300 dark:border-zinc-700"></div>
          <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
            Alış Trendi
          </span>
        </div>
      </div>
    </div>
  );
}
