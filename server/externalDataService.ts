/**
 * externalDataService.ts
 * 外部数据源接入：eBay 成交价 + 卡淘市场数据
 */

import https from "https";
import http from "http";

// ─── 通用 HTTP 请求工具 ────────────────────────────────────────────────────────
function fetchUrl(url: string, options: { headers?: Record<string, string>; timeout?: number } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const protocol = parsed.protocol === "https:" ? https : http;
    const req = protocol.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          ...options.headers,
        },
        timeout: options.timeout || 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// ─── eBay 成交价数据 ──────────────────────────────────────────────────────────
export interface EbayListing {
  title: string;
  price: number;
  currency: string;
  soldDate: string;
  condition: string;
  grade: string;
  url: string;
  imageUrl: string;
  source: "ebay";
}

/**
 * 从 eBay 搜索已成交的球星卡
 * 使用 eBay 搜索页面的公开数据（不需要 API key）
 */
export async function searchEbaySoldListings(
  playerName: string,
  cardInfo: { year?: number; brand?: string; parallel?: string; grade?: string }
): Promise<EbayListing[]> {
  // 构建搜索关键词
  const parts = [playerName];
  if (cardInfo.year) parts.push(String(cardInfo.year));
  if (cardInfo.brand) parts.push(cardInfo.brand.replace("Panini ", ""));
  if (cardInfo.parallel && cardInfo.parallel !== "Base") parts.push(cardInfo.parallel);
  if (cardInfo.grade && cardInfo.grade !== "Raw") parts.push(cardInfo.grade);
  parts.push("card");

  const query = parts.join(" ");
  const encodedQuery = encodeURIComponent(query);

  // eBay 已成交商品搜索 URL（LH_Complete=1&LH_Sold=1）
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=214&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=20`;

  try {
    const html = await fetchUrl(url, { timeout: 12000 });
    return parseEbayListings(html, query);
  } catch (err) {
    console.error("[eBay] Fetch error:", err);
    return [];
  }
}

/**
 * 解析 eBay 搜索结果 HTML
 */
function parseEbayListings(html: string, query: string): EbayListing[] {
  const listings: EbayListing[] = [];

  // 提取商品条目
  const itemRegex = /s-item__wrapper[^>]*>([\s\S]*?)(?=s-item__wrapper|<\/ul>)/g;
  const priceRegex = /s-item__price[^>]*>[\s\S]*?\$([0-9,]+\.?\d*)/;
  const titleRegex = /s-item__title[^>]*>([^<]+)</;
  const linkRegex = /s-item__link[^>]*href="([^"]+)"/;
  const imgRegex = /s-item__image-img[^>]*src="([^"]+)"/;
  const soldDateRegex = /SOLD\s+(\w+\s+\d+,?\s*\d*)/i;

  let match;
  let count = 0;

  while ((match = itemRegex.exec(html)) !== null && count < 10) {
    const block = match[1];

    const priceMatch = priceRegex.exec(block);
    const titleMatch = titleRegex.exec(block);
    const linkMatch = linkRegex.exec(block);
    const imgMatch = imgRegex.exec(block);
    const dateMatch = soldDateRegex.exec(block);

    if (!priceMatch || !titleMatch) continue;

    const price = parseFloat(priceMatch[1].replace(",", ""));
    if (isNaN(price) || price < 1) continue;

    const title = titleMatch[1].trim();
    if (title.includes("Shop on eBay") || title.includes("Results matching")) continue;

    // 从标题中提取评级信息
    const gradeMatch = title.match(/PSA\s*(\d+)|BGS\s*(\d+\.?\d*)|SGC\s*(\d+)/i);
    const grade = gradeMatch ? gradeMatch[0].toUpperCase() : "Raw";

    listings.push({
      title,
      price,
      currency: "USD",
      soldDate: dateMatch ? dateMatch[1] : new Date().toLocaleDateString("en-US"),
      condition: grade !== "Raw" ? "Graded" : "Ungraded",
      grade,
      url: linkMatch ? linkMatch[1].split("?")[0] : `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
      imageUrl: imgMatch ? imgMatch[1] : "",
      source: "ebay",
    });
    count++;
  }

  return listings;
}

/**
 * 获取 eBay 当前在售价格（非成交）
 */
export async function searchEbayActiveListings(
  playerName: string,
  cardInfo: { year?: number; brand?: string; grade?: string }
): Promise<EbayListing[]> {
  const parts = [playerName];
  if (cardInfo.year) parts.push(String(cardInfo.year));
  if (cardInfo.brand) parts.push(cardInfo.brand.replace("Panini ", ""));
  if (cardInfo.grade && cardInfo.grade !== "Raw") parts.push(cardInfo.grade);
  parts.push("card");

  const query = parts.join(" ");
  const encodedQuery = encodeURIComponent(query);

  // eBay 当前在售（按价格排序）
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=214&_sop=15&_ipg=10`;

  try {
    const html = await fetchUrl(url, { timeout: 12000 });
    return parseEbayListings(html, query);
  } catch (err) {
    console.error("[eBay Active] Fetch error:", err);
    return [];
  }
}

// ─── 卡淘数据 ─────────────────────────────────────────────────────────────────
export interface KataoListing {
  title: string;
  price: number;
  currency: "CNY";
  soldDate: string;
  condition: string;
  grade: string;
  url: string;
  imageUrl: string;
  source: "katao";
}

/**
 * 从卡淘搜索球星卡成交数据
 * cardhobby.com.cn 是国内主要球星卡交易平台
 */
export async function searchKataoListings(
  playerName: string,
  cardInfo: { year?: number; brand?: string; grade?: string }
): Promise<KataoListing[]> {
  // 构建搜索关键词（卡淘支持中英文混合搜索）
  const parts = [playerName];
  if (cardInfo.year) parts.push(String(cardInfo.year));
  if (cardInfo.brand) {
    const brandShort = cardInfo.brand.replace("Panini ", "").replace("National Treasures", "NT");
    parts.push(brandShort);
  }
  if (cardInfo.grade && cardInfo.grade !== "Raw") parts.push(cardInfo.grade);

  const query = parts.join(" ");
  const encodedQuery = encodeURIComponent(query);

  // 卡淘搜索 API
  const url = `https://api.cardhobby.com.cn/api/v1/product/search?keyword=${encodedQuery}&page=1&pageSize=10&sort=time`;

  try {
    const data = await fetchUrl(url, {
      timeout: 10000,
      headers: {
        "Accept": "application/json",
        "Origin": "https://www.cardhobby.com.cn",
        "Referer": "https://www.cardhobby.com.cn/",
      },
    });

    const json = JSON.parse(data);
    return parseKataoResponse(json);
  } catch (err) {
    // 尝试网页版搜索
    try {
      const webUrl = `https://www.cardhobby.com.cn/Market/Search?keyword=${encodedQuery}&sort=2`;
      const html = await fetchUrl(webUrl, { timeout: 10000 });
      return parseKataoHtml(html);
    } catch (err2) {
      console.error("[卡淘] Fetch error:", err2);
      return [];
    }
  }
}

function parseKataoResponse(json: any): KataoListing[] {
  const listings: KataoListing[] = [];

  const items = json?.data?.list || json?.data?.items || json?.result?.list || [];

  for (const item of items.slice(0, 8)) {
    const price = parseFloat(item.price || item.currentPrice || item.salePrice || 0);
    if (!price) continue;

    listings.push({
      title: item.title || item.name || item.cardName || "球星卡",
      price,
      currency: "CNY",
      soldDate: item.soldTime || item.createTime || item.updatedAt || new Date().toISOString(),
      condition: item.grade ? "Graded" : "Ungraded",
      grade: item.grade || item.cardGrade || "Raw",
      url: item.url || `https://www.cardhobby.com.cn/Market/Detail/${item.id || ""}`,
      imageUrl: item.imageUrl || item.coverImage || item.img || "",
      source: "katao",
    });
  }

  return listings;
}

function parseKataoHtml(html: string): KataoListing[] {
  const listings: KataoListing[] = [];

  // 解析卡淘网页的商品列表
  const priceRegex = /class="price[^"]*"[^>]*>[\s\S]*?¥\s*([0-9,]+\.?\d*)/g;
  const titleRegex = /class="title[^"]*"[^>]*>([^<]{5,100})</g;

  const prices: number[] = [];
  const titles: string[] = [];

  let m;
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parseFloat(m[1].replace(",", ""));
    if (!isNaN(p) && p > 0) prices.push(p);
  }
  while ((m = titleRegex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t.length > 5) titles.push(t);
  }

  for (let i = 0; i < Math.min(prices.length, titles.length, 8); i++) {
    listings.push({
      title: titles[i],
      price: prices[i],
      currency: "CNY",
      soldDate: new Date().toLocaleDateString("zh-CN"),
      condition: "Unknown",
      grade: "Raw",
      url: "https://www.cardhobby.com.cn",
      imageUrl: "",
      source: "katao",
    });
  }

  return listings;
}

// ─── 综合市场数据查询 ──────────────────────────────────────────────────────────
export interface MarketDataResult {
  playerName: string;
  cardInfo: { year?: number; brand?: string; parallel?: string; grade?: string };
  ebayListings: EbayListing[];
  kataoListings: KataoListing[];
  summary: {
    ebayAvgPrice: number | null;
    ebayMinPrice: number | null;
    ebayMaxPrice: number | null;
    kataoAvgPriceCNY: number | null;
    totalListings: number;
    lastUpdated: string;
  };
}

export async function getMarketData(
  playerName: string,
  cardInfo: { year?: number; brand?: string; parallel?: string; grade?: string }
): Promise<MarketDataResult> {
  // 并行请求 eBay 和卡淘
  const [ebayListings, kataoListings] = await Promise.allSettled([
    searchEbaySoldListings(playerName, cardInfo),
    searchKataoListings(playerName, cardInfo),
  ]);

  const ebay = ebayListings.status === "fulfilled" ? ebayListings.value : [];
  const katao = kataoListings.status === "fulfilled" ? kataoListings.value : [];

  // 计算统计数据
  const ebayPrices = ebay.map((l) => l.price).filter((p) => p > 0);
  const kataoPrices = katao.map((l) => l.price).filter((p) => p > 0);

  return {
    playerName,
    cardInfo,
    ebayListings: ebay,
    kataoListings: katao,
    summary: {
      ebayAvgPrice: ebayPrices.length ? Math.round(ebayPrices.reduce((a, b) => a + b, 0) / ebayPrices.length) : null,
      ebayMinPrice: ebayPrices.length ? Math.min(...ebayPrices) : null,
      ebayMaxPrice: ebayPrices.length ? Math.max(...ebayPrices) : null,
      kataoAvgPriceCNY: kataoPrices.length ? Math.round(kataoPrices.reduce((a, b) => a + b, 0) / kataoPrices.length) : null,
      totalListings: ebay.length + katao.length,
      lastUpdated: new Date().toISOString(),
    },
  };
}
