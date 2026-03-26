import { invokeLLM } from "./_core/llm";
import type { TrendIntelligence } from "./signalIntelligenceService";

interface AnalyzeCardInput {
  card: any;
  history: any[];
  intelligence?: TrendIntelligence;
}

export interface CardAnalysisResult {
  summary: string;
  signal: "BUY" | "HOLD" | "WAIT";
  confidence: number;
  shortTermTarget: number;
  longTermTarget: number;
  riskLevel: "Low" | "Medium" | "High";
  thesis: string[];
  catalysts: string[];
  risks: string[];
  actionPlan: string[];
  factorScores: {
    valuation: number;
    momentum: number;
    rarity: number;
    liquidity: number;
  };
  reasoning: {
    valuation: string;
    momentum: string;
    rarity: string;
    liquidity: string;
  };
}

type CacheEntry = {
  expiresAt: number;
  result: CardAnalysisResult;
};

const analysisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildCacheKey(card: any, history: any[]) {
  const lastPricePoint = history[history.length - 1];
  return JSON.stringify({
    id: card.id,
    currentPrice: card.currentPrice,
    avgPrice30d: card.avgPrice30d,
    priceChange7d: card.priceChange7d,
    population: card.population,
    updatedAt: card.updatedAt,
    lastHistoryDate: lastPricePoint?.saleDate,
    lastHistoryPrice: lastPricePoint?.price,
    historyCount: history.length,
  });
}

function computeMetrics(card: any, history: any[]) {
  const prices = history.map((item) => Number(item.price || 0)).filter(Boolean);
  const last30Average = prices.length > 0 ? average(prices) : Number(card.avgPrice30d || card.currentPrice || 0);
  const currentPrice = Number(card.currentPrice || 0);
  const priceChange7d = Number(card.priceChange7d || 0);
  const performanceScore = Number(card.dealScore || 0);
  const population = Number(card.population || 250);

  const valuation = clamp(Math.round(70 + ((last30Average - currentPrice) / Math.max(last30Average || 1, 1)) * 100 + (performanceScore - 70) * 0.3), 35, 96);
  const momentum = clamp(Math.round(55 + priceChange7d * 3 + (prices.length >= 5 ? 6 : 0)), 20, 95);
  const rarity = clamp(Math.round(85 - Math.min(population, 1000) / 20), 25, 95);
  const liquidity = clamp(Math.round(45 + prices.length * 2 + (card.grade?.includes("PSA") ? 8 : 0) + (card.brand?.includes("Prizm") ? 5 : 0)), 25, 95);

  return {
    valuation,
    momentum,
    rarity,
    liquidity,
    currentPrice,
    last30Average,
    priceChange7d,
    performanceScore,
    population,
  };
}

function buildFallback(card: any, history: any[], intelligence?: TrendIntelligence): CardAnalysisResult {
  const metrics = computeMetrics(card, history);
  const intelligenceBoost = intelligence ? intelligence.compositeScore * 0.35 : 0;
  const overall = average([metrics.valuation, metrics.momentum, metrics.rarity, metrics.liquidity, metrics.performanceScore || 70, intelligenceBoost || 65]);
  const signal: CardAnalysisResult["signal"] = overall >= 78 ? "BUY" : overall >= 62 ? "HOLD" : "WAIT";
  const riskLevel: CardAnalysisResult["riskLevel"] = metrics.momentum < 45 || metrics.liquidity < 45 ? "High" : overall >= 80 ? "Low" : "Medium";

  const downside = metrics.currentPrice * (riskLevel === "High" ? 0.88 : 0.93);
  const shortTermTarget = Number((metrics.currentPrice * (signal === "BUY" ? 1.12 : signal === "HOLD" ? 1.06 : 1.02)).toFixed(2));
  const longTermTarget = Number((metrics.currentPrice * (signal === "BUY" ? 1.28 : signal === "HOLD" ? 1.18 : 1.08)).toFixed(2));

  const summary = `${card.playerName} 这张 ${card.year} ${card.brand} ${card.set} 当前更像一张${signal === "BUY" ? "可积极研究的进攻型资产" : signal === "HOLD" ? "适合继续跟踪的平衡型资产" : "需要等待确认信号的观察型资产"}。现价 $${metrics.currentPrice.toFixed(2)}，相对近 30 天均价 ${metrics.last30Average.toFixed(2)} ${metrics.currentPrice < metrics.last30Average ? "存在一定折价" : "已经接近或超过均价"}，短期波动 ${metrics.priceChange7d >= 0 ? "偏强" : "偏弱"}。`;

  return {
    summary,
    signal,
    confidence: clamp(Math.round(overall), 58, 94),
    shortTermTarget,
    longTermTarget,
    riskLevel,
    thesis: [
      `估值分 ${metrics.valuation}，当前价与 30 日均价相比${metrics.currentPrice < metrics.last30Average ? "仍有折价空间" : "已不算便宜"}。`,
      `动量分 ${metrics.momentum}，近 7 日${metrics.priceChange7d >= 0 ? "延续上行" : "仍在回撤"}。`,
      `稀缺度分 ${metrics.rarity}，人口报告 ${metrics.population}，${metrics.population < 100 ? "供给偏紧" : "供给中等"}。`,
    ],
    catalysts: [
      `如果球员热度和赛场表现继续提升，短期目标可看向 $${shortTermTarget.toFixed(2)}。`,
      `若出现重要赛事、奖项或季后赛窗口，卡价弹性通常会增强。`,
      `高评级与主流品牌在市场情绪回暖时更容易获得流动性溢价。`,
      ...(intelligence ? [`智能信号引擎当前给出 ${intelligence.trend} 判断，综合分 ${intelligence.compositeScore}。`] : []),
    ],
    risks: [
      `若跌破 $${downside.toFixed(2)} 附近，短期趋势可能继续转弱。`,
      `${metrics.liquidity < 50 ? "当前成交样本较少，流动性风险偏高。" : "流动性尚可，但仍需关注成交密度变化。"}`,
      `${riskLevel === "High" ? "更适合分批试仓，不宜重仓追高。" : "注意事件驱动结束后的情绪回落。"}`,
      ...(intelligence?.offCourt.headlines?.some((item) => item.sentiment < 0) ? ["近期场外舆情存在负面项，需警惕突发事件放大波动。"] : []),
    ],
    actionPlan: [
      signal === "BUY" ? `可考虑分两到三笔在 $${metrics.currentPrice.toFixed(2)} 附近逐步建仓。` : signal === "HOLD" ? `建议继续持有，并观察是否有效突破 $${shortTermTarget.toFixed(2)}。` : `优先等待价格和成交量企稳，再考虑介入。`,
      `将目标价设在 $${shortTermTarget.toFixed(2)} / $${longTermTarget.toFixed(2)} 两级。`,
      `若基本面或价格结构恶化，重新评估仓位与止损纪律。`,
    ],
    factorScores: {
      valuation: metrics.valuation,
      momentum: metrics.momentum,
      rarity: metrics.rarity,
      liquidity: metrics.liquidity,
    },
    reasoning: {
      valuation: `当前价 $${metrics.currentPrice.toFixed(2)}，30 日均价 $${metrics.last30Average.toFixed(2)}。`,
      momentum: `近 7 日变动 ${metrics.priceChange7d >= 0 ? "+" : ""}${metrics.priceChange7d.toFixed(1)}%。`,
      rarity: `人口报告 ${metrics.population}，评级与平行版本决定稀缺性。`,
      liquidity: `最近纳入分析的成交样本 ${history.length} 条。`,
    },
  };
}

async function buildLlmAnalysis(card: any, history: any[], intelligence?: TrendIntelligence): Promise<CardAnalysisResult | null> {
  const metrics = computeMetrics(card, history);
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "你是资深球星卡二级市场研究员。请根据输入数据生成专业、克制、结构化的中文投资分析，不要夸大收益，不要编造不存在的信息。",
      },
      {
        role: "user",
        content: `请分析这张球星卡，并输出结构化 JSON。\n球员：${card.playerName}\n卡片：${card.year} ${card.brand} ${card.set} ${card.parallel || "Base"} ${card.grade || "RAW"}\n当前价：$${metrics.currentPrice.toFixed(2)}\n30日均价：$${metrics.last30Average.toFixed(2)}\n7日变化：${metrics.priceChange7d.toFixed(1)}%\n价值评分：${Number(card.dealScore || 0).toFixed(1)}\n人口报告：${metrics.population}\n样本成交数：${history.length}\n智能信号：${intelligence ? `${intelligence.trend} / 综合分 ${intelligence.compositeScore} / 置信度 ${intelligence.confidence}` : "暂无"}\n赛场信号：${intelligence ? intelligence.onCourt.details.join("；") : "暂无"}\n场外信号：${intelligence ? intelligence.offCourt.details.join("；") : "暂无"}\n市场信号：${intelligence ? intelligence.market.details.join("；") : "暂无"}`,
      },
    ],
    outputSchema: {
      name: "card_analysis",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          signal: { type: "string", enum: ["BUY", "HOLD", "WAIT"] },
          confidence: { type: "number" },
          shortTermTarget: { type: "number" },
          longTermTarget: { type: "number" },
          riskLevel: { type: "string", enum: ["Low", "Medium", "High"] },
          thesis: { type: "array", items: { type: "string" } },
          catalysts: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          actionPlan: { type: "array", items: { type: "string" } },
          factorScores: {
            type: "object",
            additionalProperties: false,
            properties: {
              valuation: { type: "number" },
              momentum: { type: "number" },
              rarity: { type: "number" },
              liquidity: { type: "number" },
            },
            required: ["valuation", "momentum", "rarity", "liquidity"],
          },
          reasoning: {
            type: "object",
            additionalProperties: false,
            properties: {
              valuation: { type: "string" },
              momentum: { type: "string" },
              rarity: { type: "string" },
              liquidity: { type: "string" },
            },
            required: ["valuation", "momentum", "rarity", "liquidity"],
          },
        },
        required: ["summary", "signal", "confidence", "shortTermTarget", "longTermTarget", "riskLevel", "thesis", "catalysts", "risks", "actionPlan", "factorScores", "reasoning"],
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === "string" ? content : Array.isArray(content) ? content.map((item: any) => item.text || "").join("") : "";
  if (!text) return null;
  const parsed = JSON.parse(text) as CardAnalysisResult;
  parsed.confidence = clamp(Number(parsed.confidence || 0), 55, 98);
  parsed.shortTermTarget = Number(Number(parsed.shortTermTarget).toFixed(2));
  parsed.longTermTarget = Number(Number(parsed.longTermTarget).toFixed(2));
  return parsed;
}

export async function analyzeCardTrend({ card, history, intelligence }: AnalyzeCardInput): Promise<CardAnalysisResult> {
  const cacheKey = buildCacheKey(card, history);
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  let result: CardAnalysisResult;
  try {
    result = await buildLlmAnalysis(card, history, intelligence) || buildFallback(card, history, intelligence);
  } catch {
    result = buildFallback(card, history, intelligence);
  }

  analysisCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });

  return result;
}
