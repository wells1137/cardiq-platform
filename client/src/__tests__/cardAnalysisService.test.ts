import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../server/_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "../../../server/_core/llm";
import { analyzeCardTrend } from "../../../server/cardAnalysisService";

const baseCard = {
  id: 1,
  playerName: "Victor Wembanyama",
  year: 2023,
  brand: "Panini Prizm",
  set: "Base",
  parallel: "Silver",
  grade: "PSA 10",
  currentPrice: 120,
  avgPrice30d: 135,
  priceChange7d: -3,
  dealScore: 81,
  population: 120,
};

const history = [
  { price: 110, saleDate: new Date(Date.now() - 86400000 * 3) },
  { price: 115, saleDate: new Date(Date.now() - 86400000 * 2) },
  { price: 120, saleDate: new Date(Date.now() - 86400000) },
];

describe("analyzeCardTrend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to deterministic analysis when llm fails", async () => {
    vi.mocked(invokeLLM).mockRejectedValue(new Error("network error"));

    const result = await analyzeCardTrend({ card: baseCard, history });

    expect(result.summary).toContain("Victor Wembanyama");
    expect(["BUY", "HOLD", "WAIT"]).toContain(result.signal);
    expect(result.factorScores.valuation).toBeGreaterThan(0);
    expect(result.thesis.length).toBeGreaterThan(0);
  });

  it("uses intelligence context to enrich analysis", async () => {
    vi.mocked(invokeLLM).mockRejectedValue(new Error("network error"));

    const result = await analyzeCardTrend({
      card: baseCard,
      history,
      intelligence: {
        cardId: 1,
        playerName: "Victor Wembanyama",
        trend: "bullish",
        confidence: 84,
        compositeScore: 88,
        summary: "赛场和市场同步走强",
        onCourt: { score: 92, trend: "强势", details: ["表现提升"] },
        offCourt: { score: 68, trend: "中性偏正", headlines: [], details: ["场外平稳"] },
        market: { score: 82, trend: "偏强", details: ["成交改善"] },
      },
    });

    expect(result.confidence).toBeGreaterThanOrEqual(58);
    expect(result.factorScores.momentum).toBeGreaterThan(0);
    expect(["BUY", "HOLD", "WAIT"]).toContain(result.signal);
  });
});
