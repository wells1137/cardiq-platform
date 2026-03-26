import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../server/db", () => ({
  getAllCards: vi.fn(),
  getTrendHistory: vi.fn(),
}));

vi.mock("../../../server/signalIntelligenceService", () => ({
  getCardTrendIntelligence: vi.fn(),
}));

import { getAllCards, getTrendHistory } from "../../../server/db";
import { getCardTrendIntelligence } from "../../../server/signalIntelligenceService";
import { buildDailyTrendSummary, buildMarketIntelligenceBoard, buildTrendMoversBoard } from "../../../server/marketIntelligenceService";

describe("market intelligence boards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups bullish and bearish cards into ranked boards", async () => {
    vi.mocked(getAllCards).mockResolvedValue([
      { id: 1, playerName: "A", sport: "NBA", year: 2023, brand: "Prizm", set: "Base", parallel: "Silver", currentPrice: 100 },
      { id: 2, playerName: "B", sport: "NBA", year: 2022, brand: "Select", set: "Premier", parallel: "Base", currentPrice: 80 },
      { id: 3, playerName: "C", sport: "NFL", year: 2021, brand: "Mosaic", set: "Base", parallel: "Gold", currentPrice: 60 },
    ] as any);

    vi.mocked(getCardTrendIntelligence)
      .mockResolvedValueOnce({ trend: "bullish", confidence: 88, compositeScore: 90, summary: "strong", playerName: "A", cardId: 1, onCourt: {} as any, offCourt: {} as any, market: {} as any })
      .mockResolvedValueOnce({ trend: "bearish", confidence: 80, compositeScore: 40, summary: "weak", playerName: "B", cardId: 2, onCourt: {} as any, offCourt: {} as any, market: {} as any })
      .mockResolvedValueOnce({ trend: "neutral", confidence: 70, compositeScore: 62, summary: "flat", playerName: "C", cardId: 3, onCourt: {} as any, offCourt: {} as any, market: {} as any });

    const result = await buildMarketIntelligenceBoard(10);

    expect(result.scanned).toBe(3);
    expect(result.bullish).toHaveLength(1);
    expect(result.bearish).toHaveLength(1);
    expect(result.neutral).toHaveLength(1);
  });

  it("builds movers board using previous snapshots", async () => {
    vi.mocked(getAllCards).mockResolvedValue([
      { id: 1, playerName: "A", sport: "NBA", year: 2023, brand: "Prizm", set: "Base", parallel: "Silver", currentPrice: 100 },
      { id: 2, playerName: "B", sport: "NBA", year: 2022, brand: "Select", set: "Premier", parallel: "Base", currentPrice: 80 },
    ] as any);
    vi.mocked(getCardTrendIntelligence)
      .mockResolvedValueOnce({ trend: "bullish", confidence: 88, compositeScore: 90, summary: "up", playerName: "A", cardId: 1, onCourt: {} as any, offCourt: {} as any, market: {} as any })
      .mockResolvedValueOnce({ trend: "bearish", confidence: 75, compositeScore: 45, summary: "down", playerName: "B", cardId: 2, onCourt: {} as any, offCourt: {} as any, market: {} as any });
    vi.mocked(getTrendHistory)
      .mockResolvedValueOnce([{ id: 10, cardId: 1, trend: "neutral", confidence: 70, compositeScore: 70, createdAt: new Date(), source: "scan", notes: null }] as any)
      .mockResolvedValueOnce([{ id: 11, cardId: 2, trend: "bullish", confidence: 80, compositeScore: 65, createdAt: new Date(), source: "scan", notes: null }] as any);

    const movers = await buildTrendMoversBoard(10);
    expect(movers.risers[0]?.cardId).toBe(1);
    expect(movers.risers[0]?.eventLabel).toContain("趋势反转");
    expect(movers.fallers[0]?.cardId).toBe(2);
    expect(movers.fallers[0]?.eventSeverity).toBe("high");
  });

  it("includes reversal count in daily trend summary", async () => {
    vi.mocked(getAllCards).mockResolvedValue([
      { id: 1, playerName: "A", sport: "NBA", year: 2023, brand: "Prizm", set: "Base", parallel: "Silver", currentPrice: 100 },
      { id: 2, playerName: "B", sport: "NBA", year: 2022, brand: "Select", set: "Premier", parallel: "Base", currentPrice: 80 },
    ] as any);
    vi.mocked(getCardTrendIntelligence)
      .mockResolvedValueOnce({ trend: "bullish", confidence: 88, compositeScore: 90, summary: "up", playerName: "A", cardId: 1, onCourt: {} as any, offCourt: {} as any, market: {} as any })
      .mockResolvedValueOnce({ trend: "bearish", confidence: 75, compositeScore: 45, summary: "down", playerName: "B", cardId: 2, onCourt: {} as any, offCourt: {} as any, market: {} as any });
    vi.mocked(getTrendHistory)
      .mockResolvedValueOnce([{ id: 10, cardId: 1, trend: "neutral", confidence: 70, compositeScore: 70, createdAt: new Date(), source: "scan", notes: null }] as any)
      .mockResolvedValueOnce([{ id: 11, cardId: 2, trend: "bullish", confidence: 80, compositeScore: 65, createdAt: new Date(), source: "scan", notes: null }] as any);

    const summary = await buildDailyTrendSummary(10, "24H");
    expect(summary.reversalCount).toBe(2);
    expect(summary.summary).toContain("反转 2 张");
  });
});
