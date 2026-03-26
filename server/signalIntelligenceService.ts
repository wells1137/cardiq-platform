import { getCardById, getPlayerById, getPriceHistory } from "./db";
import { lookupCardMarketData } from "./marketDataService";
import { getSignalWeights } from "./signalConfigService";
import { fetchPlayerStats, calculatePerformanceScore } from "./sportsDataService";

export interface HeadlineSignal {
  title: string;
  url?: string | null;
  publishedAt?: string | null;
  sentiment: number;
}

export interface TrendIntelligence {
  cardId: number;
  playerName: string;
  trend: "bullish" | "neutral" | "bearish";
  confidence: number;
  compositeScore: number;
  summary: string;
  weights: {
    onCourt: number;
    offCourt: number;
    market: number;
  };
  onCourt: {
    score: number;
    trend: string;
    details: string[];
  };
  offCourt: {
    score: number;
    trend: string;
    headlines: HeadlineSignal[];
    details: string[];
  };
  market: {
    score: number;
    trend: string;
    details: string[];
  };
}

const POSITIVE_KEYWORDS = ["mvp", "all-star", "record", "career high", "return", "extension", "win", "冠军", "复出", "创纪录", "续约", "入选", "最佳"];
const NEGATIVE_KEYWORDS = ["injury", "out", "suspended", "controversy", "trade rumor", "miss", "hurt", "伤病", "停赛", "争议", "传闻", "缺阵"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateCompositeSignalScore(
  input: { onCourt: number; offCourt: number; market: number },
  weights = getSignalWeights()
): { compositeScore: number; trend: "bullish" | "neutral" | "bearish"; weights: { onCourt: number; offCourt: number; market: number } } {
  const compositeScore = clamp(
    Math.round(
      input.onCourt * (weights.onCourt / 100) +
      input.offCourt * (weights.offCourt / 100) +
      input.market * (weights.market / 100)
    ),
    20,
    97
  );
  const trend = compositeScore >= 76 ? "bullish" : compositeScore <= 52 ? "bearish" : "neutral";
  return { compositeScore, trend, weights };
}

function scoreHeadline(title: string) {
  const lower = title.toLowerCase();
  let score = 0;
  for (const word of POSITIVE_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) score += 1;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) score -= 1;
  }
  return clamp(score * 20, -100, 100);
}

function parseRssHeadlines(xml: string) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => match[1]);
  return items.slice(0, 8).map((item) => {
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.slice(1).find(Boolean)?.trim() || "Untitled";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || null;
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || null;
    return {
      title,
      url: link,
      publishedAt: pubDate,
      sentiment: scoreHeadline(title),
    } satisfies HeadlineSignal;
  });
}

async function fetchOffCourtSignals(playerName: string, sport: string) {
  const endpoint = process.env.NEWS_SIGNAL_ENDPOINT;
  const rssTemplate = process.env.NEWS_SIGNAL_RSS_TEMPLATE;

  try {
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.NEWS_SIGNAL_TOKEN ? { Authorization: `Bearer ${process.env.NEWS_SIGNAL_TOKEN}` } : {}),
        },
        body: JSON.stringify({ playerName, sport, limit: 8 }),
      });
      if (response.ok) {
        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
        const headlines = items.slice(0, 8).map((item: any) => ({
          title: item.title || item.headline || "Untitled",
          url: item.url || item.link || null,
          publishedAt: item.publishedAt || item.date || null,
          sentiment: typeof item.sentiment === "number" ? item.sentiment : scoreHeadline(item.title || item.headline || ""),
        }));
        return headlines;
      }
    }

    if (rssTemplate) {
      const query = encodeURIComponent(`${playerName} ${sport}`);
      const url = rssTemplate.replaceAll("{query}", query);
      const response = await fetch(url);
      if (response.ok) {
        const xml = await response.text();
        return parseRssHeadlines(xml);
      }
    }
  } catch {
  }

  return [] as HeadlineSignal[];
}

async function computeOnCourtScore(card: any) {
  const player = await getPlayerById(card.playerId);
  const externalId = Number(player?.externalId || 0);
  const scoreFromCard = Number(player?.performanceScore ?? 50);
  if (!externalId || card.sport !== "NBA") {
    return {
      score: clamp(scoreFromCard, 30, 95),
      trend: scoreFromCard >= 80 ? "竞技状态强势" : scoreFromCard >= 65 ? "竞技状态平稳" : "竞技状态一般",
      details: [
        `当前表现评分 ${scoreFromCard.toFixed(1)} / 100。`,
        `非 NBA 或缺少外部 ID 时，使用平台球员表现评分作为赛场信号。`,
      ],
    };
  }

  const stats = await fetchPlayerStats(externalId, 2024);
  if (stats.length === 0) {
    return {
      score: clamp(scoreFromCard, 30, 95),
      trend: "近期比赛样本不足",
      details: [`未抓到实时比赛数据，回退使用平台表现评分 ${scoreFromCard.toFixed(1)}。`],
    };
  }

  const recent = stats.slice(0, 5);
  const previous = stats.slice(5, 10);
  const recentPerf = calculatePerformanceScore(recent).score;
  const prevPerf = previous.length > 0 ? calculatePerformanceScore(previous).score : recentPerf;
  const delta = recentPerf - prevPerf;
  const score = clamp(Math.round(recentPerf + delta * 0.6), 25, 98);

  return {
    score,
    trend: delta > 6 ? "赛场表现加速上行" : delta < -6 ? "赛场表现走弱" : "赛场表现稳定",
    details: [
      `近 5 场表现评分 ${recentPerf.toFixed(1)}，此前区间 ${prevPerf.toFixed(1)}。`,
      `最近 5 场场均 ${avg(recent.map((item) => Number(item.pts || 0))).toFixed(1)} 分、${avg(recent.map((item) => Number(item.reb || 0))).toFixed(1)} 板、${avg(recent.map((item) => Number(item.ast || 0))).toFixed(1)} 助。`,
    ],
  };
}

async function computeMarketScore(card: any) {
  const history = await getPriceHistory(card.id, 45);
  const prices = history.map((item) => Number(item.price || 0));
  const averagePrice = prices.length > 0 ? avg(prices) : Number(card.avgPrice30d || card.currentPrice || 0);
  const currentPrice = Number(card.currentPrice || 0);
  const change7d = Number(card.priceChange7d || 0);
  const marketData = await lookupCardMarketData(card);
  const externalPrices = marketData.recentSales.map((item) => Number(item.price || 0)).filter(Boolean);
  const externalAverage = externalPrices.length > 0 ? avg(externalPrices) : averagePrice;

  let score = 55;
  score += ((externalAverage - currentPrice) / Math.max(externalAverage || 1, 1)) * 100;
  score += change7d * 2;
  score += Math.min(history.length, 12);
  score = clamp(Math.round(score), 20, 96);

  return {
    score,
    trend: score >= 78 ? "市场结构偏强" : score >= 60 ? "市场结构中性" : "市场结构偏弱",
    details: [
      `当前价 $${currentPrice.toFixed(2)}，平台均价约 $${averagePrice.toFixed(2)}，外部成交均价约 $${externalAverage.toFixed(2)}。`,
      `近 7 日价格变化 ${change7d >= 0 ? "+" : ""}${change7d.toFixed(1)}%，最近样本 ${history.length} 条。`,
      `外部行情来源：${marketData.provider}（${marketData.mode}）`,
    ],
  };
}

export async function getCardTrendIntelligence(cardId: number): Promise<TrendIntelligence> {
  const cardRaw = await getCardById(cardId);
  if (!cardRaw) throw new Error("Card not found");
  const card = cardRaw as any;

  const [onCourt, headlines, market] = await Promise.all([
    computeOnCourtScore(card),
    fetchOffCourtSignals(card.playerName, card.sport),
    computeMarketScore(card),
  ]);

  const offCourtScore = headlines.length > 0 ? clamp(Math.round(55 + avg(headlines.map((item: HeadlineSignal) => item.sentiment)) * 0.35), 20, 95) : 52;
  const weights = getSignalWeights();
  const offCourt = {
    score: offCourtScore,
    trend: offCourtScore >= 70 ? "场外舆论偏正面" : offCourtScore <= 40 ? "场外舆论偏负面" : "场外舆论中性",
    headlines,
    details: headlines.length > 0
      ? [`最近抓取 ${headlines.length} 条场外动态，平均情绪分 ${offCourtScore}。`, `当前场外权重 ${weights.offCourt}%。`]
      : ["当前未配置新闻源或未抓到有效场外动态。", `当前场外权重 ${weights.offCourt}%。`],
  };

  const { compositeScore, trend } = calculateCompositeSignalScore({
    onCourt: onCourt.score,
    offCourt: offCourt.score,
    market: market.score,
  }, weights);
  const confidence = clamp(Math.round(58 + Math.abs(onCourt.score - market.score) * -0.15 + (headlines.length > 0 ? 8 : 0) + Math.min(10, market.score / 12)), 52, 95);

  const summary = trend === "bullish"
    ? `${card.playerName} 当前呈现偏多走势：赛场表现与市场结构同步偏强${headlines.length > 0 ? "，场外信息面也提供支持" : ""}。`
    : trend === "bearish"
      ? `${card.playerName} 当前呈现偏弱走势：价格结构或赛场表现存在压力，建议控制节奏。`
      : `${card.playerName} 当前走势偏中性，建议继续跟踪赛场催化与外部成交确认。`;

  return {
    cardId,
    playerName: card.playerName,
    trend,
    confidence,
    compositeScore,
    summary,
    weights,
    onCourt: {
      ...onCourt,
      details: [...onCourt.details, `当前赛场权重 ${weights.onCourt}%。`],
    },
    offCourt,
    market: {
      ...market,
      details: [...market.details, `当前市场权重 ${weights.market}%。`],
    },
  };
}
