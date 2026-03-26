import { invokeLLM } from "./_core/llm";
import { analyzeCardTrend } from "./cardAnalysisService";
import { getCardById, getCardsByPlayer, getPriceHistory } from "./db";
import { getCardTrendIntelligence } from "./signalIntelligenceService";

export interface CardChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface SuggestedCard {
  cardId: number;
  title: string;
  playerName: string;
  reason: string;
}

export interface CardSummaryContext {
  cardId: number;
  title: string;
  playerName: string;
  currentPrice: number;
  priceChange7d: number;
  signal?: string;
  confidence?: number;
}

export interface CardChatResponse {
  answer: string;
  suggestions: string[];
  cardContext?: CardSummaryContext;
  compareContext?: CardSummaryContext;
  relatedCards: SuggestedCard[];
}

function formatCardTitle(card: any) {
  return `${card.year || ""} ${card.brand || ""} ${card.set || ""} ${card.parallel || "Base"}`.trim();
}

async function buildCardSummary(cardId: number): Promise<{
  summary: CardSummaryContext;
  systemBlock: string;
  rawCard: any;
} | null> {
  const card = await getCardById(cardId);
  if (!card) return null;
  const history = await getPriceHistory(cardId, 30);
  const intelligence = await getCardTrendIntelligence(cardId);
  const analysis = await analyzeCardTrend({ card, history, intelligence });
  const title = formatCardTitle(card);

  return {
    rawCard: card,
    summary: {
      cardId: card.id,
      title,
      playerName: card.playerName,
      currentPrice: Number(card.currentPrice || 0),
      priceChange7d: Number(card.priceChange7d || 0),
      signal: analysis.signal,
      confidence: analysis.confidence,
    },
    systemBlock: `球员：${card.playerName}
卡片：${title}
当前价：$${Number(card.currentPrice || 0).toFixed(2)}
7日变化：${Number(card.priceChange7d || 0).toFixed(1)}%
价值分：${Number(card.dealScore || 0).toFixed(1)}
AI 信号：${analysis.signal}
AI 置信度：${analysis.confidence}
短期目标价：$${Number(analysis.shortTermTarget || 0).toFixed(2)}
长期目标价：$${Number(analysis.longTermTarget || 0).toFixed(2)}
核心逻辑：${analysis.thesis.join("；")}
催化剂：${analysis.catalysts.join("；")}
风险：${analysis.risks.join("；")}
赛场信号：${intelligence.onCourt.details.join("；")}
场外信号：${intelligence.offCourt.details.join("；")}
市场信号：${intelligence.market.details.join("；")}`,
  };
}

async function buildRelatedCards(cardId?: number, rawCard?: any): Promise<SuggestedCard[]> {
  if (!cardId || !rawCard?.playerId) return [];
  const cards = await getCardsByPlayer(rawCard.playerId);
  return cards
    .filter((item) => item.id !== cardId)
    .sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0))
    .slice(0, 3)
    .map((item) => ({
      cardId: item.id,
      title: formatCardTitle(item),
      playerName: item.playerName,
      reason:
        item.brand === rawCard.brand
          ? `同球员同品牌路线，适合横向比较 ${item.set || "系列"} 表现。`
          : `同球员不同品牌路线，适合比较流动性与审美溢价。`,
    }));
}

function buildFallbackAnswer(message: string, context?: CardSummaryContext, compareContext?: CardSummaryContext) {
  if (context && compareContext) {
    return `你当前在比较两张卡：${context.title} 和 ${compareContext.title}。前者现价约 $${context.currentPrice.toFixed(2)}，后者约 $${compareContext.currentPrice.toFixed(2)}。如果你更看重短线热度，优先看近 7 天走势更强、AI 置信度更高的一张；如果更看重长期配置，还要结合品牌主线地位、系列流动性和人口报告一起判断。你可以继续追问我“哪张更适合短线”或“哪张更适合长期持有”。`;
  }

  if (context) {
    return `这张卡是 ${context.playerName} 的 ${context.title}。当前价格约 $${context.currentPrice.toFixed(2)}，近 7 天 ${context.priceChange7d >= 0 ? "上涨" : "回落"} ${Math.abs(context.priceChange7d).toFixed(1)}%。${context.signal ? ` 当前 AI 信号偏向 ${context.signal}，置信度 ${context.confidence || 0}%。` : ""} 你可以继续问我它的投资逻辑、风险点、适合买入的时机，或者和其他品牌/系列如何比较。`;
  }

  return `我可以帮你理解球星卡的价格、品牌、系列、风险和买入逻辑。你刚刚问的是：“${message}”。如果你打开某张卡的详情页再提问，我会结合这张卡的价格、走势和 AI 分析给你更具体的回答。`;
}

export async function chatWithCardAdvisor(input: {
  message: string;
  cardId?: number;
  compareCardId?: number;
  history?: CardChatTurn[];
}): Promise<CardChatResponse> {
  const message = input.message.trim();
  if (!message) {
    return {
      answer: "你可以直接问我：这张卡值不值得买、为什么涨、适合长期持有吗、和 Prizm/Select 相比怎么样。",
      suggestions: ["这张卡值不值得买？", "它为什么最近上涨？", "这张卡适合长期持有吗？"],
      relatedCards: [],
    };
  }

  let cardContext: CardSummaryContext | undefined;
  let compareContext: CardSummaryContext | undefined;
  let relatedCards: SuggestedCard[] = [];
  let systemCardContext = "当前没有绑定具体卡片，请基于平台通用知识回答，并提醒用户打开卡片详情页可获得更精准分析。";

  if (input.cardId) {
    const current = await buildCardSummary(input.cardId);
    if (current) {
      cardContext = current.summary;
      relatedCards = await buildRelatedCards(input.cardId, current.rawCard);
      systemCardContext = `当前用户正在查看具体卡片，请优先围绕这张卡回答。
${current.systemBlock}`;

      if (input.compareCardId && input.compareCardId !== input.cardId) {
        const compare = await buildCardSummary(input.compareCardId);
        if (compare) {
          compareContext = compare.summary;
          systemCardContext += `

用户还要求与你当前卡片进行对比，请同时参考这张对比卡：
${compare.systemBlock}

回答时请明确说明两张卡各自的优劣、适合的持有周期和更适合哪类用户。`;
        }
      }
    }
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是球星卡平台内的 AI 顾问，擅长用中文向普通用户解释球星卡的品牌、系列、价格走势、稀缺性和投资逻辑。
要求：
1. 回答要直接、具体、好懂。
2. 如果有卡片上下文，就优先结合该卡片数据解释，不要泛泛而谈。
3. 不夸大收益，不承诺赚钱。
4. 如果用户问“值不值得买”，请同时讲机会和风险。
5. 如果在对比两张卡，要明确指出：谁更适合短线、谁更适合长线、谁风险更高。
6. 结尾给 2-3 个可以继续追问的建议方向。
${systemCardContext}`,
        },
        ...(input.history || []).slice(-8).map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message },
      ],
      outputSchema: {
        name: "card_chat_response",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            answer: { type: "string" },
            suggestions: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 3,
            },
          },
          required: ["answer", "suggestions"],
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.map((item: any) => item.text || "").join("") : "";
    if (!text) throw new Error("empty response");
    const parsed = JSON.parse(text) as { answer: string; suggestions: string[] };
    return {
      answer: parsed.answer,
      suggestions: parsed.suggestions?.slice(0, 3) || [],
      cardContext,
      compareContext,
      relatedCards,
    };
  } catch {
    return {
      answer: buildFallbackAnswer(message, cardContext, compareContext),
      suggestions: compareContext
        ? ["哪张更适合短线？", "哪张更适合长期持有？", "两张卡哪个风险更高？"]
        : cardContext
          ? ["这张卡最大的风险是什么？", "现在适合买入还是等回调？", "它和同球员其他系列比怎么样？"]
          : ["Prizm 和 Select 有什么区别？", "什么样的卡更保值？", "如何判断一张卡是不是高位？"],
      cardContext,
      compareContext,
      relatedCards,
    };
  }
}
