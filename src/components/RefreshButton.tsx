"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { syncPrices } from "@/app/actions";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await syncPrices();
      if (!result.success) {
        console.error("Refresh failed:", result.error);
      }
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Güncelleniyor..." : "Fiyatları Güncelle"}
    </button>
  );
}
