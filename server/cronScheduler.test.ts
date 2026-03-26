import { describe, expect, it } from "vitest";
import { calcNextRunAt } from "./cronScheduler";

describe("calcNextRunAt", () => {
  it("should return a future date", () => {
    const now = new Date();
    // 使用一个肯定在未来的时间（23:59）
    const next = calcNextRunAt(23, 59);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should schedule for tomorrow if today's time has passed", () => {
    // 使用 00:00，此时间在 UTC+8 下已过（当前时间必然 > 00:00）
    const next = calcNextRunAt(0, 0);
    const now = new Date();
    // 下次执行应该在未来（明天的 00:00 CST）
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should return a Date object", () => {
    const next = calcNextRunAt(8, 0);
    expect(next).toBeInstanceOf(Date);
    expect(isNaN(next.getTime())).toBe(false);
  });

  it("should produce different times for different inputs", () => {
    const next8 = calcNextRunAt(8, 0);
    const next9 = calcNextRunAt(9, 0);
    // 9:00 应该比 8:00 晚 1 小时（或晚 23 小时，取决于当前时间）
    const diffMs = Math.abs(next9.getTime() - next8.getTime());
    // 差值应该是 1 小时或 23 小时（跨天情况）
    const oneHour = 60 * 60 * 1000;
    const twentyThreeHours = 23 * oneHour;
    expect(diffMs === oneHour || diffMs === twentyThreeHours).toBe(true);
  });

  it("should handle minute offset correctly", () => {
    const next0 = calcNextRunAt(8, 0);
    const next30 = calcNextRunAt(8, 30);
    const diffMs = Math.abs(next30.getTime() - next0.getTime());
    const thirtyMin = 30 * 60 * 1000;
    // 差值应该是 30 分钟或 (24h - 30min)
    const almostDay = 24 * 60 * 60 * 1000 - thirtyMin;
    expect(diffMs === thirtyMin || diffMs === almostDay).toBe(true);
  });
});
