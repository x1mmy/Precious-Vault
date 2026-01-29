import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { notificationSettings } from "~/server/db/schema";

export const notificationSettingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, ctx.user.id))
      .limit(1);
    return (
      row ?? {
        userId: ctx.user.id,
        dailyDigestEnabled: false,
        discordWebhookUrl: null,
        createdAt: null,
        updatedAt: null,
      }
    );
  }),

  update: protectedProcedure
    .input(
      z.object({
        dailyDigestEnabled: z.boolean().optional(),
        discordWebhookUrl: z
          .union([z.string().url(), z.literal("")])
          .optional()
          .transform((v) => (v === "" || v === undefined ? null : v)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, ctx.user.id))
        .limit(1);

      const dailyDigestEnabled = input.dailyDigestEnabled ?? existing?.dailyDigestEnabled ?? false;
      const discordWebhookUrl = input.discordWebhookUrl !== undefined ? input.discordWebhookUrl : existing?.discordWebhookUrl ?? null;

      if (existing) {
        const [updated] = await db
          .update(notificationSettings)
          .set({
            dailyDigestEnabled,
            discordWebhookUrl,
            updatedAt: new Date(),
          })
          .where(eq(notificationSettings.userId, ctx.user.id))
          .returning();
        return updated!;
      }

      const [inserted] = await db
        .insert(notificationSettings)
        .values({
          userId: ctx.user.id,
          dailyDigestEnabled,
          discordWebhookUrl,
        })
        .returning();
      return inserted!;
    }),

  sendTestMessage: protectedProcedure.mutation(async ({ ctx }) => {
    const [row] = await db
      .select({ discordWebhookUrl: notificationSettings.discordWebhookUrl })
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, ctx.user.id))
      .limit(1);

    const webhookUrl = row?.discordWebhookUrl?.trim();
    if (!webhookUrl) {
      throw new Error("No Discord webhook URL saved. Save your webhook URL first.");
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "**PreciousVault test** — If you see this, your Discord webhook is working. You'll receive daily digests here when the daily summary is enabled.",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord webhook failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return { ok: true };
  }),
});
