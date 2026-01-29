import { eq, and, gte } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { priceCache, priceHistory } from "~/server/db/schema";
import { env } from "~/env.js";
import { z } from "zod";
import type { PriceCache } from "~/types/holdings";
import type { MetalsDevResponse } from "~/types/api";
import type { DetailedPrices, PriceHistory as PriceHistoryType } from "~/types/prices";

function priceRowToCache(row: { id: string; metalType: string; priceAud: string; updatedAt: Date | null }): PriceCache {
  return {
    id: row.id,
    metal_type: row.metalType as "gold" | "silver",
    price_aud: Number(row.priceAud),
    updated_at: row.updatedAt?.toISOString() ?? "",
  };
}

export const pricesRouter = createTRPCRouter({
  getCurrentPrices: publicProcedure.query(async (): Promise<PriceCache[]> => {
    const rows = await db.select().from(priceCache);
    return rows.map(priceRowToCache);
  }),

  getDetailedPrices: publicProcedure.query(async (): Promise<DetailedPrices> => {
    try {
      const cachedRows = await db.select().from(priceCache);
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const hasValidCache =
        cachedRows.length === 2 &&
        cachedRows.every((p) => p.updatedAt && new Date(p.updatedAt) > sixHoursAgo);

      if (hasValidCache) {
        const gold = cachedRows.find((p) => p.metalType === "gold");
        const silver = cachedRows.find((p) => p.metalType === "silver");
        if (gold && silver) {
          return {
            gold: {
              price: Number(gold.priceAud),
              timestamp: gold.updatedAt?.toISOString() ?? "",
            },
            silver: {
              price: Number(silver.priceAud),
              timestamp: silver.updatedAt?.toISOString() ?? "",
            },
          };
        }
      }

      if (!env.METALS_DEV_KEY) {
        return await getCachedPrices();
      }

      const response = await fetch(
        `https://api.metals.dev/v1/latest?api_key=${env.METALS_DEV_KEY}&currency=AUD&unit=toz`
      );
      if (!response.ok) return await getCachedPrices();

      const data = (await response.json()) as MetalsDevResponse;
      if (data.status !== "success") return await getCachedPrices();

      await updatePriceCache(data.metals.gold, data.metals.silver, data.timestamps.metal);

      return {
        gold: { price: data.metals.gold, timestamp: data.timestamps.metal },
        silver: { price: data.metals.silver, timestamp: data.timestamps.metal },
      };
    } catch (error) {
      console.error("Error fetching detailed prices:", error);
      return await getCachedPrices();
    }
  }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        metal_type: z.enum(["gold", "silver"]).optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }): Promise<PriceHistoryType[]> => {
      const fromDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!;
      const metalType = input.metal_type ?? "gold";
      const rows = await db
        .select()
        .from(priceHistory)
        .where(
          and(
            eq(priceHistory.metalType, metalType),
            gte(priceHistory.recordedDate, fromDate)
          )
        )
        .orderBy(priceHistory.recordedDate);

      return rows.map((r) => ({
        id: r.id,
        metal_type: r.metalType,
        price_aud: Number(r.priceAud),
        recorded_date: r.recordedDate,
        created_at: r.createdAt?.toISOString() ?? "",
      }));
    }),
});

async function getCachedPrices(): Promise<DetailedPrices> {
  const rows = await db.select().from(priceCache);
  const gold = rows.find((p) => p.metalType === "gold");
  const silver = rows.find((p) => p.metalType === "silver");
  const now = new Date().toISOString();
  return {
    gold: {
      price: gold ? Number(gold.priceAud) : 3000,
      timestamp: gold?.updatedAt?.toISOString() ?? now,
    },
    silver: {
      price: silver ? Number(silver.priceAud) : 40.25,
      timestamp: silver?.updatedAt?.toISOString() ?? now,
    },
  };
}

async function updatePriceCache(
  goldPrice: number,
  silverPrice: number,
  _timestamp: string
): Promise<void> {
  const now = new Date();
  const today = new Date().toISOString().split("T")[0]!;

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
}
