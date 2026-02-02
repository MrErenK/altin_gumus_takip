"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncPrices } from "@/app/actions";

interface AutoRefreshProps {
  remainingRequests: number | null;
}

/**
 * AutoRefresh component that periodically triggers a price sync.
 * The frequency of updates is dynamically adjusted based on the remaining API request count
 * to ensure we stay within the daily limit of 1000 requests.
 */
export default function AutoRefresh({ remainingRequests }: AutoRefreshProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const syncInProgress = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Show a warning overlay if requests are running dangerously low
    setShowWarning(remainingRequests !== null && remainingRequests < 10);

    // Calculate polling interval based on remaining requests.
    // 1440 minutes in a day / 1000 requests = ~1.44 mins per request.
    const currentRemaining = remainingRequests ?? 1000;

    let intervalMs = 2 * 60 * 1000; // Default: 2 minutes

    if (currentRemaining < 50) {
      intervalMs = 30 * 60 * 1000; // 30 mins if very low
    } else if (currentRemaining < 200) {
      intervalMs = 10 * 60 * 1000; // 10 mins if low
    } else if (currentRemaining < 500) {
      intervalMs = 5 * 60 * 1000; // 5 mins if medium
    }

    const schedulePoll = (delay: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runSync, delay);
    };

    const runSync = async () => {
      // Prevent overlapping sync operations
      if (syncInProgress.current) {
        schedulePoll(10000); // Check again in 10s if already syncing
        return;
      }

      try {
        syncInProgress.current = true;
        const result = await syncPrices();

        if (result.success) {
          // Re-fetch server data and update UI
          router.refresh();
        }
      } catch (error) {
        console.error("[AutoRefresh] Sync failed:", error);
      } finally {
        syncInProgress.current = false;
        // Schedule the next cycle after completion
        schedulePoll(intervalMs);
      }
    };

    // Initial scheduling. We wait the interval first to avoid
    // immediate double-sync on page loads.
    schedulePoll(intervalMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [remainingRequests, router]);

  if (showWarning) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-rose-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl animate-pulse uppercase tracking-widest border border-rose-500/50 backdrop-blur-sm">
          API Limiti Kritik: {remainingRequests}
        </div>
      </div>
    );
  }

  return null;
}
