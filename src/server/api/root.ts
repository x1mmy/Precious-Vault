import { postRouter } from "~/server/api/routers/post";
import { holdingsRouter } from "~/server/api/routers/holdings";
import { pricesRouter } from "~/server/api/routers/prices";
import { notificationSettingsRouter } from "~/server/api/routers/notification-settings";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  holdings: holdingsRouter,
  prices: pricesRouter,
  notificationSettings: notificationSettingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
