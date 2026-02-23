import { db } from "~/server/db";
import { priceCache, priceHistory } from "~/server/db/schema";
import { env } from "~/env.js";
import type { MetalsDevResponse } from "~/types/api";

/**
 * Fetches latest gold/silver prices from Metals.dev and updates the price cache
 * and daily history. Call this before sending the daily digest so values are fresh.
 */
export async function refreshPriceCache(): Promise<boolean> {
  if (!env.METALS_DEV_KEY) return false;
  try {
    const response = await fetch(
      `https://api.metals.dev/v1/latest?api_key=${env.METALS_DEV_KEY}&currency=AUD&unit=toz`
    );
    if (!response.ok) return false;
    const data = (await response.json()) as MetalsDevResponse;
    if (data.status !== "success") return false;

    const now = new Date();
    const today = new Date().toISOString().split("T")[0]!;
    const goldPrice = data.metals.gold;
    const silverPrice = data.metals.silver;

    await db
      .insert(priceCache)
      .values({
        metalType: "gold",
        priceAud: String(goldPrice),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: priceCache.metalType,
        set: { priceAud: String(goldPrice), updatedAt: now },
      });
    await db
      .insert(priceCache)
      .values({
        metalType: "silver",
        priceAud: String(silverPrice),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: priceCache.metalType,
        set: { priceAud: String(silverPrice), updatedAt: now },
      });

    await db
      .insert(priceHistory)
      .values({
        metalType: "gold",
        priceAud: String(goldPrice),
        recordedDate: today,
      })
      .onConflictDoUpdate({
        target: [priceHistory.metalType, priceHistory.recordedDate],
        set: { priceAud: String(goldPrice) },
      });
    await db
      .insert(priceHistory)
      .values({
        metalType: "silver",
        priceAud: String(silverPrice),
        recordedDate: today,
      })
      .onConflictDoUpdate({
        target: [priceHistory.metalType, priceHistory.recordedDate],
        set: { priceAud: String(silverPrice) },
      });

    return true;
  } catch (error) {
    console.error("refreshPriceCache error:", error);
    return false;
  }
}
