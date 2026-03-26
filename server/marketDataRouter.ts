import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getCardById } from "./db";
import { getMarketDataStatus, lookupCardMarketData } from "./marketDataService";

export const marketDataRouter = router({
  status: publicProcedure.query(async () => getMarketDataStatus()),

  lookupByCard: publicProcedure
    .input(z.object({ cardId: z.number() }))
    .query(async ({ input }) => {
      const card = await getCardById(input.cardId);
      if (!card) throw new Error("Card not found");
      return lookupCardMarketData(card as any);
    }),
});
