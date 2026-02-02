export async function register() {
  /**
   * Next.js Instrumentation Hook
   * This runs when the Next.js server starts up.
   * We use it to launch our background worker which handles 24/7 price syncing
   * and Telegram notifications regardless of whether anyone is visiting the site.
   */
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundWorker } = await import("./lib/worker");
    startBackgroundWorker();
  }
}
