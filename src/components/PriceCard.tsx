"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PriceRecord } from "@prisma/client";

interface PriceCardProps {
  name: string;
  data: PriceRecord | null;
}

const PriceCard = ({ name, data }: PriceCardProps) => {
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    if (!data?.id) return;

    // Use a small delay to avoid synchronous state update during render cycle
    const flashTimer = setTimeout(() => setIsFresh(true), 10);
    const expireTimer = setTimeout(() => setIsFresh(false), 3000);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(expireTimer);
    };
  }, [data?.id, data?.sell, data?.buy]);

  if (!data)
    return (
      <div className="p-6 bg-white dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 gap-2">
        <ShieldAlert className="w-4 h-4" />
        <span className="text-sm font-medium">Veri yüklenemedi</span>
      </div>
    );

  const isUp = data.direction === "moneyUp";
  const isDown = data.direction === "moneyDown";

  return (
    <div className="group p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">
            {name}
          </p>
          <div className="flex items-baseline gap-1 relative">
            <h2
              className={`text-4xl font-black tracking-tighter transition-all duration-500 ${
                isFresh
                  ? isUp
                    ? "text-emerald-500 scale-105"
                    : isDown
                      ? "text-rose-500 scale-105"
                      : "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {data.sell.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
            <span
              className={`text-xl font-bold transition-colors duration-500 ${
                isFresh
                  ? isUp
                    ? "text-emerald-500"
                    : isDown
                      ? "text-rose-500"
                      : "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              ₺
            </span>
            {isFresh && (
              <div
                className={`absolute -inset-2 rounded-lg blur-2xl opacity-30 animate-pulse pointer-events-none ${isUp ? "bg-emerald-500" : isDown ? "bg-rose-500" : "bg-zinc-400"}`}
              />
            )}
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
            isUp
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              : isDown
                ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                : "bg-zinc-50 text-zinc-600 border border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
          }`}
        >
          {isUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : isDown ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          %{Math.abs(data.ratio || 0).toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm py-4 border-y border-zinc-50 dark:border-zinc-900">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              Satış
            </p>
          </div>
          <p className="text-lg font-black text-zinc-800 dark:text-zinc-200">
            {data.sell.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              Alış
            </p>
          </div>
          <p className="text-lg font-black text-zinc-800 dark:text-zinc-200">
            {data.buy.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
            <Clock className="w-3 h-3" />
            {data.createdAt.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div
            className={`flex items-center gap-0.5 text-[10px] font-bold ${isUp ? "text-emerald-500" : "text-rose-500"}`}
          >
            {isUp ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {data.change?.toFixed(2)}₺
          </div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-50 transition-colors"></div>
      </div>
    </div>
  );
};

export default PriceCard;
