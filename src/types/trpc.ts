import type { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<typeof appRouter>;

export type HoldingsSummaryOutput = RouterOutput["holdings"]["getSummary"];
export type HoldingsAllOutput = RouterOutput["holdings"]["getAll"];
export type DetailedPricesOutput = RouterOutput["prices"]["getDetailedPrices"];
