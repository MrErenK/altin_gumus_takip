/**
 * Telegram Notification Library
 * Handles sending price updates to a specified Telegram Chat via Bot API.
 */

interface PriceUpdate {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  ratio: number;
  direction: string;
  change: number;
}

/**
 * Sends a formatted price update message to Telegram.
 */
export async function sendTelegramNotification(updates: PriceUpdate[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.",
    );
    return;
  }

  const dateStr = new Date().toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let message = `🔔 *Piyasa Güncellemesi*\n📅 ${dateStr}\n\n`;

  updates.forEach((update) => {
    const isUp = update.direction === "moneyUp";
    const emoji = isUp ? "📈" : "📉";
    const trend = isUp ? "Yükseliş" : "Düşüş";

    message += `*${update.name} (${update.symbol})*\n`;
    message += `${emoji} Durum: ${trend} (%${Math.abs(update.ratio).toFixed(2)})\n`;
    message += `💰 Satış: *${update.sell.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺*\n`;
    message += `📥 Alış: ${update.buy.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺\n`;
    message += `📊 Değişim: ${update.change.toFixed(2)}₺\n\n`;
  });

  message += `_Otomatik sistem tarafından gönderilmiştir._`;
  message += "\n\n";
  message += "Website: https://altin.mrerenk.tr";

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API Error: ${JSON.stringify(errorData)}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Telegram] Failed to send notification:", error);
    return { success: false, error };
  }
}
