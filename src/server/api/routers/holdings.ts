import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { supabaseAdmin } from "~/lib/supabase-server";
import type { Holding, HoldingSummary } from "~/types/holdings";

export const holdingsRouter = createTRPCRouter({
  // Get all holdings for the current user
  getAll: protectedProcedure.query(async ({ ctx }): Promise<Holding[]> => {
    const { data, error } = await supabaseAdmin
      .from("holdings")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as Holding[]) ?? [];
  }),

  // Create a new holding
  create: protectedProcedure
    .input(
      z.object({
        metal_type: z.enum(["gold", "silver"]),
        weight_oz: z.number().positive(),
        form_type: z.enum(["bar", "coin"]),
        denomination: z.string(),
        quantity: z.number().int().positive().default(1),
        purchase_price_aud: z.number().positive().optional(),
        purchase_date: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Holding> => {
      const result = await supabaseAdmin
        .from("holdings")
        .insert({
          user_id: ctx.user.id,
          metal_type: input.metal_type,
          weight_oz: input.weight_oz,
          form_type: input.form_type,
          denomination: input.denomination,
          quantity: input.quantity,
          purchase_price_aud: input.purchase_price_aud,
          purchase_date: input.purchase_date,
          notes: input.notes,
        })
        .select()
        .single();

      if (result.error) throw new Error(result.error.message);
      return result.data as Holding;
    }),

  // Update a holding
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        metal_type: z.enum(["gold", "silver"]).optional(),
        weight_oz: z.number().positive().optional(),
        form_type: z.enum(["bar", "coin"]).optional(),
        denomination: z.string().optional(),
        quantity: z.number().int().positive().optional(),
        purchase_price_aud: z.number().positive().optional(),
        purchase_date: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Holding> => {
      const { id, ...updateData } = input;
      
      const result = await supabaseAdmin
        .from("holdings")
        .update({
          metal_type: updateData.metal_type,
          weight_oz: updateData.weight_oz,
          form_type: updateData.form_type,
          denomination: updateData.denomination,
          quantity: updateData.quantity,
          purchase_price_aud: updateData.purchase_price_aud,
          purchase_date: updateData.purchase_date,
          notes: updateData.notes,
        })
        .eq("id", id)
        .eq("user_id", ctx.user.id) // Ensure user can only update their own holdings
        .select()
        .single();

      if (result.error) throw new Error(result.error.message);
      return result.data as Holding;
    }),

  // Delete a holding
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabaseAdmin
        .from("holdings")
        .delete()
        .eq("id", input.id)
        .eq("user_id", ctx.user.id); // Ensure user can only delete their own holdings

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  // Get portfolio summary
  getSummary: protectedProcedure.query(async ({ ctx }): Promise<HoldingSummary> => {
    const { data: holdings, error } = await supabaseAdmin
      .from("holdings")
      .select("*")
      .eq("user_id", ctx.user.id);

    if (error) throw new Error(error.message);

    // Get current prices from cache (this will trigger API call if cache is stale)
    const { data: prices, error: priceError } = await supabaseAdmin
      .from("price_cache")
      .select("*");

    if (priceError) throw new Error(priceError.message);

    const pricesArray = prices as Array<{ metal_type: string; price_aud: number }> ?? [];
    const goldPrice = pricesArray.find((p: { metal_type: string; price_aud: number }) => p.metal_type === 'gold')?.price_aud ?? 0;
    const silverPrice = pricesArray.find((p: { metal_type: string; price_aud: number }) => p.metal_type === 'silver')?.price_aud ?? 0;

    // Calculate totals
    const holdingsArray = holdings as Holding[] ?? [];
    const totalGoldOz = holdingsArray
      .filter((h: Holding) => h.metal_type === 'gold')
      .reduce((sum: number, h: Holding) => sum + (h.weight_oz * h.quantity), 0);

    const totalSilverOz = holdingsArray
      .filter((h: Holding) => h.metal_type === 'silver')
      .reduce((sum: number, h: Holding) => sum + (h.weight_oz * h.quantity), 0);

    const goldValue = totalGoldOz * goldPrice;
    const silverValue = totalSilverOz * silverPrice;
    const totalValue = goldValue + silverValue;

    return {
      totalValue,
      goldValue,
      silverValue,
      totalGoldOz,
      totalSilverOz,
      goldPrice,
      silverPrice,
      totalHoldings: holdingsArray.length,
    };
  }),

  // Get holdings by metal type
  getByMetalType: protectedProcedure
    .input(z.object({ metal_type: z.enum(["gold", "silver"]) }))
    .query(async ({ ctx, input }): Promise<Holding[]> => {
      const { data, error } = await supabaseAdmin
        .from("holdings")
        .select("*")
        .eq("user_id", ctx.user.id)
        .eq("metal_type", input.metal_type)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Holding[]) ?? [];
    }),
});
