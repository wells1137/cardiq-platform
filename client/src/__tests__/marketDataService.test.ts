import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../server/db", () => ({
  getPriceHistory: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("../../../server/_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { readFile } from "node:fs/promises";
import { invokeLLM } from "../../../server/_core/llm";
import { getPriceHistory } from "../../../server/db";
import { getMarketDataStatus, lookupCardMarketData } from "../../../server/marketDataService";

describe("marketDataService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    delete process.env.MARKET_DATA_MODE;
    delete process.env.MARKET_DATA_SOURCES;
    delete process.env.MARKET_DATA_FEED_URL;
    delete process.env.MARKET_DATA_FEED_URL_TEMPLATE;
    delete process.env.MARKET_DATA_CSV_PATH;
  });

  it("reports aggregate support sources", () => {
    process.env.MARKET_DATA_MODE = "aggregate";
    const status = getMarketDataStatus();
    expect(status.mode).toBe("aggregate");
    expect(status.supportedSources.length).toBeGreaterThan(3);
  });

  it("uses csv source and enables ai-assisted cleanup", async () => {
    process.env.MARKET_DATA_MODE = "csv";
    process.env.MARKET_DATA_CSV_PATH = "/tmp/cards.csv";
    vi.mocked(readFile).mockResolvedValue(`title,price,saleDate,source\n2023 Victor Wembanyama Prizm Silver PSA 10,220,2026-03-01,csv-import\n2023 Victor Wembanyama Prizm Silver PSA 10,220,2026-03-01,csv-import\n2023 Random Player Base,180,2026-03-01,csv-import` as any);
    vi.mocked(invokeLLM).mockResolvedValue({
      id: "1",
      created: Date.now(),
      model: "test",
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({ items: [
        { index: 0, matched: true, confidence: 94, normalizedTitle: "2023 Victor Wembanyama Prizm Silver PSA 10" },
        { index: 1, matched: true, confidence: 91, normalizedTitle: "2023 Victor Wembanyama Prizm Silver PSA 10" },
        { index: 2, matched: false, confidence: 92, suspect: true }
      ] }) } }],
    } as any);
    vi.mocked(getPriceHistory).mockResolvedValue([] as any);

    const result = await lookupCardMarketData({ id: 1, year: 2023, playerName: "Victor Wembanyama", brand: "Prizm", set: "Silver", grade: "PSA 10" });
    expect(result.aiAssisted).toBe(true);
    expect(result.recentSales.length).toBe(1);
    expect(result.sourceBreakdown[0]?.source).toContain("csv");
  });

  it("falls back to history when no external sales", async () => {
    process.env.MARKET_DATA_MODE = "feed";
    process.env.MARKET_DATA_FEED_URL = "https://example.com/feed";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));
    vi.mocked(invokeLLM).mockRejectedValue(new Error("no ai"));
    vi.mocked(getPriceHistory).mockResolvedValue([{ price: 100, saleDate: new Date("2026-03-01"), source: "mock", listingUrl: null, condition: "Raw" }] as any);

    const result = await lookupCardMarketData({ id: 1, playerName: "Test" });
    expect(result.recentSales[0]?.source).toBe("mock");
    expect(result.note).toContain("回退");
  });
});
