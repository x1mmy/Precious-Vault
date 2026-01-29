import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { notificationSettings, holdings, priceCache } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "~/env.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: call this route once per day (e.g. 0 8 * * * for 8am UTC).
 * Set CRON_SECRET in Vercel and send it as Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSettings = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.dailyDigestEnabled, true));

  const toNotify = allSettings.filter(
    (s) => s.discordWebhookUrl && s.discordWebhookUrl.trim() !== ""
  );

  const priceRows = await db.select().from(priceCache);
  const goldPrice = Number(priceRows.find((p) => p.metalType === "gold")?.priceAud ?? 0);
  const silverPrice = Number(priceRows.find((p) => p.metalType === "silver")?.priceAud ?? 0);

  const formatAud = (n: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

  let sent = 0;
  for (const settings of toNotify) {
    const userId = settings.userId;
    const webhookUrl = settings.discordWebhookUrl!.trim();

    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    const totalGoldOz = userHoldings
      .filter((h) => h.metalType === "gold")
      .reduce((sum, h) => sum + Number(h.weightOz) * h.quantity, 0);
    const totalSilverOz = userHoldings
      .filter((h) => h.metalType === "silver")
      .reduce((sum, h) => sum + Number(h.weightOz) * h.quantity, 0);
    const totalValue = totalGoldOz * goldPrice + totalSilverOz * silverPrice;

    const content = [
      "**PreciousVault Daily Digest**",
      "",
      `**Spot prices (AUD/toz)**`,
      `Gold: ${formatAud(goldPrice)}`,
      `Silver: ${formatAud(silverPrice)}`,
      "",
      `**Your portfolio**`,
      `Total value: ${formatAud(totalValue)}`,
      `Gold: ${totalGoldOz.toFixed(2)} oz | Silver: ${totalSilverOz.toFixed(2)} oz`,
    ].join("\n");

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) sent++;
      else console.error(`Discord webhook failed for user ${userId}: ${res.status}`);
    } catch (err) {
      console.error(`Discord webhook error for user ${userId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, total: toNotify.length });
}
