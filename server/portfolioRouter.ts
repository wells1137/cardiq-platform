import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  addPortfolioPosition,
  getCardById,
  getPortfolioSummary,
  getUserPortfolio,
  removePortfolioPosition,
  updatePortfolioPosition,
} from "./db";

export const portfolioRouter = router({
  get: publicProcedure.query(async () => {
    const positions = await getUserPortfolio(1);
    const enriched = await Promise.all(
      positions.map(async (position) => ({
        ...position,
        card: await getCardById(position.cardId),
      }))
    );
    const summary = await getPortfolioSummary(1);
    return { positions: enriched, summary };
  }),

  add: publicProcedure
    .input(
      z.object({
        cardId: z.number(),
        quantity: z.number().positive(),
        averageCost: z.number().positive(),
        targetPrice: z.number().positive().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await addPortfolioPosition({ userId: 1, ...input });
      return { success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        quantity: z.number().positive().optional(),
        averageCost: z.number().positive().optional(),
        targetPrice: z.number().positive().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePortfolioPosition(id, 1, data);
      return { success: true };
    }),

  remove: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await removePortfolioPosition(input.id, 1);
      return { success: true };
    }),
});
