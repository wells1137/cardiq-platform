/**
 * multiPlatformService.ts
 * 多平台球星卡数据采集服务
 * 支持：卡淘（cardhobby.com.cn）、闲鱼（goofish.com）、小红书（xiaohongshu.com）
 *
 * 采集策略：
 * - 卡淘：直接调用公开 API（SearchCommodity），无需登录，支持在售/成交记录
 * - 闲鱼：Playwright 无头浏览器自动化（需要登录 cookie）
 * - 小红书：HTML 解析 + 关键词提取（需要 cookie 获取完整数据）
 */

import https from "https";
import http from "http";

// ─── 通用 HTTP 工具 ────────────────────────────────────────────────────────────

interface FetchOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

function fetchUrl(url: string, options: FetchOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const protocol = parsed.protocol === "https:" ? https : http;
    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/html, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
        ...options.headers,
      },
      timeout: options.timeout || 15000,
    };

    const req = protocol.request(url, reqOptions, (res) => {
      // 处理重定向
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location, options).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}

// ─── 统一数据结构 ──────────────────────────────────────────────────────────────

export interface PlatformListing {
  id: string;
  title: string;
  price: number;
  currency: "CNY" | "USD";
  priceUSD?: number; // 折算美元（按当前汇率）
  status: "active" | "sold" | "unknown";
  listedDate?: string;
  soldDate?: string;
  condition: string;
  grade?: string;
  seller?: string;
  imageUrl?: string;
  url: string;
  source: "katao" | "xianyu" | "xiaohongshu";
  sourceName: string;
  rawData?: any;
}

export interface MultiPlatformResult {
  keyword: string;
  playerName: string;
  platforms: {
    katao: { listings: PlatformListing[]; total: number; error?: string };
    xianyu: { listings: PlatformListing[]; total: number; error?: string };
    xiaohongshu: { listings: PlatformListing[]; total: number; error?: string };
  };
  summary: {
    totalListings: number;
    avgPriceCNY: number | null;
    minPriceCNY: number | null;
    maxPriceCNY: number | null;
    soldCount: number;
    activeCount: number;
    lastUpdated: string;
  };
}

// 人民币兑美元汇率（可从环境变量覆盖）
const CNY_TO_USD = parseFloat(process.env.CNY_TO_USD_RATE || "0.138");

// ─── 卡淘数据采集 ──────────────────────────────────────────────────────────────

/**
 * 卡淘 SearchCommodity API
 * - Status=1: 在售
 * - Status=-2: 已售出（成交记录）
 * - 无需登录，直接调用
 */
async function fetchKataoListings(
  keyword: string,
  status: 1 | -2 = 1,
  pageIndex: number = 1,
  pageSize: number = 20
): Promise<{ items: PlatformListing[]; total: number }> {
  const searchJson = JSON.stringify([{ Key: "Status", Value: status }]);
  const params = new URLSearchParams({
    userId: "",
    pageIndex: String(pageIndex),
    pageSize: String(pageSize),
    searchKey: keyword,
    searchJson,
    sort: "EffectiveTimeStamp",
    sortType: "desc",
  });

  const url = `https://www.cardhobby.com.cn/NewCommodity/SearchCommodity?${params}`;

  try {
    const raw = await fetchUrl(url, {
      headers: {
        Referer: "https://www.cardhobby.com.cn/Market",
        Accept: "application/json",
      },
      timeout: 12000,
    });

    const json = JSON.parse(raw);
    if (!json.data || json.result !== 1) {
      throw new Error(json.msg || "API returned error");
    }

    const data = json.data;
    const total = data.TotalCount || 0;
    const rawItems: any[] = data.PagedMarketItemList || [];

    const listings: PlatformListing[] = rawItems.map((item) => {
      // ByWay=1: 一口价（Price 是售价），ByWay=2: 拍卖（Price 是当前出价，LowestPrice 是起拍价）
      const rawPrice = parseFloat(item.Price || "0");
      const lowestPrice = parseFloat(item.LowestPrice || "0");
      // 拍卖商品：如果 Price=1（起拍价）且 LowestPrice > 1，用 LowestPrice；否则用 Price
      const price = item.ByWay === 2
        ? (rawPrice > 1 ? rawPrice : lowestPrice)
        : rawPrice;
      const isSold = item.Status === -2;
      return {
        id: String(item.ID),
        title: item.Title || "",
        price,
        currency: "CNY",
        priceUSD: Math.round(price * CNY_TO_USD * 100) / 100,
        status: isSold ? "sold" : "active",
        listedDate: item.EffectiveDate || undefined,
        soldDate: isSold ? (item.UpdateDate || item.EffectiveDate || undefined) : undefined,
        condition: item.IsGuarantee ? "已担保" : "未担保",
        grade: extractGrade(item.Title || ""),
        seller: item.SellRealName || undefined,
        imageUrl: item.TitImg || undefined,
        url: `https://www.cardhobby.com.cn/market/item/${item.ID}`,
        source: "katao",
        sourceName: "卡淘",
        rawData: item,
      };
    });

    return { items: listings, total };
  } catch (err: any) {
    throw new Error(`卡淘 API 错误: ${err.message}`);
  }
}

/**
 * 获取卡淘在售 + 成交记录（合并）
 */
export async function getKataoData(
  playerName: string,
  options: { year?: number; brand?: string; grade?: string; pageSize?: number } = {}
): Promise<{ listings: PlatformListing[]; total: number; error?: string }> {
  const keywordParts = [playerName];
  if (options.year) keywordParts.push(String(options.year));
  if (options.brand) keywordParts.push(options.brand.replace("Panini ", "").replace("National Treasures", "NT"));
  if (options.grade && options.grade !== "Raw") keywordParts.push(options.grade);
  const keyword = keywordParts.join(" ");

  try {
    // 并行获取在售和成交记录
    const [activeResult, soldResult] = await Promise.allSettled([
      fetchKataoListings(keyword, 1, 1, options.pageSize || 10),
      fetchKataoListings(keyword, -2, 1, options.pageSize || 10),
    ]);

    const active = activeResult.status === "fulfilled" ? activeResult.value : { items: [], total: 0 };
    const sold = soldResult.status === "fulfilled" ? soldResult.value : { items: [], total: 0 };

    const allListings = [...active.items, ...sold.items];
    const total = active.total + sold.total;

    return { listings: allListings, total };
  } catch (err: any) {
    return { listings: [], total: 0, error: err.message };
  }
}

// ─── 闲鱼数据采集 ──────────────────────────────────────────────────────────────

/**
 * 闲鱼数据采集策略：
 * 1. 优先：通过环境变量 XIANYU_COOKIE 提供登录 cookie，调用移动端 API
 * 2. 降级：解析网页 HTML 提取商品列表（数据有限）
 * 3. 最低：返回空结果并提示需要配置
 */
export async function getXianyuData(
  playerName: string,
  options: { year?: number; brand?: string; grade?: string } = {}
): Promise<{ listings: PlatformListing[]; total: number; error?: string }> {
  const keyword = buildKeyword(playerName, options, "球星卡");

  // 方案1：有 cookie 时使用移动端 API
  const cookie = process.env.XIANYU_COOKIE;
  if (cookie) {
    try {
      return await fetchXianyuWithCookie(keyword, cookie);
    } catch (err: any) {
      console.warn("[闲鱼] Cookie 方式失败，尝试 HTML 解析:", err.message);
    }
  }

  // 方案2：HTML 解析（无需登录，但数据较少）
  try {
    return await fetchXianyuHtml(keyword);
  } catch (err: any) {
    return {
      listings: [],
      total: 0,
      error: `闲鱼数据获取失败。如需完整数据，请在环境变量 XIANYU_COOKIE 中配置登录 cookie。错误: ${err.message}`,
    };
  }
}

async function fetchXianyuWithCookie(
  keyword: string,
  cookie: string
): Promise<{ listings: PlatformListing[]; total: number }> {
  // 闲鱼移动端搜索 API（需要登录 cookie 和 sign 签名）
  // 注意：闲鱼有 sign 签名保护，此处使用简化版本
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.goofish.com/search?q=${encodedKeyword}&type=item`;

  const raw = await fetchUrl(url, {
    headers: {
      Cookie: cookie,
      Referer: "https://www.goofish.com/",
    },
    timeout: 15000,
  });

  return parseXianyuHtml(raw, keyword);
}

async function fetchXianyuHtml(keyword: string): Promise<{ listings: PlatformListing[]; total: number }> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.goofish.com/search?q=${encodedKeyword}&type=item`;

  const raw = await fetchUrl(url, {
    headers: {
      Referer: "https://www.goofish.com/",
    },
    timeout: 15000,
  });

  return parseXianyuHtml(raw, keyword);
}

function parseXianyuHtml(html: string, keyword: string): { listings: PlatformListing[]; total: number } {
  const listings: PlatformListing[] = [];

  // 从 HTML 中提取 __INITIAL_DATA__ 或商品 JSON
  const initDataMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?})\s*<\/script>/);
  if (initDataMatch) {
    try {
      const data = JSON.parse(initDataMatch[1]);
      // 闲鱼的数据结构因版本而异
      const items =
        data?.data?.resultList ||
        data?.data?.items ||
        data?.pageData?.data?.resultList ||
        [];

      for (const item of items.slice(0, 20)) {
        const info = item?.data?.item || item?.item || item;
        const price = parseFloat(info?.priceText?.replace(/[^0-9.]/g, "") || info?.price || "0");
        if (!price) continue;

        listings.push({
          id: String(info?.itemId || info?.id || Math.random()),
          title: info?.title || info?.name || keyword,
          price,
          currency: "CNY",
          priceUSD: Math.round(price * CNY_TO_USD * 100) / 100,
          status: "active",
          condition: info?.condition || "二手",
          seller: info?.user?.nickName || undefined,
          imageUrl: info?.pic || info?.image || undefined,
          url: info?.itemId ? `https://www.goofish.com/item?id=${info.itemId}` : "https://www.goofish.com",
          source: "xianyu",
          sourceName: "闲鱼",
        });
      }

      return { listings, total: listings.length };
    } catch {
      // JSON 解析失败，继续用正则
    }
  }

  // 正则提取价格和标题
  const priceMatches = html.matchAll(/["']priceText["']\s*:\s*["']([^"']+)["']/g);
  const titleMatches = html.matchAll(/["']title["']\s*:\s*["']([^"']{5,100})["']/g);
  const prices: number[] = [];
  const titles: string[] = [];

  for (const m of priceMatches) {
    const p = parseFloat(m[1].replace(/[^0-9.]/g, ""));
    if (p > 0) prices.push(p);
  }
  for (const m of titleMatches) {
    if (m[1].includes("球星") || m[1].includes("卡") || m[1].toLowerCase().includes("card")) {
      titles.push(m[1]);
    }
  }

  for (let i = 0; i < Math.min(prices.length, titles.length, 10); i++) {
    listings.push({
      id: `xianyu-${i}`,
      title: titles[i],
      price: prices[i],
      currency: "CNY",
      priceUSD: Math.round(prices[i] * CNY_TO_USD * 100) / 100,
      status: "active",
      condition: "二手",
      url: "https://www.goofish.com",
      source: "xianyu",
      sourceName: "闲鱼",
    });
  }

  return { listings, total: listings.length };
}

// ─── 小红书数据采集 ────────────────────────────────────────────────────────────

/**
 * 小红书数据采集策略：
 * 1. 优先：通过环境变量 XHS_COOKIE 提供登录 cookie，调用搜索 API
 * 2. 降级：解析网页 HTML 提取帖子中的价格信息
 * 3. 最低：返回空结果并提示需要配置
 *
 * 小红书的价格数据主要来自：
 * - 用户发布的出售帖（含价格）
 * - 晒卡帖（含参考价格）
 * - 求购帖（含心理价位）
 */
export async function getXiaohongshuData(
  playerName: string,
  options: { year?: number; brand?: string } = {}
): Promise<{ listings: PlatformListing[]; total: number; error?: string }> {
  const keyword = buildKeyword(playerName, options, "球星卡");

  const cookie = process.env.XHS_COOKIE;
  if (cookie) {
    try {
      return await fetchXhsWithCookie(keyword, cookie);
    } catch (err: any) {
      console.warn("[小红书] Cookie 方式失败，尝试 HTML 解析:", err.message);
    }
  }

  try {
    return await fetchXhsHtml(keyword);
  } catch (err: any) {
    return {
      listings: [],
      total: 0,
      error: `小红书数据获取失败。如需完整数据，请在环境变量 XHS_COOKIE 中配置登录 cookie。错误: ${err.message}`,
    };
  }
}

async function fetchXhsWithCookie(
  keyword: string,
  cookie: string
): Promise<{ listings: PlatformListing[]; total: number }> {
  // 小红书 Web API（需要 cookie 和 X-Sign 签名）
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodedKeyword}&type=51`;

  const raw = await fetchUrl(url, {
    headers: {
      Cookie: cookie,
      Referer: "https://www.xiaohongshu.com/",
    },
    timeout: 15000,
  });

  return parseXhsHtml(raw, keyword);
}

async function fetchXhsHtml(keyword: string): Promise<{ listings: PlatformListing[]; total: number }> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodedKeyword}&type=51`;

  const raw = await fetchUrl(url, {
    headers: {
      Referer: "https://www.xiaohongshu.com/",
    },
    timeout: 15000,
  });

  return parseXhsHtml(raw, keyword);
}

function parseXhsHtml(html: string, keyword: string): { listings: PlatformListing[]; total: number } {
  const listings: PlatformListing[] = [];

  // 提取帖子中的价格信息（正则匹配）
  // 小红书帖子中价格通常以 "¥xxx"、"xxx元"、"出xxx" 等形式出现
  const pricePatterns = [
    /出\s*([0-9,]+\.?\d*)\s*元?/g,
    /售\s*([0-9,]+\.?\d*)\s*元?/g,
    /价格?\s*[:：]\s*([0-9,]+\.?\d*)/g,
    /([0-9,]+\.?\d*)\s*元/g,
    /¥\s*([0-9,]+\.?\d*)/g,
  ];

  // 提取帖子标题
  const titlePattern = /"title"\s*:\s*"([^"]{5,100})"/g;
  const noteIdPattern = /"noteId"\s*:\s*"([^"]+)"/g;
  const descPattern = /"desc"\s*:\s*"([^"]{5,200})"/g;

  const titles: string[] = [];
  const noteIds: string[] = [];
  const descs: string[] = [];

  let m;
  while ((m = titlePattern.exec(html)) !== null) {
    if (
      m[1].includes("球星") ||
      m[1].includes("卡") ||
      m[1].toLowerCase().includes("card") ||
      m[1].toLowerCase().includes("klay") ||
      m[1].toLowerCase().includes("thompson")
    ) {
      titles.push(m[1]);
    }
  }
  while ((m = noteIdPattern.exec(html)) !== null) {
    noteIds.push(m[1]);
  }
  while ((m = descPattern.exec(html)) !== null) {
    descs.push(m[1]);
  }

  // 从描述中提取价格
  const extractedPrices: number[] = [];
  for (const desc of descs) {
    for (const pattern of pricePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(desc);
      if (match) {
        const p = parseFloat(match[1].replace(",", ""));
        if (p > 0 && p < 1000000) {
          extractedPrices.push(p);
          break;
        }
      }
    }
  }

  // 组合帖子和价格
  for (let i = 0; i < Math.min(titles.length, 10); i++) {
    const price = extractedPrices[i] || 0;
    const noteId = noteIds[i] || "";

    listings.push({
      id: noteId || `xhs-${i}`,
      title: titles[i],
      price,
      currency: "CNY",
      priceUSD: price ? Math.round(price * CNY_TO_USD * 100) / 100 : undefined,
      status: price > 0 ? "active" : "unknown",
      condition: "二手/晒卡",
      url: noteId ? `https://www.xiaohongshu.com/explore/${noteId}` : "https://www.xiaohongshu.com",
      source: "xiaohongshu",
      sourceName: "小红书",
    });
  }

  return { listings, total: listings.length };
}

// ─── 综合多平台查询 ────────────────────────────────────────────────────────────

export async function getMultiPlatformData(
  playerName: string,
  options: {
    year?: number;
    brand?: string;
    grade?: string;
    pageSize?: number;
  } = {}
): Promise<MultiPlatformResult> {
  const keyword = buildKeyword(playerName, options);

  // 并行请求三个平台
  const [kataoResult, xianyuResult, xhsResult] = await Promise.allSettled([
    getKataoData(playerName, options),
    getXianyuData(playerName, options),
    getXiaohongshuData(playerName, options),
  ]);

  const katao =
    kataoResult.status === "fulfilled"
      ? kataoResult.value
      : { listings: [], total: 0, error: String(kataoResult.reason) };

  const xianyu =
    xianyuResult.status === "fulfilled"
      ? xianyuResult.value
      : { listings: [], total: 0, error: String(xianyuResult.reason) };

  const xiaohongshu =
    xhsResult.status === "fulfilled"
      ? xhsResult.value
      : { listings: [], total: 0, error: String(xhsResult.reason) };

  // 汇总统计
  const allListings = [...katao.listings, ...xianyu.listings, ...xiaohongshu.listings];
  const prices = allListings.filter((l) => l.price > 0).map((l) => l.price);
  const soldCount = allListings.filter((l) => l.status === "sold").length;
  const activeCount = allListings.filter((l) => l.status === "active").length;

  return {
    keyword,
    playerName,
    platforms: {
      katao: { listings: katao.listings, total: katao.total, error: katao.error },
      xianyu: { listings: xianyu.listings, total: xianyu.total, error: xianyu.error },
      xiaohongshu: { listings: xiaohongshu.listings, total: xiaohongshu.total, error: xiaohongshu.error },
    },
    summary: {
      totalListings: allListings.length,
      avgPriceCNY: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      minPriceCNY: prices.length ? Math.min(...prices) : null,
      maxPriceCNY: prices.length ? Math.max(...prices) : null,
      soldCount,
      activeCount,
      lastUpdated: new Date().toISOString(),
    },
  };
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function buildKeyword(
  playerName: string,
  options: { year?: number; brand?: string; grade?: string } = {},
  suffix?: string
): string {
  const parts = [playerName];
  if (options.year) parts.push(String(options.year));
  if (options.brand) {
    parts.push(options.brand.replace("Panini ", "").replace("National Treasures", "NT"));
  }
  if (options.grade && options.grade !== "Raw") parts.push(options.grade);
  if (suffix) parts.push(suffix);
  return parts.join(" ");
}

/**
 * 从标题中提取评级信息
 */
function extractGrade(title: string): string {
  const gradePatterns = [
    /PSA\s*(\d+(?:\.\d+)?)/i,
    /BGS\s*(\d+(?:\.\d+)?)/i,
    /SGC\s*(\d+(?:\.\d+)?)/i,
    /CGC\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of gradePatterns) {
    const match = title.match(pattern);
    if (match) {
      const company = match[0].match(/[A-Z]+/)?.[0] || "PSA";
      return `${company} ${match[1]}`;
    }
  }

  return "Raw";
}

/**
 * 获取卡淘 Klay Thompson 专项数据（带分页）
 */
export async function getKataoKlayData(options: {
  status?: 1 | -2;
  page?: number;
  pageSize?: number;
  extraKeywords?: string;
} = {}): Promise<{ listings: PlatformListing[]; total: number; error?: string }> {
  const keyword = `Klay Thompson${options.extraKeywords ? " " + options.extraKeywords : ""}`;
  const status = options.status ?? -2; // 默认查成交记录

  try {
    const result = await fetchKataoListings(keyword, status, options.page || 1, options.pageSize || 20);
    return { listings: result.items, total: result.total };
  } catch (err: any) {
    return { listings: [], total: 0, error: err.message };
  }
}
