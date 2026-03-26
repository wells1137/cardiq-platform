import { readFile } from "node:fs/promises";
import { invokeLLM } from "./_core/llm";
import { getPriceHistory } from "./db";

export interface NormalizedMarketSale {
  title: string;
  price: number;
  soldAt: string;
  source: string;
  url?: string | null;
  condition?: string | null;
}

export interface MarketDataSourceBreakdown {
  source: string;
  count: number;
  kind: "bridge" | "apify" | "feed" | "csv" | "history";
}

export interface MarketDataLookupResult {
  provider: string;
  mode: "mock" | "manual" | "apify" | "feed" | "csv" | "aggregate";
  configured: boolean;
  recentSales: NormalizedMarketSale[];
  note: string;
  sourceBreakdown: MarketDataSourceBreakdown[];
  qualityScore: number;
  totalFetched: number;
  filteredOutliers: number;
  usedSources: string[];
  aiAssisted: boolean;
}

interface LookupCardInput {
  id: number;
  playerName?: string | null;
  year?: number | null;
  brand?: string | null;
  set?: string | null;
  parallel?: string | null;
  grade?: string | null;
}

interface AiSaleReview {
  index: number;
  matched: boolean;
  confidence: number;
  normalizedTitle?: string;
  suspect?: boolean;
}

function buildSearchKeyword(card: LookupCardInput) {
  return [card.year, card.playerName, card.brand, card.set, card.parallel, card.grade]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizePrice(value: unknown) {
  const num = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function normalizeManualItems(items: any[], fallbackSource = "manual"): NormalizedMarketSale[] {
  return items
    .map((item) => ({
      title: item.title || item.name || "外部成交记录",
      price: normalizePrice(item.price ?? item.amount ?? item.salePrice),
      soldAt: new Date(item.soldAt || item.saleDate || item.date || Date.now()).toISOString(),
      source: item.source || fallbackSource,
      url: item.url || item.listingUrl || null,
      condition: item.condition || item.grade || null,
    }))
    .filter((item) => item.price > 0)
    .slice(0, 30);
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((item) => item.trim());
}

function parseCsv(content: string) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [] as Record<string, string>[];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const columns = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = columns[index] || "";
      return acc;
    }, {} as Record<string, string>);
  });
}

function getConfiguredSources(mode: MarketDataLookupResult["mode"]) {
  const raw = process.env.MARKET_DATA_SOURCES?.split(",").map((item) => item.trim()).filter(Boolean);
  if (raw && raw.length > 0) return raw;
  if (mode === "aggregate") return ["manual", "feed", "csv", "apify"];
  return [mode];
}

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").split(/\s+/).filter(Boolean);
}

function heuristicMatchScore(card: LookupCardInput, sale: NormalizedMarketSale) {
  const saleTokens = new Set(tokenize(`${sale.title} ${sale.condition || ""}`));
  const targets = [card.playerName, String(card.year || ""), card.brand, card.set, card.parallel, card.grade].filter(Boolean) as string[];
  const hits = targets.filter((target) => tokenize(target).some((token) => saleTokens.has(token))).length;
  return hits / Math.max(targets.length, 1);
}

async function reviewSalesWithAI(card: LookupCardInput, items: NormalizedMarketSale[]) {
  const sample = items.slice(0, 12);
  if (sample.length === 0) return { reviewed: items, aiAssisted: false };

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是球星卡成交数据清洗助手。判断每条成交是否与目标卡片高度匹配，输出严格 JSON。matched 为是否保留，confidence 为 0-100。suspect 为是否疑似脏数据或错卡。",
        },
        {
          role: "user",
          content: JSON.stringify({
            targetCard: {
              year: card.year,
              playerName: card.playerName,
              brand: card.brand,
              set: card.set,
              parallel: card.parallel,
              grade: card.grade,
            },
            sales: sample.map((item, index) => ({ index, title: item.title, condition: item.condition, price: item.price, soldAt: item.soldAt, source: item.source })),
          }),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const payload = JSON.parse(text || "{}");
    const reviews = Array.isArray(payload.items) ? payload.items as AiSaleReview[] : [];
    const reviewMap = new Map(reviews.map((item) => [item.index, item]));

    const reviewed = items.filter((item, index) => {
      const review = reviewMap.get(index);
      if (!review) return true;
      if (review.suspect) return false;
      if (review.matched === false && (review.confidence ?? 0) >= 70) return false;
      return true;
    }).map((item, index) => {
      const review = reviewMap.get(index);
      return review?.normalizedTitle ? { ...item, title: review.normalizedTitle } : item;
    });

    return { reviewed: reviewed.length > 0 ? reviewed : items, aiAssisted: true };
  } catch {
    const reviewed = items.filter((item) => heuristicMatchScore(card, item) >= 0.35);
    return { reviewed: reviewed.length > 0 ? reviewed : items, aiAssisted: false };
  }
}

async function fetchManualEndpoints(card: LookupCardInput): Promise<NormalizedMarketSale[]> {
  const endpoints = [
    process.env.MARKET_DATA_ENDPOINT,
    ...(process.env.MARKET_DATA_ENDPOINTS?.split(",").map((item) => item.trim()).filter(Boolean) || []),
  ].filter(Boolean) as string[];
  if (endpoints.length === 0) return [];

  const results = await Promise.allSettled(
    endpoints.map(async (endpoint, index) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.MARKET_DATA_TOKEN ? { Authorization: `Bearer ${process.env.MARKET_DATA_TOKEN}` } : {}),
        },
        body: JSON.stringify({ keyword: buildSearchKeyword(card), card }),
      });
      if (!response.ok) throw new Error(`Manual market endpoint failed: ${response.status}`);
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
      return normalizeManualItems(items, `manual-bridge-${index + 1}`);
    })
  );

  return results.flatMap((item) => item.status === "fulfilled" ? item.value : []);
}

async function fetchFeedEndpoint(card: LookupCardInput): Promise<NormalizedMarketSale[]> {
  const template = process.env.MARKET_DATA_FEED_URL_TEMPLATE || process.env.MARKET_DATA_FEED_URL;
  if (!template) return [];
  const query = encodeURIComponent(buildSearchKeyword(card));
  const url = template.replaceAll("{query}", query);
  const response = await fetch(url, {
    headers: process.env.MARKET_DATA_TOKEN ? { Authorization: `Bearer ${process.env.MARKET_DATA_TOKEN}` } : undefined,
  });
  if (!response.ok) throw new Error(`Feed market endpoint failed: ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  return normalizeManualItems(items, "feed");
}

async function fetchCsvSource(card: LookupCardInput): Promise<NormalizedMarketSale[]> {
  const localPath = process.env.MARKET_DATA_CSV_PATH;
  const remoteTemplate = process.env.MARKET_DATA_CSV_URL_TEMPLATE;
  let content = "";

  if (localPath) {
    content = await readFile(localPath, "utf8");
  } else if (remoteTemplate) {
    const query = encodeURIComponent(buildSearchKeyword(card));
    const response = await fetch(remoteTemplate.replaceAll("{query}", query));
    if (!response.ok) throw new Error(`CSV market endpoint failed: ${response.status}`);
    content = await response.text();
  } else {
    return [];
  }

  const keyword = buildSearchKeyword(card).toLowerCase();
  const rows = parseCsv(content)
    .filter((row) => `${row.title || row.name || ""} ${row.playerName || ""} ${row.brand || ""} ${row.set || ""}`.toLowerCase().includes(keyword))
    .slice(0, 30);
  return normalizeManualItems(rows, "csv");
}

async function fetchApifyItems(card: LookupCardInput): Promise<NormalizedMarketSale[]> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_EBAY_SOLD_ACTOR_ID;
  if (!token || !actorId) return [];

  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      searchTerms: [buildSearchKeyword(card)],
      maxItems: 20,
    }),
  });

  if (!response.ok) throw new Error(`Apify actor failed: ${response.status}`);

  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : [];
  return normalizeManualItems(items, "apify-ebay-sold");
}

async function fallbackFromHistory(cardId: number): Promise<NormalizedMarketSale[]> {
  const history = await getPriceHistory(cardId, 45);
  return history.slice(-20).reverse().map((item) => ({
    title: "平台历史成交记录",
    price: Number(item.price),
    soldAt: new Date(item.saleDate).toISOString(),
    source: item.source || "mock",
    url: item.listingUrl || null,
    condition: item.condition || null,
  }));
}

function dedupeSales(items: NormalizedMarketSale[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title.toLowerCase()}|${item.price}|${item.soldAt.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterOutlierSales(items: NormalizedMarketSale[]) {
  if (items.length < 5) return { filtered: items, outliers: 0 };
  const sortedPrices = items.map((item) => item.price).sort((a, b) => a - b);
  const q1 = sortedPrices[Math.floor((sortedPrices.length - 1) * 0.25)];
  const q3 = sortedPrices[Math.floor((sortedPrices.length - 1) * 0.75)];
  const iqr = q3 - q1;
  const low = q1 - iqr * 1.5;
  const high = q3 + iqr * 1.5;
  const filtered = items.filter((item) => item.price >= low && item.price <= high);
  return { filtered: filtered.length > 0 ? filtered : items, outliers: items.length - filtered.length };
}

function buildSourceBreakdown(items: NormalizedMarketSale[]): MarketDataSourceBreakdown[] {
  const map = new Map<string, MarketDataSourceBreakdown>();
  for (const item of items) {
    const key = item.source;
    const kind = key.includes("manual") ? "bridge" : key.includes("apify") ? "apify" : key.includes("feed") ? "feed" : key.includes("csv") ? "csv" : "history";
    const current = map.get(key) || { source: key, count: 0, kind };
    current.count += 1;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function buildQualityScore(items: NormalizedMarketSale[], usedSources: string[], outliers: number, aiAssisted: boolean) {
  let score = 45;
  score += Math.min(items.length, 12) * 3;
  score += Math.min(usedSources.length, 4) * 8;
  score -= Math.min(outliers, 6) * 4;
  const withUrls = items.filter((item) => Boolean(item.url)).length;
  score += Math.min(withUrls, 8);
  if (aiAssisted) score += 6;
  return Math.max(20, Math.min(98, score));
}

export function getMarketDataStatus() {
  const mode = (process.env.MARKET_DATA_MODE || (process.env.MARKET_DATA_SOURCES ? "aggregate" : process.env.MARKET_DATA_ENDPOINT ? "manual" : process.env.APIFY_TOKEN ? "apify" : "mock")) as MarketDataLookupResult["mode"];
  const configuredSources = getConfiguredSources(mode);
  return {
    mode,
    configured:
      mode === "manual"
        ? Boolean(process.env.MARKET_DATA_ENDPOINT || process.env.MARKET_DATA_ENDPOINTS)
        : mode === "apify"
          ? Boolean(process.env.APIFY_TOKEN && process.env.APIFY_EBAY_SOLD_ACTOR_ID)
          : mode === "feed"
            ? Boolean(process.env.MARKET_DATA_FEED_URL || process.env.MARKET_DATA_FEED_URL_TEMPLATE)
            : mode === "csv"
              ? Boolean(process.env.MARKET_DATA_CSV_PATH || process.env.MARKET_DATA_CSV_URL_TEMPLATE)
              : mode === "aggregate"
                ? configuredSources.some((item) => ["manual", "feed", "csv", "apify"].includes(item))
                : true,
    providerLabel:
      mode === "aggregate"
        ? "Multi-Source Trade Aggregator"
        : mode === "apify"
          ? "Apify eBay Sold Actor"
          : mode === "manual"
            ? "Manual Market Bridge"
            : mode === "feed"
              ? "JSON Feed Market Bridge"
              : mode === "csv"
                ? "CSV / Export Import"
                : "Mock History",
    supportedSources: [
      "自定义 Bridge 接口（闲鱼 / 卡淘 / 内部聚合）",
      "Apify eBay Sold Actor",
      "JSON Feed / Serverless 聚合接口",
      "CSV 导入（130point / 手工整理 / 导出数据）",
      "平台历史成交回退",
      "内置 AI 标题清洗与错卡过滤",
    ],
    configuredSources,
    note:
      mode === "aggregate"
        ? "聚合多个外部来源，自动去重、过滤异常值，并用 AI 做标题标准化与错卡过滤。"
        : mode === "apify"
          ? "通过 Apify Actor 拉取外部成交数据，并由 AI 协助清洗匹配结果。"
          : mode === "manual"
            ? "通过自定义桥接接口获取外部平台数据；适合接卡淘、闲鱼或内部聚合服务。"
            : mode === "feed"
              ? "通过 JSON Feed 获取外部成交，适合自建 Worker / Edge 抓取服务。"
              : mode === "csv"
                ? "通过本地或远程 CSV 导入成交记录，适合人工整理的成交样本。"
                : "当前使用本地历史成交模拟数据，可切换到 aggregate / manual / apify / feed / csv。",
  };
}

export async function lookupCardMarketData(card: LookupCardInput): Promise<MarketDataLookupResult> {
  const status = getMarketDataStatus();
  const sources = getConfiguredSources(status.mode);

  try {
    const allFetched = await Promise.allSettled(
      sources.map(async (source) => {
        if (source === "manual") return fetchManualEndpoints(card);
        if (source === "apify") return fetchApifyItems(card);
        if (source === "feed") return fetchFeedEndpoint(card);
        if (source === "csv") return fetchCsvSource(card);
        return [] as NormalizedMarketSale[];
      })
    );

    let recentSales = allFetched.flatMap((item) => item.status === "fulfilled" ? item.value : []);
    const totalFetched = recentSales.length;
    const aiReviewed = await reviewSalesWithAI(card, recentSales);
    recentSales = dedupeSales(aiReviewed.reviewed).sort((a, b) => +new Date(b.soldAt) - +new Date(a.soldAt));
    const { filtered, outliers } = filterOutlierSales(recentSales);
    recentSales = filtered.slice(0, 20);

    if (recentSales.length === 0) {
      recentSales = await fallbackFromHistory(card.id);
      return {
        provider: status.providerLabel,
        mode: status.mode,
        configured: status.configured,
        recentSales,
        note: `${status.note} 当前回退为平台历史成交数据。`,
        sourceBreakdown: buildSourceBreakdown(recentSales),
        qualityScore: buildQualityScore(recentSales, ["mock-history"], 0, false),
        totalFetched: recentSales.length,
        filteredOutliers: 0,
        usedSources: ["mock-history"],
        aiAssisted: false,
      };
    }

    const sourceBreakdown = buildSourceBreakdown(recentSales);
    const usedSources = sourceBreakdown.map((item) => item.source);
    return {
      provider: status.providerLabel,
      mode: status.mode,
      configured: status.configured,
      recentSales,
      note: aiReviewed.aiAssisted ? `${status.note} 已启用内置 AI 做成交标题标准化与错卡过滤。` : status.note,
      sourceBreakdown,
      qualityScore: buildQualityScore(recentSales, usedSources, outliers, aiReviewed.aiAssisted),
      totalFetched,
      filteredOutliers: outliers,
      usedSources,
      aiAssisted: aiReviewed.aiAssisted,
    };
  } catch (error: any) {
    const history = await fallbackFromHistory(card.id);
    return {
      provider: status.providerLabel,
      mode: status.mode,
      configured: status.configured,
      recentSales: history,
      note: `${status.note} 外部接口调用失败，已回退到平台历史数据：${error.message}`,
      sourceBreakdown: buildSourceBreakdown(history),
      qualityScore: buildQualityScore(history, ["mock-history"], 0, false),
      totalFetched: history.length,
      filteredOutliers: 0,
      usedSources: ["mock-history"],
      aiAssisted: false,
    };
  }
}
