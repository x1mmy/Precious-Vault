import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { holdings as holdingsTable, priceCache } from "~/server/db/schema";
import type { Holding, HoldingSummary } from "~/types/holdings";

function rowToHolding(row: {
  id: string;
  userId: string;
  metalType: "gold" | "silver";
  weightOz: string;
  formType: "bar" | "coin";
  denomination: string;
  quantity: number;
  purchasePriceAud: string | null;
  purchaseDate: Date | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): Holding {
  return {
    id: row.id,
    user_id: row.userId,
    metal_type: row.metalType,
    weight_oz: Number(row.weightOz),
    form_type: row.formType,
    denomination: row.denomination,
    quantity: row.quantity,
    purchase_price_aud: row.purchasePriceAud ? Number(row.purchasePriceAud) : undefined,
    purchase_date: row.purchaseDate?.toISOString(),
    notes: row.notes ?? undefined,
    created_at: row.createdAt?.toISOString() ?? "",
    updated_at: row.updatedAt?.toISOString() ?? "",
  };
}

export const holdingsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }): Promise<Holding[]> => {
    const rows = await db
      .select()
      .from(holdingsTable)
      .where(eq(holdingsTable.userId, ctx.user.id))
      .orderBy(desc(holdingsTable.createdAt));
    return rows.map(rowToHolding);
  }),

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
      const [row] = await db
        .insert(holdingsTable)
        .values({
          userId: ctx.user.id,
          metalType: input.metal_type,
          weightOz: String(input.weight_oz),
          formType: input.form_type,
          denomination: input.denomination,
          quantity: input.quantity,
          purchasePriceAud: input.purchase_price_aud != null ? String(input.purchase_price_aud) : null,
          purchaseDate: input.purchase_date ? new Date(input.purchase_date) : null,
          notes: input.notes ?? null,
        })
        .returning();
      if (!row) throw new Error("Failed to create holding");
      return rowToHolding(row);
    }),

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
      const { id, ...updates } = input;
      const [row] = await db
        .update(holdingsTable)
        .set({
          ...(updates.metal_type != null && { metalType: updates.metal_type }),
          ...(updates.weight_oz != null && { weightOz: String(updates.weight_oz) }),
          ...(updates.form_type != null && { formType: updates.form_type }),
          ...(updates.denomination != null && { denomination: updates.denomination }),
          ...(updates.quantity != null && { quantity: updates.quantity }),
          ...(updates.purchase_price_aud != null && { purchasePriceAud: String(updates.purchase_price_aud) }),
          ...(updates.purchase_date != null && { purchaseDate: new Date(updates.purchase_date) }),
          ...(updates.notes !== undefined && { notes: updates.notes ?? null }),
          updatedAt: new Date(),
        })
        .where(and(eq(holdingsTable.id, id), eq(holdingsTable.userId, ctx.user.id)))
        .returning();
      if (!row) throw new Error("Holding not found or access denied");
      return rowToHolding(row);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(holdingsTable)
        .where(and(eq(holdingsTable.id, input.id), eq(holdingsTable.userId, ctx.user.id)));
      return { success: true };
    }),

  getSummary: protectedProcedure.query(async ({ ctx }): Promise<HoldingSummary> => {
    const holdingsRows = await db
      .select()
      .from(holdingsTable)
      .where(eq(holdingsTable.userId, ctx.user.id));
    const pricesRows = await db.select().from(priceCache);

    const goldPrice = Number(pricesRows.find((p) => p.metalType === "gold")?.priceAud ?? 0);
    const silverPrice = Number(pricesRows.find((p) => p.metalType === "silver")?.priceAud ?? 0);

    const holdingsArray = holdingsRows.map(rowToHolding);
    const totalGoldOz = holdingsArray
      .filter((h) => h.metal_type === "gold")
      .reduce((sum, h) => sum + h.weight_oz * h.quantity, 0);
    const totalSilverOz = holdingsArray
      .filter((h) => h.metal_type === "silver")
      .reduce((sum, h) => sum + h.weight_oz * h.quantity, 0);

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

  getByMetalType: protectedProcedure
    .input(z.object({ metal_type: z.enum(["gold", "silver"]) }))
    .query(async ({ ctx, input }): Promise<Holding[]> => {
      const rows = await db
        .select()
        .from(holdingsTable)
        .where(
          and(
            eq(holdingsTable.userId, ctx.user.id),
            eq(holdingsTable.metalType, input.metal_type)
          )
        )
        .orderBy(desc(holdingsTable.createdAt));
      return rows.map(rowToHolding);
    }),
});
