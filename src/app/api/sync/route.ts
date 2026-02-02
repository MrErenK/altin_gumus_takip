import { performPriceSync } from "@/app/actions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route for background price synchronization.
 * This can be called by external cron services (e.g., Vercel Cron, GitHub Actions, or a simple curl).
 *
 * Usage: GET /api/sync?key=YOUR_SYNC_KEY
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const secretKey = process.env.SYNC_KEY;

  // Security check: Only allow requests with the correct secret key if one is defined
  if (secretKey && key !== secretKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // performPriceSync(true) will:
    // 1. Fetch data from API
    // 2. Check for price changes
    // 3. Save to DB if changed
    // 4. Send Telegram notification if changed
    // 5. Cleanup old records
    const result = await performPriceSync(true);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Sync completed successfully",
        remaining: result.remaining,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Cron API] Sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
