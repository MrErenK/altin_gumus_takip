"use server";

import { prisma } from "@/lib/prisma";
import { PriceRecord } from "@prisma/client";
import { fetchPrices } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { sendTelegramNotification } from "@/lib/telegram";

/**
 * Core logic to fetch and save prices.
 * Coordinates between UI refreshes and Background Workers using GlobalState.
 * @param force If true, bypasses the time-based cooldown (but still checks for real changes).
 * @param notify If true, sends Telegram notifications on price changes.
 */
let lastHourlyNotifyAt = 0;
const lastNotifiedPrices: Record<string, number | undefined> = {};

export async function performPriceSync(force = false, notify = true) {
  try {
    const now = new Date();

    // 1. Coordination Check: Prevent multiple syncs within a short window (e.g., 1 minute)
    // unless 'force' is specified.
    const state = await prisma.globalState.findFirst({ where: { id: 1 } });
    const cooldownPeriod = 60 * 1000; // 1 minute cooldown

    if (
      !force &&
      state &&
      now.getTime() - state.lastSyncedAt.getTime() < cooldownPeriod
    ) {
      console.log(
        `[Sync] Skipping: Last sync was ${Math.round((now.getTime() - state.lastSyncedAt.getTime()) / 1000)}s ago.`,
      );
      return {
        success: true,
        message: "Skipping sync: Cooldown active",
        remaining: state.remaining,
        updated: false,
      };
    }

    console.log(`[Sync] Fetching new prices... (notify: ${notify})`);
    const symbols = ["GA", "GAG"];
    const response = await fetchPrices(symbols);

    if (response.success && response.data) {
      const records = Object.entries(response.data).map(([symbol, data]) => ({
        symbol,
        buy: parseFloat(data.alis),
        sell: parseFloat(data.satis),
        change: parseFloat(data.oran.replace("%", "")),
        ratio: parseFloat(data.degisim.replace("%", "")),
        direction: data.yon,
      }));

      // Find the latest records to check for changes
      const latestRecords = await Promise.all(
        symbols.map((s) =>
          prisma.priceRecord.findFirst({
            where: { symbol: s },
            orderBy: { createdAt: "desc" },
          }),
        ),
      );

      // 3. Hourly Price Notification (Every 1 hour)
      // This runs independently of price changes to keep users informed
      const oneHour = 60 * 60 * 1000;
      if (notify && now.getTime() - lastHourlyNotifyAt >= oneHour) {
        console.log("[Sync] Triggering hourly price summary.");
        const telegramUpdates = records.map((r) => ({
          symbol: r.symbol,
          name: r.symbol === "GA" ? "Gram Altın" : "Gram Gümüş",
          buy: r.buy,
          sell: r.sell,
          ratio: r.ratio || 0,
          direction: r.direction || "moneyNone",
          change: r.change || 0,
        }));

        await sendTelegramNotification(telegramUpdates, true).catch((err) =>
          console.error("[Sync] Hourly Telegram notification error:", err),
        );
        lastHourlyNotifyAt = now.getTime();

        // Update last notified prices to prevent immediate duplicate notification
        records.forEach((r) => {
          lastNotifiedPrices[r.symbol] = r.sell;
        });
      }

      // 4. Update Database and handle movement-based notifications
      // Only save and notify if prices have actually changed
      const changedRecords = records.filter((record) => {
        const last = latestRecords.find((l) => l?.symbol === record.symbol);
        const hasChanged =
          !last || last.sell !== record.sell || last.buy !== record.buy;

        if (hasChanged) {
          console.log(
            `[Sync] Price movement detected for ${record.symbol}: ${last?.sell ?? "N/A"} -> ${record.sell}`,
          );
        }

        return hasChanged;
      });

      if (changedRecords.length > 0) {
        console.log(
          `[Sync] Saving ${changedRecords.length} updated records to database.`,
        );
        // Create entries in database using a transaction
        await prisma.$transaction(
          changedRecords.map((record) =>
            prisma.priceRecord.create({
              data: record,
            }),
          ),
        );

        // Perform background cleanup
        cleanupOldRecords().catch((err) =>
          console.error("[Sync] Cleanup error:", err),
        );

        // Notify via Telegram if requested
        if (notify) {
          // Filter out small price changes
          // We compare against the last notified price to catch slow movements
          const notableChanges = changedRecords.filter((record) => {
            let lastBasePrice = lastNotifiedPrices[record.symbol];

            // If no previous notification in this session, use the last record from DB
            if (lastBasePrice === undefined) {
              const last = latestRecords.find(
                (l) => l?.symbol === record.symbol,
              );
              lastBasePrice = last?.sell;
            }

            if (lastBasePrice === undefined) return true;

            const diff = Math.abs(record.sell - lastBasePrice);
            const threshold = record.symbol === "GAG" ? 0.5 : 0.99;
            return diff >= threshold;
          });

          if (notableChanges.length > 0) {
            console.log(
              `[Sync] Triggering Telegram notification for symbols: ${notableChanges.map((n) => n.symbol).join(", ")}`,
            );
            // Update last notified prices
            notableChanges.forEach((n) => {
              lastNotifiedPrices[n.symbol] = n.sell;
            });
            const telegramUpdates = notableChanges.map((r) => ({
              symbol: r.symbol,
              name: r.symbol === "GA" ? "Gram Altın" : "Gram Gümüş",
              buy: r.buy,
              sell: r.sell,
              ratio: r.ratio || 0,
              direction: r.direction || "moneyNone",
              change: r.change || 0,
            }));

            const tgResult = await sendTelegramNotification(
              telegramUpdates,
            ).catch((err) => {
              console.error("[Sync] Telegram notification error:", err);
              return { success: false };
            });

            if (tgResult?.success) {
              console.log("[Sync] Telegram notification sent successfully.");
            }
          } else {
            console.log(
              "[Sync] No notable price changes (thresholds: GA >= 0.99, GAG >= 0.50) for Telegram notification.",
            );
          }
        }
      } else {
        console.log(
          "[Sync] No price changes detected. Database and Telegram skipped.",
        );
      }

      // Update Global State to coordinate with other workers/UI
      await prisma.globalState.upsert({
        where: { id: 1 },
        update: {
          lastSyncedAt: now,
          remaining: response.remaining,
        },
        create: {
          id: 1,
          lastSyncedAt: now,
          remaining: response.remaining,
        },
      });

      return {
        success: true,
        remaining: response.remaining,
        data: response.data,
        updated: changedRecords.length > 0,
      };
    }

    return { success: false, error: "Failed to fetch data from API" };
  } catch (error) {
    console.error("[Sync] Internal error:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Keeps the database size manageable by keeping only the latest 500 records per symbol.
 */
async function cleanupOldRecords() {
  const symbols = ["GA", "GAG"];
  const MAX_RECORDS = 500;

  for (const symbol of symbols) {
    try {
      const count = await prisma.priceRecord.count({ where: { symbol } });
      if (count > MAX_RECORDS) {
        const lastRecordToKeep = await prisma.priceRecord.findFirst({
          where: { symbol },
          orderBy: { createdAt: "desc" },
          skip: MAX_RECORDS - 1,
        });

        if (lastRecordToKeep) {
          await prisma.priceRecord.deleteMany({
            where: {
              symbol,
              createdAt: { lt: lastRecordToKeep.createdAt },
            },
          });
        }
      }
    } catch (e) {
      console.error(`[Cleanup] Error cleaning up ${symbol}:`, e);
    }
  }
}

/**
 * Triggered by UI AutoRefresh component.
 */
export async function syncPrices() {
  const result = await performPriceSync(false, true);
  if (result.success && result.updated) {
    revalidatePath("/");
  }
  return result;
}

export async function getPriceHistory(symbol: string) {
  try {
    const history = await prisma.priceRecord.findMany({
      where: { symbol },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return history.map((item: PriceRecord) => ({
      ...item,
      time: item.createdAt.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: item.createdAt.toLocaleDateString("tr-TR"),
    }));
  } catch (error) {
    console.error("[History] Fetch error:", error);
    return [];
  }
}
