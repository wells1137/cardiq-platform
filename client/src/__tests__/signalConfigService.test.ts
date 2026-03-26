import { beforeEach, describe, expect, it } from "vitest";
import { calculateCompositeSignalScore } from "../../../server/signalIntelligenceService";
import { getSignalSettings, normalizeSignalWeights, resetSignalSettings, updateSignalSettings } from "../../../server/signalConfigService";

describe("signal config service", () => {
  beforeEach(() => {
    resetSignalSettings();
  });

  it("normalizes weights to 100%", () => {
    expect(normalizeSignalWeights({ onCourt: 20, offCourt: 20, market: 20 })).toEqual({
      onCourt: 33.3,
      offCourt: 33.3,
      market: 33.3,
    });
  });

  it("updates signal settings and exposes summary", () => {
    const result = updateSignalSettings({ onCourt: 60, offCourt: 10, market: 30 });
    expect(result.normalizedWeights.onCourt).toBe(60);
    expect(result.summary).toContain("赛场");
    expect(getSignalSettings().weights.market).toBe(30);
  });

  it("applies weights to composite score", () => {
    const marketHeavy = calculateCompositeSignalScore(
      { onCourt: 90, offCourt: 40, market: 80 },
      { onCourt: 20, offCourt: 10, market: 70 }
    );
    const courtHeavy = calculateCompositeSignalScore(
      { onCourt: 90, offCourt: 40, market: 80 },
      { onCourt: 70, offCourt: 10, market: 20 }
    );

    expect(marketHeavy.compositeScore).toBeLessThan(courtHeavy.compositeScore);
    expect(courtHeavy.trend).toBe("bullish");
  });
});
