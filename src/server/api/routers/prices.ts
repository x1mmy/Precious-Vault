import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { supabaseAdmin } from "~/lib/supabase-server";
import { env } from "~/env.js";
import { z } from "zod";
import type { PriceCache } from "~/types/holdings";
import type { MetalsDevResponse } from "~/types/api";
import type { DetailedPrices, PriceHistory } from "~/types/prices";

export const pricesRouter = createTRPCRouter({
  getCurrentPrices: publicProcedure.query(async (): Promise<PriceCache[]> => {
    const { data, error } = await supabaseAdmin
      .from("price_cache")
      .select("*");

    if (error) {
      console.error("Error fetching prices:", error);
      return [];
    }
    return (data as PriceCache[]) ?? [];
  }),

  getDetailedPrices: publicProcedure.query(async (): Promise<DetailedPrices> => {
    try {
      // Check if we have valid cached data (less than 6 hours old)
      const { data: cachedPrices, error } = await supabaseAdmin
        .from("price_cache")
        .select("*");

      if (error) {
        console.error("Error fetching cached prices:", error);
        return await getCachedPrices();
      }

      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const pricesArray = cachedPrices as PriceCache[] ?? [];
      const hasValidCache = pricesArray.every((price: PriceCache) => 
        new Date(price.updated_at) > sixHoursAgo
      );

      // If we have valid cached data, return it
      if (hasValidCache && pricesArray.length === 2) {
        const goldPrice = pricesArray.find((p: PriceCache) => p.metal_type === 'gold');
        const silverPrice = pricesArray.find((p: PriceCache) => p.metal_type === 'silver');
        
        if (goldPrice && silverPrice) {
          return {
            gold: {
              price: goldPrice.price_aud,
              timestamp: goldPrice.updated_at,
            },
            silver: {
              price: silverPrice.price_aud,
              timestamp: silverPrice.updated_at,
            },
          };
        }
      }

      // Cache is stale or missing, fetch fresh data from metals.dev
      if (!env.METALS_DEV_KEY) {
        console.warn('METALS_DEV_KEY not configured');
        return await getCachedPrices();
      }

      const response = await fetch(
        `https://api.metals.dev/v1/latest?api_key=${env.METALS_DEV_KEY}&currency=AUD&unit=toz`
      );

      if (!response.ok) {
        console.warn('Metals.dev API request failed. Using cached data.');
        return await getCachedPrices();
      }

      const data = await response.json() as MetalsDevResponse;

      if (data.status !== 'success') {
        console.warn('Metals.dev API returned error status. Using cached data.');
        return await getCachedPrices();
      }

      // Update price_cache with fresh data
      await updatePriceCache(data.metals.gold, data.metals.silver, data.timestamps.metal);

      return {
        gold: {
          price: data.metals.gold,
          timestamp: data.timestamps.metal,
        },
        silver: {
          price: data.metals.silver,
          timestamp: data.timestamps.metal,
        },
      };
    } catch (error) {
      console.error("Error fetching detailed prices from metals.dev:", error);
      return await getCachedPrices();
    }
  }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        metal_type: z.enum(['gold', 'silver']).optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }): Promise<PriceHistory[]> => {
      const { data, error } = await supabaseAdmin
        .from("price_history")
        .select("*")
        .eq(input.metal_type ? "metal_type" : "metal_type", input.metal_type ?? "gold")
        .gte("recorded_date", new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("recorded_date", { ascending: true });

      if (error) {
        console.error("Error fetching price history:", error);
        return [];
      }
      return (data as PriceHistory[]) ?? [];
    }),
});

async function getCachedPrices(): Promise<DetailedPrices> {
  const { data: cachedPrices, error } = await supabaseAdmin
    .from("price_cache")
    .select("*");

  if (error) {
    console.error("Error fetching cached prices:", error);
    return getMockPrices();
  }

  const pricesArray = cachedPrices as PriceCache[] ?? [];
  if (!pricesArray.length) {
    return getMockPrices();
  }

  const goldPrice = pricesArray.find((p: PriceCache) => p.metal_type === 'gold');
  const silverPrice = pricesArray.find((p: PriceCache) => p.metal_type === 'silver');

  return {
    gold: {
      price: goldPrice?.price_aud ?? 3000.00,
      timestamp: goldPrice?.updated_at ?? new Date().toISOString(),
    },
    silver: {
      price: silverPrice?.price_aud ?? 40.00,
      timestamp: silverPrice?.updated_at ?? new Date().toISOString(),
    },
  };
}

async function updatePriceCache(goldPrice: number, silverPrice: number, _timestamp: string): Promise<void> {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    // Update price_cache table
    await supabaseAdmin
      .from("price_cache")
      .upsert([
        {
          metal_type: 'gold',
          price_aud: goldPrice,
          updated_at: now,
        },
        {
          metal_type: 'silver',
          price_aud: silverPrice,
          updated_at: now,
        },
      ], {
        onConflict: 'metal_type',
      });

    // Insert into price_history table (only once per day)
    await supabaseAdmin
      .from("price_history")
      .upsert([
        {
          metal_type: 'gold',
          price_aud: goldPrice,
          recorded_date: today,
        },
        {
          metal_type: 'silver',
          price_aud: silverPrice,
          recorded_date: today,
        },
      ], {
        onConflict: 'metal_type,recorded_date',
      });
  } catch (error) {
    console.error("Error updating price cache:", error);
  }
}

function getMockPrices(): DetailedPrices {
  const now = new Date().toISOString();
  return {
    gold: {
      price: 3000.00,
      timestamp: now,
    },
    silver: {
      price: 40.25,
      timestamp: now,
    },
  };
}