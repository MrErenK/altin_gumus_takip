import { prisma } from "@/lib/prisma";
import PriceChart from "@/components/PriceChart";
import ThemeToggle from "@/components/ThemeToggle";
import AutoRefresh from "@/components/AutoRefresh";
import PriceCard from "@/components/PriceCard";
import { performPriceSync } from "./actions";
import { PriceRecord } from "@prisma/client";

/**
 * Fetches initial data for the dashboard, including current prices,
 * request limits, and price history.
 */
async function getInitialData() {
  const latestGold = await prisma.priceRecord.findFirst({
    where: { symbol: "GA" },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const syncThreshold = new Date(now.getTime() - 1 * 60 * 1000); // Sync every minute if needed

  let remaining: number | null = null;

  // Auto-sync if data is missing, older than threshold, or we don't have the 'remaining' count.
  // Since fetchPrices has a 60s cache, this won't over-request the API on frequent refreshes.
  if (
    !latestGold ||
    latestGold.createdAt < syncThreshold ||
    remaining === null
  ) {
    try {
      const result = await performPriceSync();
      if (result.success && "remaining" in result) {
        remaining = result.remaining ?? null;
      }
    } catch (e) {
      console.error("Auto-sync failed during page load:", e);
    }
  }

  const [currentGA, currentGAG] = await Promise.all([
    prisma.priceRecord.findFirst({
      where: { symbol: "GA" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.priceRecord.findFirst({
      where: { symbol: "GAG" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const [goldHistory, silverHistory] = await Promise.all([
    prisma.priceRecord.findMany({
      where: { symbol: "GA" },
      orderBy: { createdAt: "desc" },
      take: 100, // Take more to allow for filtering duplicates
    }),
    prisma.priceRecord.findMany({
      where: { symbol: "GAG" },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  /**
   * Formats history and filters out records where the price hasn't changed
   * to keep the chart clean and meaningful.
   */
  const formatHistory = (history: PriceRecord[]) => {
    const reversed = [...history].reverse();
    const filtered: (PriceRecord & { time: string; date: string })[] = [];

    reversed.forEach((item, index) => {
      const prev = index > 0 ? reversed[index - 1] : null;

      // Keep record if:
      // 1. It's the first record
      // 2. Price (sell or buy) has changed since previous record
      // 3. It's the very latest record (last in array)
      if (
        !prev ||
        item.sell !== prev.sell ||
        item.buy !== prev.buy ||
        index === reversed.length - 1
      ) {
        filtered.push({
          ...item,
          time: item.createdAt.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: item.createdAt.toLocaleDateString("tr-TR"),
        });
      }
    });

    // Limit to 50 records for chart performance after filtering
    return filtered.slice(-50);
  };

  return {
    currentPrices: {
      GA: currentGA,
      GAG: currentGAG,
    },
    remaining,
    goldHistory: formatHistory(goldHistory),
    silverHistory: formatHistory(silverHistory),
  };
}

export default async function Home() {
  const { currentPrices, remaining, goldHistory, silverHistory } =
    await getInitialData();

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-black text-zinc-900 dark:text-zinc-50 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black pb-24 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 md:mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-black text-xl">
                ₺
              </div>
              <span className="text-sm font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                GenelPara Piyasa
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 leading-[0.85]">
              Varlık{" "}
              <span className="text-zinc-400 dark:text-zinc-600">Takibi</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-lg">
              Altın ve gümüş fiyatlarını estetik, sade ve hızlı şekilde takip
              edin.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Current Prices Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 mb-24">
          <PriceCard name="Gram Altın" data={currentPrices.GA} />
          <PriceCard name="Gram Gümüş" data={currentPrices.GAG} />
        </div>

        {/* Trends and Charts Section */}
        <div className="space-y-12">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Piyasa Trendleri
            </h3>
            <div className="hidden md:block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Görselleştirme: Filtrelenmiş Veri Akışı
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-white dark:bg-zinc-950/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm">
              <PriceChart data={goldHistory} title="Altın (GA/TRY)" />
            </div>
            <div className="bg-white dark:bg-zinc-950/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm">
              <PriceChart data={silverHistory} title="Gümüş (GAG/TRY)" />
            </div>
          </div>
        </div>

        {/* Footer with Status and API Info */}
        <footer className="mt-40 pt-16 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="font-black text-zinc-900 dark:text-zinc-50 text-lg tracking-tighter">
                  Sistem Aktif
                </p>
              </div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm max-w-xs leading-relaxed font-medium">
                Veriler anlık olarak genelpara.com API servisleri üzerinden
                güvenli şekilde sağlanmaktadır.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                API İstek Durumu
              </p>
              <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                    Kalan
                  </span>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                    {remaining ?? "---"}
                  </span>
                </div>
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                    Günlük
                  </span>
                  <span className="text-sm font-black text-zinc-400 dark:text-zinc-600">
                    1000
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Background Auto-Refresh Controller */}
      <AutoRefresh remainingRequests={remaining} />
    </main>
  );
}
