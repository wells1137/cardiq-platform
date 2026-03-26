import { getAllCards, getTrendHistory } from "./db";
import { getCardTrendIntelligence } from "./signalIntelligenceService";

export type TrendWindowKey = "24H" | "7D" | "30D";

export function resolveHistoryOffset(window: TrendWindowKey) {
  if (window === "7D") return 7;
  if (window === "30D") return 30;
  return 1;
}

export interface RankedTrendItem {
  cardId: number;
  playerName: string;
  sport: string;
  title: string;
  currentPrice: number;
  trend: "bullish" | "neutral" | "bearish";
  confidence: number;
  compositeScore: number;
  summary: string;
}

export interface TrendMoverItem extends RankedTrendItem {
  deltaScore: number;
  previousScore?: number;
  previousTrend?: "bullish" | "neutral" | "bearish";
  eventLabel: string;
  eventSeverity: "high" | "medium" | "low";
}

export interface TrendMoversBoard {
  risers: TrendMoverItem[];
  fallers: TrendMoverItem[];
}

export interface MarketIntelligenceBoard {
  scanned: number;
  bullish: RankedTrendItem[];
  bearish: RankedTrendItem[];
  neutral: RankedTrendItem[];
  generatedAt: string;
}

function normalizeItem(card: any, intelligence: Awaited<ReturnType<typeof getCardTrendIntelligence>>): RankedTrendItem {
  return {
    cardId: card.id,
    playerName: card.playerName,
    sport: card.sport,
    title: `${card.year || ""} ${card.brand || ""} ${card.set || ""} ${card.parallel || "Base"}`.trim(),
    currentPrice: Number(card.currentPrice || 0),
    trend: intelligence.trend,
    confidence: intelligence.confidence,
    compositeScore: intelligence.compositeScore,
    summary: intelligence.summary,
  };
}

function buildMoverEventLabel(previousTrend: TrendMoverItem["previousTrend"], currentTrend: TrendMoverItem["trend"], deltaScore: number) {
  if (previousTrend && previousTrend !== currentTrend) {
    return {
      eventLabel: `趋势反转：${previousTrend} → ${currentTrend}`,
      eventSeverity: "high" as const,
    };
  }
  if (deltaScore >= 12) {
    return { eventLabel: "强势拉升", eventSeverity: "high" as const };
  }
  if (deltaScore >= 6) {
    return { eventLabel: "稳步走强", eventSeverity: "medium" as const };
  }
  if (deltaScore <= -12) {
    return { eventLabel: "急速转弱", eventSeverity: "high" as const };
  }
  if (deltaScore <= -6) {
    return { eventLabel: "热度回落", eventSeverity: "medium" as const };
  }
  return { eventLabel: "窄幅波动", eventSeverity: "low" as const };
}

export async function buildMarketIntelligenceBoard(limit = 18): Promise<MarketIntelligenceBoard> {
  const cards = await getAllCards(undefined, limit);
  const intelligences = await Promise.all(cards.map(async (card) => ({
    card,
    intelligence: await getCardTrendIntelligence(card.id),
  })));

  const ranked = intelligences
    .map(({ card, intelligence }) => normalizeItem(card as any, intelligence))
    .sort((a, b) => b.compositeScore - a.compositeScore || b.confidence - a.confidence);

  return {
    scanned: ranked.length,
    bullish: ranked.filter((item) => item.trend === "bullish").slice(0, 6),
    bearish: ranked.filter((item) => item.trend === "bearish").sort((a, b) => a.compositeScore - b.compositeScore).slice(0, 6),
    neutral: ranked.filter((item) => item.trend === "neutral").slice(0, 6),
    generatedAt: new Date().toISOString(),
  };
}

export async function buildTrendMoversBoard(limit = 20, historyOffset = 1): Promise<TrendMoversBoard> {
  const cards = await getAllCards(undefined, limit);
  const items = await Promise.all(cards.map(async (card) => {
    const intelligence = await getCardTrendIntelligence(card.id);
    const history = await getTrendHistory(card.id, Math.max(historyOffset, 1) + 1);
    const previous = history[historyOffset - 1];
    const previousScore = previous ? Number(previous.compositeScore || 0) : undefined;
    const deltaScore = previousScore !== undefined ? intelligence.compositeScore - previousScore : 0;
    return {
      ...normalizeItem(card as any, intelligence),
      deltaScore,
      previousScore,
      previousTrend: previous?.trend,
      ...buildMoverEventLabel(previous?.trend, intelligence.trend, deltaScore),
    } satisfies TrendMoverItem;
  }));

  const sorted = items.sort((a, b) => b.deltaScore - a.deltaScore || b.compositeScore - a.compositeScore);
  return {
    risers: sorted.filter((item) => item.deltaScore > 0).slice(0, 8),
    fallers: [...sorted].reverse().filter((item) => item.deltaScore < 0).slice(0, 8),
  };
}

export async function buildDailyTrendSummary(limit = 20, window: TrendWindowKey = "24H") {
  const movers = await buildTrendMoversBoard(limit, resolveHistoryOffset(window));
  const topRiser = movers.risers[0];
  const topFaller = movers.fallers[0];
  const reversalCount = [...movers.risers, ...movers.fallers].filter((item) => item.eventLabel.includes("趋势反转")).length;
  return {
    window,
    topRiser,
    topFaller,
    reversalCount,
    risersCount: movers.risers.length,
    fallersCount: movers.fallers.length,
    summary: `趋势摘要（${window}）：上升 ${movers.risers.length} 张，下行 ${movers.fallers.length} 张，反转 ${reversalCount} 张。${topRiser ? `最强上升 ${topRiser.playerName}（+${topRiser.deltaScore}）` : ""}${topFaller ? `；最大回落 ${topFaller.playerName}（${topFaller.deltaScore}）` : ""}`,
  };
}
