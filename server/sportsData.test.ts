import { describe, expect, it } from "vitest";
import { calculatePerformanceScore } from "./sportsDataService";

// 模拟 BDL 球员数据结构
const mockNBAStats = [
  { pts: 28.5, reb: 7.2, ast: 6.1, stl: 1.5, blk: 0.8, fg_pct: 0.52, fg3_pct: 0.38, ft_pct: 0.88, min: "36:00", games_played: 10 },
  { pts: 30.0, reb: 6.8, ast: 7.5, stl: 1.2, blk: 0.5, fg_pct: 0.55, fg3_pct: 0.40, ft_pct: 0.90, min: "38:00", games_played: 10 },
  { pts: 25.0, reb: 8.0, ast: 5.5, stl: 1.8, blk: 1.2, fg_pct: 0.48, fg3_pct: 0.35, ft_pct: 0.85, min: "34:00", games_played: 10 },
];

const mockLowStats = [
  { pts: 8.0, reb: 2.0, ast: 1.5, stl: 0.3, blk: 0.1, fg_pct: 0.38, fg3_pct: 0.28, ft_pct: 0.70, min: "18:00", games_played: 5 },
];

describe("calculatePerformanceScore", () => {
  it("should return a score between 0 and 100", () => {
    const result = calculatePerformanceScore(mockNBAStats as any);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should return higher score for elite players", () => {
    const eliteResult = calculatePerformanceScore(mockNBAStats as any);
    const lowResult = calculatePerformanceScore(mockLowStats as any);
    expect(eliteResult.score).toBeGreaterThan(lowResult.score);
  });

  it("should return 50 for empty stats", () => {
    const result = calculatePerformanceScore([]);
    expect(result.score).toBe(50);
  });

  it("should include stats summary", () => {
    const result = calculatePerformanceScore(mockNBAStats as any);
    expect(result.summary).toBeDefined();
    expect(result.summary.pts).toBeGreaterThan(0);
    expect(result.summary.gamesPlayed).toBeGreaterThan(0);
  });

  it("should calculate correct average points", () => {
    const result = calculatePerformanceScore(mockNBAStats as any);
    const expectedPts = (28.5 + 30.0 + 25.0) / 3;
    expect(result.summary.pts).toBeCloseTo(expectedPts, 1);
  });
});
