import { performPriceSync } from "@/app/actions";

/**
 * Background Worker System
 *
 * This module implements a self-contained background synchronization loop
 * that runs within the Next.js server process. It allows the application
 * to sync prices and send Telegram notifications 24/7 without requiring
 * external cron jobs or keeping a browser tab open.
 */

let isWorkerRunning = false;

/**
 * Starts the background worker loop.
 * This is designed to be called from the Next.js instrumentation hook.
 */
export function startBackgroundWorker() {
  if (isWorkerRunning) {
    console.log("[Worker] Worker is already running.");
    return;
  }

  // Prevent running during build time or in edge environments where timers aren't suitable
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  console.log("[Worker] Initializing background price sync worker...");
  isWorkerRunning = true;

  // Run the loop
  syncLoop();
}

/**
 * Main synchronization loop
 */
async function syncLoop() {
  while (isWorkerRunning) {
    try {
      console.log(
        `[Worker] Starting background sync at ${new Date().toISOString()}`,
      );

      /**
       * performPriceSync(false, true) parameters:
       * 1. force = false (respects the 1-minute coordination cooldown)
       * 2. notify = true (triggers Telegram notifications if prices have changed)
       */
      const result = await performPriceSync(false, true);

      if (result.success) {
        if (result.updated) {
          console.log(
            `[Worker] Sync successful: Price changes detected and notifications sent.`,
          );
        } else {
          console.log(`[Worker] Sync successful: No price changes detected.`);
        }
        console.log(`[Worker] Remaining API requests: ${result.remaining}`);
      } else {
        console.warn(`[Worker] Sync completed with issues: ${result.error}`);
      }
    } catch (error) {
      console.error("[Worker] Fatal error in sync loop:", error);
    }

    // Determine wait time (Default 2 minutes)
    // 1440 mins per day / 1000 requests = 1.44 min per request.
    // 2 minutes is safe and keeps us well under the 1000/day limit.
    const WAIT_TIME_MS = 2 * 60 * 1000;

    await new Promise((resolve) => setTimeout(resolve, WAIT_TIME_MS));
  }
}

/**
 * Stops the background worker
 */
export function stopBackgroundWorker() {
  console.log("[Worker] Stopping background worker...");
  isWorkerRunning = false;
}
