/**
 * aiAnalysisService.ts
 * AI 智能趋势分析服务 — 使用 OpenAI 兼容接口（gemini-2.5-flash）分析球星卡价格走势
 */

import https from "https";
import http from "http";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
const AI_MODEL = "gemini-2.5-flash";

// ─── OpenAI 兼容 API 调用 ─────────────────────────────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const body = JSON.stringify({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert sports card market analyst. Always respond with valid JSON only, no markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const url = `${OPENAI_BASE_URL}/chat/completions`;
  const parsed = new URL(url);
  const client = parsed.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 45000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(`API Error: ${json.error.message || JSON.stringify(json.error)}`));
              return;
            }
            const text = json?.choices?.[0]?.message?.content || "";
            resolve(text);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("AI API timeout"));
    });

    req.write(body);
    req.end();
  });
}

// ─── 趋势分析数据结构 ──────────────────────────────────────────────────────────
export interface TrendAnalysis {
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "WAIT" | "SELL";
  confidence: number; // 0-100
  shortTermOutlook: string; // 1-4周
  longTermOutlook: string; // 3-12个月
  keyFactors: string[];
  priceTarget: {
    low: number;
    mid: number;
    high: number;
    currency: "USD";
  };
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  summary: string;
  catalysts: string[];
  risks: string[];
  generatedAt: string;
  aiModel?: string;
}

export interface CardAnalysisInput {
  playerName: string;
  sport: string;
  team: string;
  year: number;
  brand: string;
  parallel: string;
  grade: string;
  currentPrice: number;
  avgPrice30d: number;
  priceChange7d: number;
  priceHistory: Array<{ date: string; price: number; source: string }>;
  performanceScore: number;
  ebayListings?: Array<{ price: number; soldDate: string; grade: string }>;
  kataoListings?: Array<{ price: number; soldDate: string; grade: string; currency: string }>;
}

/**
 * 使用 Gemini AI（通过 OpenAI 兼容接口）分析球星卡价格趋势
 */
export async function analyzeCardTrend(input: CardAnalysisInput): Promise<TrendAnalysis> {
  const priceHistoryText = input.priceHistory
    .slice(-10)
    .map((p) => `${p.date}: $${p.price} (${p.source})`)
    .join("\n");

  const ebayText =
    input.ebayListings && input.ebayListings.length > 0
      ? input.ebayListings
          .slice(0, 5)
          .map((l) => `  - $${l.price} (${l.grade}, sold ${l.soldDate})`)
          .join("\n")
      : "  No recent eBay data available";

  const kataoText =
    input.kataoListings && input.kataoListings.length > 0
      ? input.kataoListings
          .slice(0, 5)
          .map((l) => `  - ¥${l.price} (${l.grade}, ${l.soldDate})`)
          .join("\n")
      : "  No recent Katao (Chinese market) data available";

  const prompt = `You are an expert sports card market analyst. Analyze this card and provide investment insights.

Card: ${input.playerName} ${input.year} ${input.brand} ${input.parallel} (${input.grade})
Sport: ${input.sport} | Team: ${input.team}
Current Price: $${input.currentPrice} | 30-Day Avg: $${input.avgPrice30d}
7-Day Change: ${input.priceChange7d > 0 ? "+" : ""}${input.priceChange7d.toFixed(1)}%
Performance Score: ${input.performanceScore}/100

Price History:
${priceHistoryText || "Limited data available"}

eBay Recent Sales:
${ebayText}

Chinese Market (卡淘):
${kataoText}

Respond with ONLY this JSON (no markdown, no explanation):
{
  "signal": "BUY",
  "confidence": 75,
  "shortTermOutlook": "Short term outlook in Chinese (1-2 sentences)",
  "longTermOutlook": "Long term outlook in Chinese (1-2 sentences)",
  "keyFactors": ["Factor 1 in Chinese", "Factor 2 in Chinese", "Factor 3 in Chinese"],
  "priceTarget": {"low": 600, "mid": 750, "high": 950},
  "riskLevel": "Medium",
  "summary": "Executive summary in Chinese (2-3 sentences)",
  "catalysts": ["Catalyst 1 in Chinese", "Catalyst 2 in Chinese"],
  "risks": ["Risk 1 in Chinese", "Risk 2 in Chinese"]
}`;

  try {
    console.log(`[AI Analysis] Analyzing ${input.playerName} ${input.year} ${input.brand}...`);
    const response = await callOpenAI(prompt);

    // 清理响应（去除可能的 markdown 代码块）
    const cleaned = response
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    // 找到 JSON 对象
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;

    const analysis = JSON.parse(jsonStr);
    console.log(`[AI Analysis] Success: signal=${analysis.signal}, confidence=${analysis.confidence}`);

    return {
      signal: analysis.signal || "HOLD",
      confidence: Math.min(100, Math.max(0, Number(analysis.confidence) || 70)),
      shortTermOutlook: analysis.shortTermOutlook || "市场数据不足，建议持续观察",
      longTermOutlook: analysis.longTermOutlook || "长期走势取决于球员表现",
      keyFactors: Array.isArray(analysis.keyFactors) ? analysis.keyFactors : [],
      priceTarget: {
        low: Number(analysis.priceTarget?.low) || Math.round(input.currentPrice * 0.85),
        mid: Number(analysis.priceTarget?.mid) || input.currentPrice,
        high: Number(analysis.priceTarget?.high) || Math.round(input.currentPrice * 1.3),
        currency: "USD",
      },
      riskLevel: analysis.riskLevel || "Medium",
      summary: analysis.summary || "AI 分析暂时不可用",
      catalysts: Array.isArray(analysis.catalysts) ? analysis.catalysts : [],
      risks: Array.isArray(analysis.risks) ? analysis.risks : [],
      generatedAt: new Date().toISOString(),
      aiModel: AI_MODEL,
    };
  } catch (err) {
    console.error("[AI Analysis] Error:", err);
    // 降级：基于规则的分析
    return generateFallbackAnalysis(input);
  }
}

/**
 * 降级分析（当 AI 不可用时）
 */
function generateFallbackAnalysis(input: CardAnalysisInput): TrendAnalysis {
  const priceChange = input.priceChange7d;
  const performanceBonus = input.performanceScore > 90 ? 10 : input.performanceScore > 80 ? 5 : 0;

  let signal: TrendAnalysis["signal"] = "HOLD";
  let confidence = 60;

  if (priceChange > 10) {
    signal = "STRONG_BUY";
    confidence = 75;
  } else if (priceChange > 5) {
    signal = "BUY";
    confidence = 70;
  } else if (priceChange < -10) {
    signal = "WAIT";
    confidence = 65;
  } else if (priceChange < -5) {
    signal = "WAIT";
    confidence = 60;
  }

  confidence = Math.min(100, confidence + performanceBonus);

  const priceDiff = ((input.currentPrice - input.avgPrice30d) / input.avgPrice30d) * 100;

  return {
    signal,
    confidence,
    shortTermOutlook: priceChange > 0
      ? `近期价格上涨 ${priceChange.toFixed(1)}%，短期动能较强，关注成交量变化`
      : `近期价格下跌 ${Math.abs(priceChange).toFixed(1)}%，建议等待价格企稳后入场`,
    longTermOutlook: input.performanceScore > 85
      ? "球员竞技状态优秀，长期持有价值较高，建议逢低布局"
      : "长期走势需关注球员赛季表现和市场整体流动性",
    keyFactors: [
      `7日涨跌幅: ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
      `较30日均价: ${priceDiff > 0 ? "+" : ""}${priceDiff.toFixed(1)}%`,
      `球员状态评分: ${input.performanceScore}/100`,
      `评级: ${input.grade}`,
    ],
    priceTarget: {
      low: Math.round(input.currentPrice * 0.85),
      mid: Math.round(input.currentPrice * 1.1),
      high: Math.round(input.currentPrice * 1.35),
      currency: "USD",
    },
    riskLevel: priceChange < -10 ? "High" : priceChange > 10 ? "Medium" : "Low",
    summary: `${input.playerName} 的 ${input.year} ${input.brand} ${input.parallel} 卡片当前价格为 $${input.currentPrice}，较30日均价${priceDiff >= 0 ? "上涨" : "下跌"} ${Math.abs(priceDiff).toFixed(1)}%。球员状态评分 ${input.performanceScore}/100，${input.performanceScore > 85 ? "竞技状态优秀" : "状态稳定"}。综合判断建议${signal === "STRONG_BUY" || signal === "BUY" ? "适量买入" : signal === "HOLD" ? "持有观望" : "等待更好时机"}。`,
    catalysts: [
      "球员赛季表现强劲，关注度持续提升",
      `${input.parallel} 版本稀有度高，市场需求旺盛`,
    ],
    risks: [
      "市场流动性风险，短期可能出现价格波动",
      "球员伤病或状态下滑风险",
    ],
    generatedAt: new Date().toISOString(),
    aiModel: "fallback-rules",
  };
}

/**
 * 批量分析多张卡片（用于市场扫描）
 */
export async function batchAnalyzeCards(
  cards: CardAnalysisInput[]
): Promise<Array<{ cardId?: number; analysis: TrendAnalysis }>> {
  const results: Array<{ cardId?: number; analysis: TrendAnalysis }> = [];

  for (const card of cards.slice(0, 5)) {
    try {
      const analysis = await analyzeCardTrend(card);
      results.push({ analysis });
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      results.push({ analysis: generateFallbackAnalysis(card) });
    }
  }

  return results;
}
