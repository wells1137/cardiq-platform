import { analyzeCardTrend } from "./cardAnalysisService";
import { getCardById, getPriceHistory } from "./db";
import {
  buildDailyTrendSummary,
  buildMarketIntelligenceBoard,
  buildTrendMoversBoard,
  resolveHistoryOffset,
  type RankedTrendItem,
  type TrendWindowKey,
} from "./marketIntelligenceService";
import { getCardTrendIntelligence } from "./signalIntelligenceService";

type ActionBucket = "BUY" | "WAIT" | "RISK";

export interface SignalCenterItem extends RankedTrendItem {
  action: ActionBucket;
  riskLevel: "Low" | "Medium" | "High";
  shortTermTarget?: number;
  longTermTarget?: number;
  priceGapPct?: number;
  eventLabel?: string;
  eventSeverity?: "high" | "medium" | "low";
  reasons: string[];
  actionPlan: string[];
  factors: {
    onCourt: number;
    offCourt: number;
    market: number;
    valuation?: number;
    momentum?: number;
    rarity?: number;
    liquidity?: number;
  };
}

export interface SignalCenterBoard {
  generatedAt: string;
  window: TrendWindowKey;
  summary: Awaited<ReturnType<typeof buildDailyTrendSummary>>;
  buy: SignalCenterItem[];
  wait: SignalCenterItem[];
  risk: SignalCenterItem[];
  spotlight: {
    buy?: SignalCenterItem;
    wait?: SignalCenterItem;
    risk?: SignalCenterItem;
  };
}

function uniqueByCardId<T extends { cardId: number }>(items: T[]) {
  const map = new Map<number, T>();
  for (const item of items) {
    if (!map.has(item.cardId)) map.set(item.cardId, item);
  }
  return Array.from(map.values());
}

function decideAction({
  trend,
  compositeScore,
  riskLevel,
  signal,
}: {
  trend: "bullish" | "neutral" | "bearish";
  compositeScore: number;
  riskLevel: "Low" | "Medium" | "High";
  signal: "BUY" | "HOLD" | "WAIT";
}): ActionBucket {
  if (trend === "bearish" || riskLevel === "High") return "RISK";
  if (signal === "BUY" && compositeScore >= 74) return "BUY";
  if (signal === "WAIT" && compositeScore <= 58) return "RISK";
  return "WAIT";
}

function buildReasons(intelligence: Awaited<ReturnType<typeof getCardTrendIntelligence>>, analysis: Awaited<ReturnType<typeof analyzeCardTrend>>, mover?: { eventLabel?: string; deltaScore?: number }) {
  const reasons = [
    intelligence.onCourt.details[0],
    intelligence.offCourt.details[0],
    intelligence.market.details[0],
    mover?.eventLabel ? `${mover.eventLabel}${typeof mover.deltaScore === "number" ? `，分数变化 ${mover.deltaScore >= 0 ? "+" : ""}${mover.deltaScore}` : ""}。` : null,
    analysis.thesis[0],
  ].filter(Boolean) as string[];
  return reasons.slice(0, 4);
}

async function enrichItem(item: RankedTrendItem, mover?: { eventLabel?: string; eventSeverity?: "high" | "medium" | "low"; deltaScore?: number }) {
  const card = await getCardById(item.cardId);
  if (!card) return null;
  const history = await getPriceHistory(item.cardId, 30);
  const intelligence = await getCardTrendIntelligence(item.cardId);
  const analysis = await analyzeCardTrend({ card, history, intelligence });
  const action = decideAction({
    trend: intelligence.trend,
    compositeScore: intelligence.compositeScore,
    riskLevel: analysis.riskLevel,
    signal: analysis.signal,
  });
  const currentPrice = Number(card.currentPrice || item.currentPrice || 0);
  const shortTermTarget = Number(analysis.shortTermTarget || currentPrice);
  const priceGapPct = currentPrice > 0 ? Number((((shortTermTarget - currentPrice) / currentPrice) * 100).toFixed(1)) : 0;

  return {
    ...item,
    action,
    riskLevel: analysis.riskLevel,
    shortTermTarget: analysis.shortTermTarget,
    longTermTarget: analysis.longTermTarget,
    priceGapPct,
    eventLabel: mover?.eventLabel,
    eventSeverity: mover?.eventSeverity,
    reasons: buildReasons(intelligence, analysis, mover),
    actionPlan: analysis.actionPlan.slice(0, 2),
    factors: {
      onCourt: intelligence.onCourt.score,
      offCourt: intelligence.offCourt.score,
      market: intelligence.market.score,
      valuation: analysis.factorScores.valuation,
      momentum: analysis.factorScores.momentum,
      rarity: analysis.factorScores.rarity,
      liquidity: analysis.factorScores.liquidity,
    },
  } satisfies SignalCenterItem;
}

export async function buildSignalCenterBoard(window: TrendWindowKey = "24H"): Promise<SignalCenterBoard> {
  const [marketBoard, movers, summary] = await Promise.all([
    buildMarketIntelligenceBoard(24),
    buildTrendMoversBoard(24, resolveHistoryOffset(window)),
    buildDailyTrendSummary(24, window),
  ]);

  const moverByCardId = new Map<number, (typeof movers.risers)[number] | (typeof movers.fallers)[number]>();
  for (const item of [...movers.risers, ...movers.fallers]) moverByCardId.set(item.cardId, item);

  const buyCandidates = uniqueByCardId([...marketBoard.bullish, ...movers.risers]).slice(0, 4);
  const waitCandidates = uniqueByCardId([...marketBoard.neutral, ...movers.risers.slice(0, 2), ...movers.fallers.slice(0, 2)]).slice(0, 4);
  const riskCandidates = uniqueByCardId([...marketBoard.bearish, ...movers.fallers]).slice(0, 4);

  const [buy, wait, risk] = await Promise.all([
    Promise.all(buyCandidates.map((item) => enrichItem(item, moverByCardId.get(item.cardId)))).then((items) => items.filter(Boolean) as SignalCenterItem[]),
    Promise.all(waitCandidates.map((item) => enrichItem(item, moverByCardId.get(item.cardId)))).then((items) => items.filter(Boolean) as SignalCenterItem[]),
    Promise.all(riskCandidates.map((item) => enrichItem(item, moverByCardId.get(item.cardId)))).then((items) => items.filter(Boolean) as SignalCenterItem[]),
  ]);

  const normalizedBuy = buy.filter((item) => item.action !== "RISK").sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 4);
  const normalizedWait = wait.filter((item) => item.action === "WAIT").sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  const normalizedRisk = risk.filter((item) => item.action !== "BUY").sort((a, b) => a.compositeScore - b.compositeScore).slice(0, 4);

  return {
    generatedAt: new Date().toISOString(),
    window,
    summary,
    buy: normalizedBuy,
    wait: normalizedWait,
    risk: normalizedRisk,
    spotlight: {
      buy: normalizedBuy[0],
      wait: normalizedWait[0],
      risk: normalizedRisk[0],
    },
  };
}
