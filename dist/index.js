var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cards: () => cards,
  investmentReports: () => investmentReports,
  notifications: () => notifications,
  players: () => players,
  portfolioPositions: () => portfolioPositions,
  priceHistory: () => priceHistory,
  scanJobs: () => scanJobs,
  scanSchedule: () => scanSchedule,
  trendSnapshots: () => trendSnapshots,
  users: () => users,
  watchlist: () => watchlist
});
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json
} from "drizzle-orm/mysql-core";
var users, players, cards, priceHistory, watchlist, notifications, investmentReports, portfolioPositions, trendSnapshots, scanJobs, scanSchedule;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    players = mysqlTable("players", {
      id: int("id").autoincrement().primaryKey(),
      externalId: varchar("externalId", { length: 64 }).notNull().unique(),
      // BallDontLie player ID
      name: varchar("name", { length: 128 }).notNull(),
      sport: mysqlEnum("sport", ["NBA", "NFL", "MLB", "NHL", "EPL"]).notNull().default("NBA"),
      team: varchar("team", { length: 64 }),
      position: varchar("position", { length: 32 }),
      jerseyNumber: varchar("jerseyNumber", { length: 8 }),
      imageUrl: text("imageUrl"),
      // 近期表现评分（0-100）
      performanceScore: float("performanceScore").default(0),
      // 近期统计摘要（JSON）
      recentStats: json("recentStats"),
      lastStatsUpdate: timestamp("lastStatsUpdate"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    cards = mysqlTable("cards", {
      id: int("id").autoincrement().primaryKey(),
      playerId: int("playerId").notNull(),
      playerName: varchar("playerName", { length: 128 }).notNull(),
      sport: mysqlEnum("sport", ["NBA", "NFL", "MLB", "NHL", "EPL"]).notNull().default("NBA"),
      year: int("year"),
      brand: varchar("brand", { length: 64 }),
      // Panini, Topps, Upper Deck 等
      set: varchar("set", { length: 128 }),
      // Prizm, Select, Mosaic 等
      cardNumber: varchar("cardNumber", { length: 32 }),
      parallel: varchar("parallel", { length: 64 }),
      // Base, Silver, Gold, PSA 10 等
      grade: varchar("grade", { length: 32 }),
      // PSA 10, BGS 9.5 等
      population: int("population"),
      // PSA 人口报告
      imageUrl: text("imageUrl"),
      // 当前市价估值
      currentPrice: float("currentPrice"),
      // 30天均价
      avgPrice30d: float("avgPrice30d"),
      // 价格变动百分比（7天）
      priceChange7d: float("priceChange7d"),
      // AI 抄底评分（0-100，越高越值得买）
      dealScore: float("dealScore"),
      // 是否标记为抄底机会
      isDealOpportunity: boolean("isDealOpportunity").default(false),
      // 市场情绪（bullish/neutral/bearish）
      marketSentiment: mysqlEnum("marketSentiment", ["bullish", "neutral", "bearish"]).default("neutral"),
      lastPriceUpdate: timestamp("lastPriceUpdate"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    priceHistory = mysqlTable("price_history", {
      id: int("id").autoincrement().primaryKey(),
      cardId: int("cardId").notNull(),
      price: float("price").notNull(),
      source: mysqlEnum("source", ["ebay", "cardhedge", "pwcc", "manual"]).default("ebay"),
      saleDate: timestamp("saleDate").notNull(),
      condition: varchar("condition", { length: 32 }),
      listingUrl: text("listingUrl"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    watchlist = mysqlTable("watchlist", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      cardId: int("cardId"),
      playerId: int("playerId"),
      // 价格提醒阈值（低于此价格触发通知）
      alertPriceBelow: float("alertPriceBelow"),
      // 抄底评分阈值（高于此分数触发通知）
      alertDealScoreAbove: float("alertDealScoreAbove"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    notifications = mysqlTable("notifications", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: mysqlEnum("type", ["deal_alert", "price_drop", "scan_complete", "report_ready"]).notNull(),
      title: varchar("title", { length: 256 }).notNull(),
      content: text("content").notNull(),
      cardId: int("cardId"),
      isRead: boolean("isRead").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    investmentReports = mysqlTable("investment_reports", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      title: varchar("title", { length: 256 }).notNull(),
      sport: varchar("sport", { length: 32 }),
      content: text("content").notNull(),
      // LLM 生成的 Markdown 报告
      topDeals: json("topDeals"),
      // 报告中推荐的卡片 ID 列表
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    portfolioPositions = mysqlTable("portfolio_positions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      cardId: int("cardId").notNull(),
      quantity: float("quantity").default(1).notNull(),
      averageCost: float("averageCost").notNull(),
      targetPrice: float("targetPrice"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    trendSnapshots = mysqlTable("trend_snapshots", {
      id: int("id").autoincrement().primaryKey(),
      cardId: int("cardId").notNull(),
      trend: mysqlEnum("trend", ["bullish", "neutral", "bearish"]).notNull(),
      confidence: int("confidence").notNull(),
      compositeScore: int("compositeScore").notNull(),
      source: mysqlEnum("source", ["scan", "detail", "manual"]).default("scan").notNull(),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    scanJobs = mysqlTable("scan_jobs", {
      id: int("id").autoincrement().primaryKey(),
      status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
      triggeredBy: mysqlEnum("triggeredBy", ["manual", "auto"]).default("manual").notNull(),
      dealsFound: int("dealsFound").default(0),
      cardsScanned: int("cardsScanned").default(0),
      watchlistHits: int("watchlistHits").default(0),
      // 命中监控列表的数量
      errorMessage: text("errorMessage"),
      startedAt: timestamp("startedAt"),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    scanSchedule = mysqlTable("scan_schedule", {
      id: int("id").autoincrement().primaryKey(),
      enabled: boolean("enabled").default(false).notNull(),
      // 每天执行的小时（0-23，UTC+8 时区）
      hour: int("hour").default(8).notNull(),
      // 每天执行的分钟（0-59）
      minute: int("minute").default(0).notNull(),
      // 时区标识（用于展示）
      timezone: varchar("timezone", { length: 64 }).default("Asia/Shanghai").notNull(),
      // 上次自动执行时间
      lastRunAt: timestamp("lastRunAt"),
      // 下次预计执行时间
      nextRunAt: timestamp("nextRunAt"),
      // 触发通知的最低抄底评分阈值
      dealScoreThreshold: float("dealScoreThreshold").default(70).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/sportsDataService.ts
import axios from "axios";
async function fetchPlayerStats(playerId, season = 2024) {
  try {
    const res = await bdlClient.get("/stats", {
      params: { player_ids: [playerId], seasons: [season], per_page: 15 }
    });
    return res.data.data || [];
  } catch (err) {
    console.error("[BDL] fetchPlayerStats error:", err);
    return [];
  }
}
function calculatePerformanceScore(stats) {
  if (stats.length === 0) return { score: 50, summary: {} };
  const recent = stats.slice(-10);
  const avg2 = (key) => recent.reduce((sum, s) => sum + (Number(s[key]) || 0), 0) / recent.length;
  const pts = avg2("pts");
  const reb = avg2("reb");
  const ast = avg2("ast");
  const stl = avg2("stl");
  const blk = avg2("blk");
  const to = avg2("turnover");
  const fgPct = avg2("fg_pct");
  const rawScore = pts * 1 + reb * 1.2 + ast * 1.5 + stl * 2 + blk * 2 - to * 1 + fgPct * 20;
  const score = Math.min(100, Math.max(0, rawScore / 60 * 100));
  return {
    score: Math.round(score * 10) / 10,
    summary: {
      pts: Math.round(pts * 10) / 10,
      reb: Math.round(reb * 10) / 10,
      ast: Math.round(ast * 10) / 10,
      stl: Math.round(stl * 10) / 10,
      blk: Math.round(blk * 10) / 10,
      to: Math.round(to * 10) / 10,
      fgPct: Math.round(fgPct * 1e3) / 10,
      gamesPlayed: recent.length
    }
  };
}
function generateCardData(playerId, playerName, sport, performanceScore) {
  const cards2 = [];
  const createHistory = (targetPrice, volatility) => {
    let currentPrice = targetPrice * (1 - volatility / 2);
    const history = [];
    for (let d = 89; d >= 0; d--) {
      const move = (Math.random() - 0.45) * volatility * targetPrice;
      const pull = (targetPrice - currentPrice) * 0.05;
      currentPrice += move + pull;
      if (currentPrice < 5) currentPrice = 5;
      if (Math.random() < 0.4 || d === 0) {
        history.push({
          date: new Date(Date.now() - d * 24 * 60 * 60 * 1e3),
          price: Math.round(currentPrice * 100) / 100,
          source: Math.random() > 0.5 ? "ebay" : "pwcc"
        });
      }
    }
    history[history.length - 1].price = targetPrice;
    return history;
  };
  const createCard = (year, brand, set, parallel, grade, targetPrice, dealScore) => {
    const history = createHistory(targetPrice, 0.15);
    const avg30d = history.slice(-10).reduce((sum, h) => sum + h.price, 0) / Math.min(10, history.length);
    const oldPrice = history[Math.max(0, history.length - 8)].price;
    const change7d = (targetPrice - oldPrice) / oldPrice * 100;
    return {
      year,
      brand,
      set,
      parallel,
      grade,
      basePrice: targetPrice * 0.4,
      currentPrice: targetPrice,
      avgPrice30d: Math.round(avg30d * 100) / 100,
      priceChange7d: Math.round(change7d * 10) / 10,
      dealScore,
      isDealOpportunity: dealScore > 75,
      marketSentiment: change7d > 5 ? "bullish" : change7d < -5 ? "bearish" : "neutral",
      priceHistory: history
    };
  };
  if (playerName === "Victor Wembanyama") {
    cards2.push(createCard(2023, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1850.5, 82));
    cards2.push(createCard(2023, "Panini Prizm", "Base", "Base", "PSA 10", 275, 65));
    cards2.push(createCard(2023, "Panini Select", "Concourse", "Silver", "Raw", 85, 78));
    cards2.push(createCard(2023, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 12500, 91));
    cards2.push(createCard(2024, "Panini Prizm", "Base", "Gold Prizm", "PSA 10", 3200, 85));
    cards2.push(createCard(2023, "Panini Mosaic", "Base", "Silver", "PSA 10", 320, 72));
  } else if (playerName === "LeBron James") {
    cards2.push(createCard(2003, "Topps Chrome", "Base", "Base", "PSA 10", 6500, 88));
    cards2.push(createCard(2003, "Topps", "Base", "Base", "PSA 9", 1200, 71));
    cards2.push(createCard(2003, "Upper Deck Exquisite", "Rookie Patch Auto", "Base", "BGS 9", 45e3, 95));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 150, 60));
    cards2.push(createCard(2021, "Panini Select", "Concourse", "Silver", "PSA 10", 85, 58));
    cards2.push(createCard(2003, "Topps Chrome", "Base", "Refractor", "PSA 10", 8200, 90));
  } else if (playerName === "Stephen Curry") {
    cards2.push(createCard(2009, "Topps", "Base", "Base", "PSA 10", 3500, 85));
    cards2.push(createCard(2009, "Panini Studio", "Base", "Base", "BGS 9.5", 850, 74));
    cards2.push(createCard(2009, "Topps Chrome", "Base", "Base", "PSA 10", 9800, 92));
    cards2.push(createCard(2009, "Bowman Chrome", "Base", "Refractor", "PSA 10", 4500, 87));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
  } else if (playerName === "Shohei Ohtani") {
    cards2.push(createCard(2018, "Bowman Chrome", "Batting", "Base", "PSA 10", 450, 90));
    cards2.push(createCard(2018, "Topps Chrome Update", "Pitching", "Refractor", "PSA 10", 850, 82));
    cards2.push(createCard(2018, "Topps Chrome", "Base", "Base", "PSA 10", 320, 78));
    cards2.push(createCard(2023, "Topps Chrome", "Base", "Refractor", "PSA 10", 180, 71));
    cards2.push(createCard(2018, "Bowman Chrome", "Pitching", "Gold Refractor", "PSA 10", 1200, 88));
  } else if (playerName === "Lionel Messi") {
    cards2.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 550, 75));
    cards2.push(createCard(2004, "Panini Megacracks", "Base", "Base", "PSA 9", 2800, 81));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 420, 72));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Gold Prizm", "PSA 10", 1800, 84));
  } else if (playerName === "Patrick Mahomes") {
    cards2.push(createCard(2017, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 4200, 89));
    cards2.push(createCard(2017, "Panini Prizm", "Base", "Base", "PSA 10", 850, 76));
    cards2.push(createCard(2017, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 18500, 93));
    cards2.push(createCard(2017, "Panini Select", "Concourse", "Silver", "PSA 10", 320, 71));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Gold Prizm", "PSA 10", 680, 79));
  } else if (playerName === "Nikola Jokic") {
    cards2.push(createCard(2015, "Panini Prizm", "Base", "Base", "PSA 9", 680, 82));
    cards2.push(createCard(2015, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800, 88));
    cards2.push(createCard(2015, "Panini Prizm", "Base", "Purple Prizm", "PSA 10", 1200, 85));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 320, 74));
    cards2.push(createCard(2015, "Panini Select", "Concourse", "Silver", "Raw", 180, 68));
  } else if (playerName === "Luka Doncic") {
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1450, 85));
    cards2.push(createCard(2018, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 8200, 91));
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Gold Prizm", "PSA 10", 3800, 87));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380, 72));
    cards2.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 420, 76));
  } else if (playerName === "Giannis Antetokounmpo") {
    cards2.push(createCard(2013, "Panini Prizm", "Base", "Base", "PSA 9", 850, 80));
    cards2.push(createCard(2013, "Panini Prizm", "Base", "Red Prizm", "PSA 10", 4200, 88));
    cards2.push(createCard(2013, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2100, 85));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 70));
    cards2.push(createCard(2013, "Panini Select", "Concourse", "Silver", "Raw", 320, 72));
  } else if (playerName === "Jayson Tatum") {
    cards2.push(createCard(2017, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 81));
    cards2.push(createCard(2017, "Panini Prizm", "Emergent", "Base", "Raw", 180, 68));
    cards2.push(createCard(2017, "Panini Prizm", "Base", "Blue Prizm", "PSA 10", 1200, 84));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 220, 66));
    cards2.push(createCard(2017, "Panini Select", "Concourse", "Silver", "PSA 10", 280, 73));
  } else if (playerName === "Joel Embiid") {
    cards2.push(createCard(2014, "Panini Prizm", "Base", "Base", "PSA 10", 980, 82));
    cards2.push(createCard(2014, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 3400, 88));
    cards2.push(createCard(2014, "Panini Prizm", "SP Variations", "Silver Prizm", "PSA 10", 5800, 91));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
  } else if (playerName === "Damian Lillard") {
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 9", 480, 78));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800, 85));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 150, 62));
    cards2.push(createCard(2012, "Panini Select", "Concourse", "Silver", "Raw", 120, 60));
  } else if (playerName === "Anthony Davis") {
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Base", "Raw", 280, 74));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200, 82));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
    cards2.push(createCard(2012, "Panini Select", "Concourse", "Silver", "PSA 10", 320, 70));
  } else if (playerName === "Kevin Durant") {
    cards2.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 9", 1200, 82));
    cards2.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 3500, 88));
    cards2.push(createCard(2007, "Topps Chrome", "Base", "Refractor", "PSA 10", 5800, 91));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 70));
    cards2.push(createCard(2007, "Bowman Chrome", "Base", "Refractor", "PSA 10", 2800, 85));
  } else if (playerName === "Tyrese Haliburton") {
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 180, 72));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Green Prizm", "PSA 10", 420, 78));
    cards2.push(createCard(2020, "Panini Select", "Concourse", "Silver", "Raw", 65, 65));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 74));
  } else if (playerName === "Josh Allen") {
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Base", "PSA 10", 680, 80));
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800, 87));
    cards2.push(createCard(2018, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 9800, 92));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380, 74));
    cards2.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 280, 71));
  } else if (playerName === "Justin Jefferson") {
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 380, 78));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1450, 85));
    cards2.push(createCard(2020, "Panini Select", "Concourse", "Silver", "Raw", 120, 68));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380, 72));
  } else if (playerName === "Travis Kelce") {
    cards2.push(createCard(2013, "Panini Prizm", "Base", "Base", "PSA 9", 480, 78));
    cards2.push(createCard(2013, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800, 85));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 70));
    cards2.push(createCard(2013, "Panini Select", "Concourse", "Silver", "Raw", 150, 64));
  } else if (playerName === "Mike Trout") {
    cards2.push(createCard(2011, "Topps", "Update", "Base", "PSA 10", 3200, 86));
    cards2.push(createCard(2011, "Topps Chrome", "Update", "Refractor", "PSA 10", 8500, 91));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
    cards2.push(createCard(2011, "Bowman Chrome", "Prospect", "Base", "PSA 10", 1800, 82));
  } else if (playerName === "Ronald Acuna Jr.") {
    cards2.push(createCard(2018, "Topps Chrome", "Base", "Base", "PSA 10", 320, 78));
    cards2.push(createCard(2018, "Topps Chrome Update", "Base", "Refractor Auto", "PSA 10", 1200, 85));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 150, 65));
    cards2.push(createCard(2018, "Bowman Chrome", "Prospect", "Gold Refractor", "PSA 10", 680, 80));
  } else if (playerName === "Erling Haaland") {
    cards2.push(createCard(2021, "Topps Chrome", "UEFA Champions League", "Base", "PSA 10", 280, 78));
    cards2.push(createCard(2021, "Topps Chrome", "UEFA Champions League", "Refractor", "PSA 10", 680, 84));
    cards2.push(createCard(2022, "Panini Prizm Premier League", "Base", "Silver Prizm", "PSA 10", 420, 80));
    cards2.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 180, 68));
    cards2.push(createCard(2023, "Topps Chrome", "Premier League", "Refractor", "PSA 10", 380, 76));
  } else if (playerName === "Mohamed Salah") {
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 320, 76));
    cards2.push(createCard(2020, "Panini Prizm Premier League", "Base", "Silver Prizm", "PSA 10", 280, 74));
    cards2.push(createCard(2022, "Panini Prizm Premier League", "Base", "Gold Prizm", "PSA 10", 680, 82));
    cards2.push(createCard(2014, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 480, 78));
  } else if (playerName === "Bukayo Saka") {
    cards2.push(createCard(2020, "Topps Chrome", "Merlin UEFA", "Base", "Raw", 120, 72));
    cards2.push(createCard(2020, "Topps Chrome", "Merlin UEFA", "Refractor", "PSA 10", 380, 79));
    cards2.push(createCard(2022, "Panini Prizm Premier League", "Base", "Silver Prizm", "PSA 10", 280, 75));
    cards2.push(createCard(2023, "Topps Chrome", "Premier League", "Refractor", "PSA 10", 220, 71));
  } else if (playerName === "Kylian Mbappe") {
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "BGS 9.5", 1200, 84));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "New Era", "Silver Prizm", "PSA 10", 3800, 90));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 680, 82));
    cards2.push(createCard(2020, "Panini Prizm Ligue 1", "Base", "Silver Prizm", "PSA 10", 480, 78));
  } else if (playerName === "Vinicius Junior") {
    cards2.push(createCard(2018, "Panini Donruss", "Rated Rookie", "Base", "PSA 9", 280, 74));
    cards2.push(createCard(2018, "Panini Donruss Optic", "Rated Rookie", "Base", "PSA 10", 680, 82));
    cards2.push(createCard(2022, "Panini Prizm La Liga", "Base", "Silver Prizm", "PSA 10", 380, 76));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 180, 68));
  } else if (playerName === "Ja Morant") {
    cards2.push(createCard(2019, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800, 87));
    cards2.push(createCard(2019, "Panini Prizm", "Base", "Base", "PSA 10", 480, 74));
    cards2.push(createCard(2019, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 6800, 91));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380, 72));
    cards2.push(createCard(2019, "Panini Select", "Concourse", "Silver", "PSA 10", 320, 70));
  } else if (playerName === "Zion Williamson") {
    cards2.push(createCard(2019, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200, 83));
    cards2.push(createCard(2019, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 9800, 92));
    cards2.push(createCard(2019, "Panini Select", "Concourse", "Silver", "PSA 10", 480, 76));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 420, 72));
  } else if (playerName === "Trae Young") {
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 980, 83));
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Base", "PSA 10", 280, 72));
    cards2.push(createCard(2018, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 4800, 88));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 70));
    cards2.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 220, 68));
  } else if (playerName === "Devin Booker") {
    cards2.push(createCard(2015, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 3200, 87));
    cards2.push(createCard(2015, "Panini Prizm", "Base", "Base", "PSA 9", 680, 76));
    cards2.push(createCard(2015, "Panini Prizm Emergent", "Rookie", "Base", "Raw", 280, 70));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 320, 72));
    cards2.push(createCard(2015, "Panini Select", "Concourse", "Silver", "PSA 10", 380, 74));
  } else if (playerName === "Shai Gilgeous-Alexander") {
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800, 88));
    cards2.push(createCard(2018, "Panini Prizm", "Base", "Base", "PSA 10", 580, 76));
    cards2.push(createCard(2018, "Panini Donruss", "Rated Rookie", "Green", "PSA 10", 480, 74));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 80));
    cards2.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 380, 73));
  } else if (playerName === "Anthony Edwards") {
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800, 87));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 9", 380, 74));
    cards2.push(createCard(2020, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 7200, 91));
    cards2.push(createCard(2022, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 82));
    cards2.push(createCard(2020, "Panini Select", "Concourse", "Silver", "PSA 10", 320, 72));
  } else if (playerName === "Cade Cunningham") {
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 78));
    cards2.push(createCard(2021, "Panini Prizm Choice", "Base", "Blue/Yellow/Green", "PSA 10", 1200, 82));
    cards2.push(createCard(2021, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 3800, 86));
    cards2.push(createCard(2021, "Panini Select", "Concourse", "Silver", "PSA 10", 280, 70));
  } else if (playerName === "Evan Mobley") {
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 580, 79));
    cards2.push(createCard(2021, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 4200, 87));
    cards2.push(createCard(2021, "Panini Select", "Concourse", "Silver", "PSA 10", 280, 72));
    cards2.push(createCard(2022, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380, 74));
  } else if (playerName === "Paolo Banchero") {
    cards2.push(createCard(2022, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 79));
    cards2.push(createCard(2022, "Panini Prizm Draft", "Base", "Orange Pulsar", "PSA 10", 1200, 83));
    cards2.push(createCard(2022, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 4800, 87));
    cards2.push(createCard(2022, "Panini Select", "Concourse", "Silver", "PSA 10", 280, 71));
  } else if (playerName === "Lamar Jackson") {
    cards2.push(createCard(2018, "Panini Prizm", "Rookie Introduction", "Silver Prizm", "PSA 10", 3200, 88));
    cards2.push(createCard(2018, "Panini Prizm Silver", "Instant Impact", "Silver Prizm", "PSA 10", 4800, 90));
    cards2.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 680, 76));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 580, 78));
  } else if (playerName === "Justin Herbert") {
    cards2.push(createCard(2020, "Panini National Treasures", "Tremendous Treasures", "Base", "PSA 10", 8800, 90));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800, 84));
    cards2.push(createCard(2020, "Panini Select", "Concourse", "Silver", "PSA 10", 480, 74));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 78));
  } else if (playerName === "Kyler Murray") {
    cards2.push(createCard(2019, "Panini Prizm", "Rookies", "Silver Prizm", "PSA 10", 1200, 81));
    cards2.push(createCard(2019, "Panini Prizm", "Rookies", "Base", "PSA 10", 380, 72));
    cards2.push(createCard(2019, "Panini Select", "Concourse", "Silver", "PSA 10", 280, 68));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380, 70));
  } else if (playerName === "Fernando Tatis Jr.") {
    cards2.push(createCard(2019, "Topps Chrome", "Base", "Refractor", "PSA 10", 1800, 85));
    cards2.push(createCard(2019, "Topps Chrome Auto", "Base", "Sepia Refractor Auto", "PSA 9", 3200, 88));
    cards2.push(createCard(2021, "Topps Chrome", "Base", "Refractor", "PSA 10", 680, 78));
    cards2.push(createCard(2019, "Bowman Chrome", "Prospect", "Gold Refractor", "PSA 10", 1200, 82));
  } else if (playerName === "Juan Soto") {
    cards2.push(createCard(2018, "Topps Chrome", "Base", "Refractor", "PSA 10", 1200, 83));
    cards2.push(createCard(2018, "Topps Update Chrome", "Base", "Base", "PSA 10", 680, 78));
    cards2.push(createCard(2021, "Topps Chrome", "Base", "Refractor", "PSA 10", 480, 74));
    cards2.push(createCard(2018, "Bowman Chrome", "Prospect", "Refractor", "PSA 10", 580, 76));
  } else if (playerName === "Julio Rodriguez") {
    cards2.push(createCard(2022, "Topps Chrome", "Update Rookie Debut", "Purple Refractor", "PSA 10", 980, 82));
    cards2.push(createCard(2022, "Topps Chrome Auto", "Update Rookie", "Refractor Auto", "BGS 9.5", 2800, 87));
    cards2.push(createCard(2023, "Topps Chrome", "Base", "Refractor", "PSA 10", 480, 76));
    cards2.push(createCard(2022, "Bowman Chrome", "Prospect", "Gold Refractor", "PSA 10", 680, 78));
  } else if (playerName === "Jude Bellingham") {
    cards2.push(createCard(2020, "Topps Chrome UCL", "Base", "Base", "PSA 10", 2800, 87));
    cards2.push(createCard(2020, "Topps Chrome Bundesliga", "Base", "Base", "PSA 10", 1800, 84));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 1200, 82));
    cards2.push(createCard(2020, "Topps Chrome", "Base", "Refractor", "PSA 10", 980, 80));
  } else if (playerName === "Pedri") {
    cards2.push(createCard(2021, "Topps Chrome UCL", "Base", "Base", "PSA 10", 680, 80));
    cards2.push(createCard(2021, "Topps Chrome", "Base", "Purple Carbon Fiber", "PSA 10", 1200, 84));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 480, 76));
  } else if (playerName === "Neymar Jr.") {
    cards2.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 1200, 82));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 2800, 87));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 680, 76));
  } else if (playerName === "Kobe Bryant") {
    cards2.push(createCard(1996, "Topps Chrome", "Base", "Base", "PSA 9", 8500, 90));
    cards2.push(createCard(1996, "Topps Chrome", "Base", "Refractor", "PSA 10", 28e3, 96));
    cards2.push(createCard(1996, "Topps Chrome", "Base", "Base", "PSA 10", 18e3, 94));
    cards2.push(createCard(2003, "Topps Chrome", "Base", "Refractor", "PSA 10", 4800, 88));
    cards2.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 2200, 85));
  } else if (playerName === "Shaquille O'Neal") {
    cards2.push(createCard(1992, "Topps", "Base", "Base", "BCCG 9", 280, 78));
    cards2.push(createCard(1992, "Topps", "Archives Gold", "Gold", "PSA 10", 1800, 86));
    cards2.push(createCard(1993, "Topps Finest", "Base", "Base", "PSA 10", 680, 82));
    cards2.push(createCard(1996, "Topps Chrome", "Base", "Refractor", "PSA 10", 1200, 84));
  } else if (playerName === "Dwyane Wade") {
    cards2.push(createCard(2003, "Topps Chrome", "Base", "Base", "PSA 10", 3800, 87));
    cards2.push(createCard(2003, "Topps Chrome", "Base", "Refractor", "PSA 10", 8500, 91));
    cards2.push(createCard(2003, "Upper Deck Exquisite", "Rookie Patch Auto", "Base", "BGS 9", 12e3, 93));
    cards2.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 680, 80));
  } else if (playerName === "Tim Duncan") {
    cards2.push(createCard(1997, "Topps Chrome", "Base", "Base", "PSA 10", 2800, 87));
    cards2.push(createCard(1997, "Topps Chrome", "Base", "Refractor", "PSA 10", 6800, 91));
    cards2.push(createCard(1997, "Topps Finest", "Base", "Base", "PSA 10", 1200, 84));
    cards2.push(createCard(2003, "Topps Chrome", "Base", "Base", "PSA 10", 480, 78));
  } else if (playerName === "Dirk Nowitzki") {
    cards2.push(createCard(1998, "Topps Chrome", "Base", "Base", "PSA 10", 1800, 85));
    cards2.push(createCard(1998, "Topps Chrome", "Base", "BCCG 10", "BGS 10", 4200, 89));
    cards2.push(createCard(1998, "Topps Finest", "Base", "Base", "PSA 10", 680, 81));
    cards2.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 380, 75));
  } else if (playerName === "James Harden") {
    cards2.push(createCard(2009, "Topps Chrome", "Base", "Base", "BGS 9", 680, 79));
    cards2.push(createCard(2009, "Topps Chrome", "Base", "Refractor", "BGS 9.5", 1800, 85));
    cards2.push(createCard(2009, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200, 82));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 70));
  } else if (playerName === "Kyrie Irving") {
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 9", 480, 78));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800, 85));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 10", 980, 82));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 220, 68));
  } else if (playerName === "Russell Westbrook") {
    cards2.push(createCard(2008, "Topps Chrome", "Base", "Base", "PSA 9", 380, 76));
    cards2.push(createCard(2008, "Topps Chrome", "Base", "Refractor", "PSA 10", 1200, 83));
    cards2.push(createCard(2008, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 79));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
  } else if (playerName === "Kawhi Leonard") {
    cards2.push(createCard(2011, "SP Authentic", "Rookie Auto", "Base", "PSA 10", 1800, 84));
    cards2.push(createCard(2014, "Panini Prizm", "Base", "Blue Prizm", "PSA 10", 2800, 87));
    cards2.push(createCard(2011, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 980, 81));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280, 70));
  } else if (playerName === "Draymond Green") {
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 10", 480, 77));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200, 82));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
  } else if (playerName === "Karl-Anthony Towns") {
    cards2.push(createCard(2015, "Panini Prizm Emergent", "Rookie", "Base", "Raw", 280, 72));
    cards2.push(createCard(2015, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 78));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180, 65));
  } else if (playerName === "Tom Brady") {
    cards2.push(createCard(2e3, "Bowman Chrome", "Base", "Base", "PSA 10", 28e3, 95));
    cards2.push(createCard(2e3, "Bowman Chrome", "Base", "Refractor", "PSA 10", 68e3, 98));
    cards2.push(createCard(2e3, "Topps Chrome", "Base", "Base", "PSA 10", 18e3, 93));
    cards2.push(createCard(2005, "Topps Chrome", "Base", "Refractor", "PSA 10", 2800, 85));
  } else if (playerName === "Aaron Rodgers") {
    cards2.push(createCard(2005, "Topps Chrome", "Base", "Base", "PSA 9", 1800, 84));
    cards2.push(createCard(2005, "Topps Chrome", "Base", "Refractor Auto", "PSA 10", 8500, 91));
    cards2.push(createCard(2005, "Topps Chrome", "Base", "Base", "PSA 10", 4200, 88));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 480, 76));
  } else if (playerName === "Peyton Manning") {
    cards2.push(createCard(1998, "Topps Chrome", "Base", "Base", "PSA 10", 3800, 87));
    cards2.push(createCard(1998, "Topps Chrome", "Base", "Refractor", "BGS 9", 8500, 91));
    cards2.push(createCard(1998, "Topps Finest", "Base", "Base", "PSA 10", 1200, 83));
  } else if (playerName === "Jerry Rice") {
    cards2.push(createCard(1986, "Topps", "Base", "Base", "PSA 10", 4800, 89));
    cards2.push(createCard(1986, "Topps", "Base", "Base", "PSA 9", 1200, 82));
    cards2.push(createCard(1990, "Topps", "Base", "Base", "PSA 10", 680, 78));
  } else if (playerName === "Joe Burrow") {
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 480, 77));
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Red/Yellow", "PSA 10", 2800, 86));
    cards2.push(createCard(2020, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 6800, 90));
    cards2.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680, 79));
  } else if (playerName === "Ken Griffey Jr.") {
    cards2.push(createCard(1989, "Topps", "Base", "Base", "PSA 10", 2800, 86));
    cards2.push(createCard(1989, "Topps", "Traded", "Base", "PSA 10", 4800, 89));
    cards2.push(createCard(1990, "Topps", "Base", "Base", "PSA 10", 680, 79));
    cards2.push(createCard(1989, "Bowman", "Base", "Base", "PSA 10", 1200, 83));
  } else if (playerName === "Derek Jeter") {
    cards2.push(createCard(1993, "Bowman", "Base", "Base", "PSA 10", 3800, 87));
    cards2.push(createCard(1993, "Bowman", "Base", "Base", "PSA 9", 1200, 81));
    cards2.push(createCard(1993, "Topps", "Base", "Base", "PSA 10", 1800, 84));
    cards2.push(createCard(1994, "Topps", "Base", "Base", "PSA 10", 680, 78));
  } else if (playerName === "Barry Bonds") {
    cards2.push(createCard(1987, "Topps", "Base", "Base", "PSA 10", 1800, 84));
    cards2.push(createCard(1987, "Topps", "Base", "Base", "PSA 9", 480, 77));
    cards2.push(createCard(1990, "Topps", "Base", "Base", "PSA 10", 380, 74));
  } else if (playerName === "Bryce Harper") {
    cards2.push(createCard(2011, "Bowman Chrome", "Prospect", "Base", "PSA 10", 1800, 84));
    cards2.push(createCard(2011, "Bowman Chrome", "Prospect", "Refractor Auto", "PSA 10", 4800, 89));
    cards2.push(createCard(2012, "Topps Chrome", "Base", "Refractor", "PSA 10", 680, 79));
  } else if (playerName === "Lionel Messi") {
    cards2.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 550, 75));
    cards2.push(createCard(2004, "Panini Megacracks", "Base", "Base", "PSA 9", 2800, 81));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 420, 72));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Black Gold", "PSA 10", 8800, 91));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Mojo Prizm", "PSA 10", 4200, 87));
  } else if (playerName === "Cristiano Ronaldo") {
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 680, 79));
    cards2.push(createCard(2018, "Panini Prizm World Cup", "Scorers Club", "Silver Prizm", "PSA 10", 2800, 86));
    cards2.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 480, 75));
    cards2.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 380, 72));
  } else if (playerName === "Connor McDavid") {
    cards2.push(createCard(2015, "Upper Deck", "Young Guns", "Base", "PSA 10", 3800, 89));
    cards2.push(createCard(2015, "Upper Deck", "Young Guns", "Base", "PSA 9", 1200, 82));
    cards2.push(createCard(2016, "Upper Deck", "Young Guns", "Base", "PSA 10", 2200, 86));
    cards2.push(createCard(2020, "Upper Deck", "Base", "Base", "PSA 10", 480, 75));
    cards2.push(createCard(2015, "Upper Deck", "Young Guns Jumbo", "Base", "BGS 9.5", 8500, 92));
  } else if (playerName === "Sidney Crosby") {
    cards2.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 10", 12e3, 94));
    cards2.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 9", 3800, 87));
    cards2.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "BGS 9.5", 8500, 92));
    cards2.push(createCard(2010, "Upper Deck", "Base", "Base", "PSA 10", 680, 79));
  } else if (playerName === "Alexander Ovechkin") {
    cards2.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 10", 8500, 92));
    cards2.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 9", 2800, 85));
    cards2.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "BGS 9.5", 5800, 90));
    cards2.push(createCard(2010, "Upper Deck", "Base", "Base", "PSA 10", 480, 76));
  } else if (playerName === "Ronaldinho") {
    cards2.push(createCard(2004, "Panini", "Mega Cracks", "Base", "PSA 9", 1800, 84));
    cards2.push(createCard(2006, "Panini", "World Cup", "Base", "PSA 10", 2800, 87));
    cards2.push(createCard(2004, "Topps", "Match Attax", "Base", "PSA 10", 980, 81));
  } else if (playerName === "Zinedine Zidane") {
    cards2.push(createCard(2006, "Panini", "World Cup", "Base", "PSA 10", 3800, 88));
    cards2.push(createCard(2002, "Panini", "World Cup", "Base", "PSA 9", 1800, 84));
    cards2.push(createCard(1998, "Panini", "World Cup", "Base", "PSA 10", 4800, 90));
  } else if (playerName === "Thierry Henry") {
    cards2.push(createCard(2006, "Panini", "World Cup", "Base", "PSA 10", 2800, 86));
    cards2.push(createCard(2003, "Topps", "Premier League", "Base", "PSA 10", 1200, 82));
    cards2.push(createCard(1998, "Panini", "World Cup", "Base", "PSA 9", 980, 80));
  } else if (playerName === "Lamine Yamal") {
    cards2.push(createCard(2024, "Panini Select FIFA", "Base", "Silver Prizm Patch", "Raw", 4800, 91));
    cards2.push(createCard(2024, "Topps Now", "Champions League", "Base", "Raw", 1200, 84));
    cards2.push(createCard(2024, "Panini Select La Liga", "Base", "Gold Prizm", "PSA 10", 8500, 93));
    cards2.push(createCard(2024, "Topps", "Base", "Base", "PSA 10", 680, 79));
  } else if (playerName === "Florian Wirtz") {
    cards2.push(createCard(2023, "Topps Chrome UEFA", "Base", "Base", "PSA 10", 1200, 82));
    cards2.push(createCard(2022, "Topps Chrome UEFA", "Base", "Refractor", "PSA 10", 2800, 87));
    cards2.push(createCard(2022, "Topps Chrome", "Base", "Pink Shimmer", "PSA 10", 980, 81));
    cards2.push(createCard(2024, "Topps Chrome Bundesliga", "Base", "Base", "PSA 10", 680, 78));
  } else if (playerName === "Klay Thompson") {
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 4800, 90));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 9", 1200, 85));
    cards2.push(createCard(2012, "Panini Prizm", "Base", "Base", "Raw", 280, 78));
    cards2.push(createCard(2012, "National Treasures", "Rookie Patch Auto", "RPA /25", "BGS 9.5", 18e3, 95));
    cards2.push(createCard(2023, "Panini Prizm", "Base", "White Ice /35", "PSA 9", 380, 82));
    cards2.push(createCard(2023, "National Treasures", "Clutch Factor Signatures", "RLC-PRIME /10", "Raw", 2800, 88));
    cards2.push(createCard(2024, "Topps Chrome", "Base", "Green Refractor /99", "Raw", 45, 72));
    cards2.push(createCard(2024, "Panini Select", "Concourse", "White Prizm", "Raw", 28, 68));
    cards2.push(createCard(2020, "Donruss Optic", "Base", "Holo", "PSA 10", 180, 80));
    cards2.push(createCard(2021, "Donruss Optic", "Base", "Holo", "Raw", 35, 74));
  } else if (playerName === "Michael Jordan") {
    cards2.push(createCard(1986, "Fleer", "Base", "Base", "PSA 10", 48e4, 99));
    cards2.push(createCard(1986, "Fleer", "Base", "Base", "PSA 9", 52e3, 95));
    cards2.push(createCard(1986, "Fleer", "Base", "Base", "BGS 9.5", 18e4, 97));
    cards2.push(createCard(1997, "Topps Chrome", "Base", "Refractor", "PSA 10", 8500, 91));
    cards2.push(createCard(1986, "Fleer", "Sticker", "Base", "PSA 10", 28e3, 93));
  } else if (playerName === "Magic Johnson") {
    cards2.push(createCard(1980, "Topps", "Base", "Base", "PSA 10", 28e3, 93));
    cards2.push(createCard(1980, "Topps", "Base", "Base", "PSA 9", 8500, 88));
    cards2.push(createCard(1980, "Topps", "Base", "Base", "BGS 9", 4800, 85));
    cards2.push(createCard(1986, "Fleer", "Base", "Base", "PSA 10", 12e3, 91));
  } else if (playerName === "Larry Bird") {
    cards2.push(createCard(1980, "Topps", "Base", "Base", "PSA 10", 28e3, 93));
    cards2.push(createCard(1980, "Topps", "Base", "Base", "PSA 9", 8500, 88));
    cards2.push(createCard(1986, "Fleer", "Base", "Base", "PSA 10", 12e3, 91));
    cards2.push(createCard(1986, "Fleer", "Base", "Base", "PSA 9", 3800, 85));
  } else if (playerName === "Wayne Gretzky") {
    cards2.push(createCard(1979, "O-Pee-Chee", "Base", "Base", "PSA 10", 36e5, 99));
    cards2.push(createCard(1979, "O-Pee-Chee", "Base", "Base", "PSA 9", 38e4, 96));
    cards2.push(createCard(1979, "O-Pee-Chee", "Base", "Base", "PSA 8", 85e3, 92));
    cards2.push(createCard(1985, "O-Pee-Chee", "Base", "Base", "PSA 10", 28e3, 89));
  } else if (playerName === "Babe Ruth") {
    cards2.push(createCard(1933, "Goudey", "Base", "Base", "PSA 9", 48e4, 97));
    cards2.push(createCard(1933, "Goudey", "Base", "Base", "PSA 8", 12e4, 93));
    cards2.push(createCard(1934, "Goudey", "Base", "Base", "PSA 9", 28e4, 95));
  } else if (playerName === "Wilt Chamberlain") {
    cards2.push(createCard(1961, "Fleer", "Base", "Base", "PSA 10", 18e4, 96));
    cards2.push(createCard(1961, "Fleer", "Base", "Base", "PSA 9", 48e3, 92));
    cards2.push(createCard(1969, "Topps", "Base", "Base", "PSA 10", 28e3, 89));
  } else {
    const randScore = 60 + Math.random() * 30;
    cards2.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 100 + Math.random() * 400, randScore));
    cards2.push(createCard(2021, "Panini Select", "Premier", "Silver", "Raw", 40 + Math.random() * 100, randScore - 5));
  }
  return cards2;
}
async function seedDatabase() {
  let playersSeeded = 0;
  let cardsSeeded = 0;
  for (const playerData of SEED_PLAYERS) {
    const existing = await getPlayerByExternalId(playerData.externalId);
    if (existing) continue;
    await upsertPlayer({
      externalId: playerData.externalId,
      name: playerData.name,
      sport: playerData.sport,
      team: playerData.team,
      position: playerData.position,
      performanceScore: playerData.performanceScore,
      recentStats: {
        pts: 20 + Math.random() * 15,
        reb: 5 + Math.random() * 8,
        ast: 4 + Math.random() * 8,
        stl: 0.5 + Math.random() * 2,
        blk: 0.3 + Math.random() * 2,
        gamesPlayed: 10
      },
      lastStatsUpdate: /* @__PURE__ */ new Date()
    });
    playersSeeded++;
    const player = await getPlayerByExternalId(playerData.externalId);
    if (!player) continue;
    const cardDataList = generateCardData(player.id, playerData.name, playerData.sport, playerData.performanceScore);
    for (const cardData of cardDataList) {
      const cardId = await upsertCard({
        playerId: player.id,
        playerName: playerData.name,
        sport: playerData.sport,
        year: cardData.year,
        brand: cardData.brand,
        set: cardData.set,
        parallel: cardData.parallel,
        grade: cardData.grade,
        currentPrice: cardData.currentPrice,
        avgPrice30d: cardData.avgPrice30d,
        priceChange7d: cardData.priceChange7d,
        dealScore: cardData.dealScore,
        isDealOpportunity: cardData.isDealOpportunity,
        marketSentiment: cardData.marketSentiment,
        lastPriceUpdate: /* @__PURE__ */ new Date()
      });
      if (cardId > 0) {
        for (const ph of cardData.priceHistory) {
          await insertPriceHistory({
            cardId,
            price: ph.price,
            source: ph.source,
            saleDate: ph.date
          });
        }
        cardsSeeded++;
      }
    }
  }
  return { playersSeeded, cardsSeeded };
}
var BALLDONTLIE_BASE, BALLDONTLIE_KEY, bdlClient, SEED_PLAYERS;
var init_sportsDataService = __esm({
  "server/sportsDataService.ts"() {
    "use strict";
    init_db();
    BALLDONTLIE_BASE = "https://api.balldontlie.io/v1";
    BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
    bdlClient = axios.create({
      baseURL: BALLDONTLIE_BASE,
      headers: BALLDONTLIE_KEY ? { Authorization: BALLDONTLIE_KEY } : {},
      timeout: 1e4
    });
    SEED_PLAYERS = [
      // NBA
      { externalId: "nba-1", name: "LeBron James", sport: "NBA", team: "Los Angeles Lakers", position: "SF", performanceScore: 88 },
      { externalId: "nba-2", name: "Stephen Curry", sport: "NBA", team: "Golden State Warriors", position: "PG", performanceScore: 91 },
      { externalId: "nba-3", name: "Kevin Durant", sport: "NBA", team: "Phoenix Suns", position: "SF", performanceScore: 87 },
      { externalId: "nba-4", name: "Giannis Antetokounmpo", sport: "NBA", team: "Milwaukee Bucks", position: "PF", performanceScore: 93 },
      { externalId: "nba-5", name: "Luka Doncic", sport: "NBA", team: "Dallas Mavericks", position: "PG", performanceScore: 95 },
      { externalId: "nba-6", name: "Nikola Jokic", sport: "NBA", team: "Denver Nuggets", position: "C", performanceScore: 96 },
      { externalId: "nba-7", name: "Joel Embiid", sport: "NBA", team: "Philadelphia 76ers", position: "C", performanceScore: 82 },
      { externalId: "nba-8", name: "Jayson Tatum", sport: "NBA", team: "Boston Celtics", position: "SF", performanceScore: 89 },
      { externalId: "nba-9", name: "Damian Lillard", sport: "NBA", team: "Milwaukee Bucks", position: "PG", performanceScore: 84 },
      { externalId: "nba-10", name: "Anthony Davis", sport: "NBA", team: "Los Angeles Lakers", position: "PF", performanceScore: 85 },
      { externalId: "nba-11", name: "Victor Wembanyama", sport: "NBA", team: "San Antonio Spurs", position: "C", performanceScore: 90 },
      { externalId: "nba-12", name: "Tyrese Haliburton", sport: "NBA", team: "Indiana Pacers", position: "PG", performanceScore: 83 },
      // NFL
      { externalId: "nfl-1", name: "Patrick Mahomes", sport: "NFL", team: "Kansas City Chiefs", position: "QB", performanceScore: 94 },
      { externalId: "nfl-2", name: "Josh Allen", sport: "NFL", team: "Buffalo Bills", position: "QB", performanceScore: 92 },
      { externalId: "nfl-3", name: "Justin Jefferson", sport: "NFL", team: "Minnesota Vikings", position: "WR", performanceScore: 91 },
      { externalId: "nfl-4", name: "Travis Kelce", sport: "NFL", team: "Kansas City Chiefs", position: "TE", performanceScore: 86 },
      // MLB
      { externalId: "mlb-1", name: "Shohei Ohtani", sport: "MLB", team: "Los Angeles Dodgers", position: "DH/SP", performanceScore: 98 },
      { externalId: "mlb-2", name: "Mike Trout", sport: "MLB", team: "Los Angeles Angels", position: "CF", performanceScore: 80 },
      { externalId: "mlb-3", name: "Ronald Acuna Jr.", sport: "MLB", team: "Atlanta Braves", position: "RF", performanceScore: 88 },
      // EPL
      { externalId: "epl-1", name: "Erling Haaland", sport: "EPL", team: "Manchester City", position: "ST", performanceScore: 95 },
      { externalId: "epl-2", name: "Mohamed Salah", sport: "EPL", team: "Liverpool", position: "RW", performanceScore: 89 },
      { externalId: "epl-3", name: "Bukayo Saka", sport: "EPL", team: "Arsenal", position: "RW", performanceScore: 87 },
      // NBA 新生代
      { externalId: "nba-13", name: "Ja Morant", sport: "NBA", team: "Memphis Grizzlies", position: "PG", performanceScore: 88 },
      { externalId: "nba-14", name: "Zion Williamson", sport: "NBA", team: "New Orleans Pelicans", position: "PF", performanceScore: 87 },
      { externalId: "nba-15", name: "Trae Young", sport: "NBA", team: "Atlanta Hawks", position: "PG", performanceScore: 86 },
      { externalId: "nba-16", name: "Devin Booker", sport: "NBA", team: "Phoenix Suns", position: "SG", performanceScore: 89 },
      { externalId: "nba-17", name: "Shai Gilgeous-Alexander", sport: "NBA", team: "Oklahoma City Thunder", position: "SG", performanceScore: 93 },
      { externalId: "nba-18", name: "Anthony Edwards", sport: "NBA", team: "Minnesota Timberwolves", position: "SG", performanceScore: 91 },
      { externalId: "nba-19", name: "Cade Cunningham", sport: "NBA", team: "Detroit Pistons", position: "PG", performanceScore: 82 },
      { externalId: "nba-20", name: "Evan Mobley", sport: "NBA", team: "Cleveland Cavaliers", position: "C", performanceScore: 84 },
      { externalId: "nba-21", name: "Paolo Banchero", sport: "NBA", team: "Orlando Magic", position: "PF", performanceScore: 83 },
      // NFL 新生代
      { externalId: "nfl-5", name: "Lamar Jackson", sport: "NFL", team: "Baltimore Ravens", position: "QB", performanceScore: 93 },
      { externalId: "nfl-6", name: "Justin Herbert", sport: "NFL", team: "Los Angeles Chargers", position: "QB", performanceScore: 88 },
      { externalId: "nfl-7", name: "Kyler Murray", sport: "NFL", team: "Arizona Cardinals", position: "QB", performanceScore: 84 },
      // MLB 新生代
      { externalId: "mlb-4", name: "Fernando Tatis Jr.", sport: "MLB", team: "San Diego Padres", position: "SS", performanceScore: 87 },
      { externalId: "mlb-5", name: "Juan Soto", sport: "MLB", team: "New York Yankees", position: "LF", performanceScore: 90 },
      { externalId: "mlb-6", name: "Julio Rodriguez", sport: "MLB", team: "Seattle Mariners", position: "CF", performanceScore: 85 },
      // Soccer 新生代
      { externalId: "soccer-1", name: "Jude Bellingham", sport: "EPL", team: "Real Madrid", position: "CM", performanceScore: 92 },
      { externalId: "soccer-2", name: "Pedri", sport: "EPL", team: "FC Barcelona", position: "CM", performanceScore: 88 },
      { externalId: "soccer-3", name: "Neymar Jr.", sport: "EPL", team: "Al-Hilal", position: "LW", performanceScore: 82 },
      // NBA 传奇
      { externalId: "nba-legend-1", name: "Kobe Bryant", sport: "NBA", team: "Los Angeles Lakers", position: "SG", performanceScore: 97 },
      { externalId: "nba-legend-2", name: "Shaquille O'Neal", sport: "NBA", team: "Los Angeles Lakers", position: "C", performanceScore: 95 },
      { externalId: "nba-legend-3", name: "Dwyane Wade", sport: "NBA", team: "Miami Heat", position: "SG", performanceScore: 93 },
      { externalId: "nba-legend-4", name: "Tim Duncan", sport: "NBA", team: "San Antonio Spurs", position: "PF", performanceScore: 96 },
      { externalId: "nba-legend-5", name: "Dirk Nowitzki", sport: "NBA", team: "Dallas Mavericks", position: "PF", performanceScore: 94 },
      { externalId: "nba-legend-6", name: "James Harden", sport: "NBA", team: "Los Angeles Clippers", position: "SG", performanceScore: 87 },
      { externalId: "nba-legend-7", name: "Kyrie Irving", sport: "NBA", team: "Dallas Mavericks", position: "PG", performanceScore: 86 },
      { externalId: "nba-legend-8", name: "Russell Westbrook", sport: "NBA", team: "Denver Nuggets", position: "PG", performanceScore: 84 },
      { externalId: "nba-legend-9", name: "Kawhi Leonard", sport: "NBA", team: "Los Angeles Clippers", position: "SF", performanceScore: 88 },
      { externalId: "nba-legend-klay", name: "Klay Thompson", sport: "NBA", team: "Dallas Mavericks", position: "SG", performanceScore: 87 },
      { externalId: "nba-legend-10", name: "Draymond Green", sport: "NBA", team: "Golden State Warriors", position: "PF", performanceScore: 80 },
      { externalId: "nba-legend-11", name: "Karl-Anthony Towns", sport: "NBA", team: "New York Knicks", position: "C", performanceScore: 83 },
      // NFL 传奇
      { externalId: "nfl-legend-1", name: "Tom Brady", sport: "NFL", team: "New England Patriots", position: "QB", performanceScore: 99 },
      { externalId: "nfl-legend-2", name: "Aaron Rodgers", sport: "NFL", team: "New York Jets", position: "QB", performanceScore: 92 },
      { externalId: "nfl-legend-3", name: "Peyton Manning", sport: "NFL", team: "Indianapolis Colts", position: "QB", performanceScore: 96 },
      { externalId: "nfl-legend-4", name: "Jerry Rice", sport: "NFL", team: "San Francisco 49ers", position: "WR", performanceScore: 99 },
      { externalId: "nfl-legend-5", name: "Joe Burrow", sport: "NFL", team: "Cincinnati Bengals", position: "QB", performanceScore: 89 },
      // MLB 传奇
      { externalId: "mlb-legend-1", name: "Ken Griffey Jr.", sport: "MLB", team: "Seattle Mariners", position: "CF", performanceScore: 97 },
      { externalId: "mlb-legend-2", name: "Derek Jeter", sport: "MLB", team: "New York Yankees", position: "SS", performanceScore: 95 },
      { externalId: "mlb-legend-3", name: "Barry Bonds", sport: "MLB", team: "San Francisco Giants", position: "LF", performanceScore: 94 },
      { externalId: "mlb-legend-4", name: "Bryce Harper", sport: "MLB", team: "Philadelphia Phillies", position: "RF", performanceScore: 88 },
      // Soccer 传奇
      { externalId: "soccer-legend-1", name: "Lionel Messi", sport: "EPL", team: "Inter Miami CF", position: "RW", performanceScore: 98 },
      { externalId: "soccer-legend-2", name: "Cristiano Ronaldo", sport: "EPL", team: "Al-Nassr", position: "ST", performanceScore: 97 },
      // NHL
      { externalId: "nhl-1", name: "Connor McDavid", sport: "NHL", team: "Edmonton Oilers", position: "C", performanceScore: 98 },
      { externalId: "nhl-2", name: "Sidney Crosby", sport: "NHL", team: "Pittsburgh Penguins", position: "C", performanceScore: 96 },
      { externalId: "nhl-3", name: "Alexander Ovechkin", sport: "NHL", team: "Washington Capitals", position: "LW", performanceScore: 95 },
      // Soccer 传奇
      { externalId: "soccer-legend-3", name: "Ronaldinho", sport: "EPL", team: "FC Barcelona", position: "CAM", performanceScore: 96 },
      { externalId: "soccer-legend-4", name: "Zinedine Zidane", sport: "EPL", team: "Real Madrid", position: "CM", performanceScore: 97 },
      { externalId: "soccer-legend-5", name: "Thierry Henry", sport: "EPL", team: "Arsenal", position: "ST", performanceScore: 95 },
      // Soccer 新生代
      { externalId: "soccer-new-1", name: "Lamine Yamal", sport: "EPL", team: "FC Barcelona", position: "RW", performanceScore: 94 },
      { externalId: "soccer-new-2", name: "Florian Wirtz", sport: "EPL", team: "Bayer Leverkusen", position: "CAM", performanceScore: 91 },
      // NBA 传奇
      { externalId: "nba-goat-1", name: "Michael Jordan", sport: "NBA", team: "Chicago Bulls", position: "SG", performanceScore: 100 },
      { externalId: "nba-goat-2", name: "Magic Johnson", sport: "NBA", team: "Los Angeles Lakers", position: "PG", performanceScore: 97 },
      { externalId: "nba-goat-3", name: "Larry Bird", sport: "NBA", team: "Boston Celtics", position: "SF", performanceScore: 96 },
      // 历史传奇
      { externalId: "legend-1", name: "Wayne Gretzky", sport: "NHL", team: "Edmonton Oilers", position: "C", performanceScore: 100 },
      { externalId: "legend-2", name: "Babe Ruth", sport: "MLB", team: "New York Yankees", position: "RF", performanceScore: 100 },
      { externalId: "legend-3", name: "Wilt Chamberlain", sport: "NBA", team: "Philadelphia 76ers", position: "C", performanceScore: 98 }
    ];
  }
});

// server/mockDb.ts
var mockDb_exports = {};
__export(mockDb_exports, {
  MOCK_CARDS: () => MOCK_CARDS,
  MOCK_NOTIFICATIONS: () => MOCK_NOTIFICATIONS,
  MOCK_PLAYERS: () => MOCK_PLAYERS,
  MOCK_PORTFOLIO_POSITIONS: () => MOCK_PORTFOLIO_POSITIONS,
  MOCK_PRICE_HISTORY: () => MOCK_PRICE_HISTORY,
  MOCK_REPORTS: () => MOCK_REPORTS,
  MOCK_TREND_SNAPSHOTS: () => MOCK_TREND_SNAPSHOTS,
  MOCK_WATCHLIST: () => MOCK_WATCHLIST
});
function getCardImage(playerName, year, brand) {
  const exactKey = `${playerName}|${year}|${brand}`;
  if (CARD_IMAGES[exactKey]) return CARD_IMAGES[exactKey];
  const yearPrefix = `${playerName}|${year}|`;
  const yearMatch = Object.keys(CARD_IMAGES).find((k) => k.startsWith(yearPrefix));
  if (yearMatch) return CARD_IMAGES[yearMatch];
  const playerPrefix = `${playerName}|`;
  const playerMatch = Object.keys(CARD_IMAGES).find((k) => k.startsWith(playerPrefix));
  if (playerMatch) return CARD_IMAGES[playerMatch];
  return PLAYER_IMAGES[playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=EEF4FF&color=1D6FEB&size=400&bold=true`;
}
var PLAYER_IMAGES, CARD_IMAGES, MOCK_PLAYERS, MOCK_CARDS, MOCK_PRICE_HISTORY, MOCK_PORTFOLIO_POSITIONS, MOCK_WATCHLIST, MOCK_NOTIFICATIONS, MOCK_REPORTS, MOCK_TREND_SNAPSHOTS, cardIdCounter, phIdCounter;
var init_mockDb = __esm({
  "server/mockDb.ts"() {
    "use strict";
    init_sportsDataService();
    PLAYER_IMAGES = {
      // ── NBA (local static images from /players/) ─────────────────────────────
      "LeBron James": "/players/lebron_james.png",
      "Stephen Curry": "/players/stephen_curry.png",
      "Kevin Durant": "/players/kevin_durant.png",
      "Giannis Antetokounmpo": "/players/giannis.png",
      "Luka Doncic": "/players/luka_doncic.png",
      "Nikola Jokic": "/players/nikola_jokic.png",
      "Joel Embiid": "/players/joel_embiid.png",
      "Jayson Tatum": "/players/jayson_tatum.png",
      "Damian Lillard": "/players/damian_lillard.png",
      "Anthony Davis": "/players/anthony_davis.png",
      "Victor Wembanyama": "/players/victor_wembanyama.png",
      "Tyrese Haliburton": "/players/tyrese_haliburton.png",
      // ── NFL (local static images) ─────────────────────────────────────────────
      "Patrick Mahomes": "/players/patrick_mahomes.png",
      "Josh Allen": "/players/josh_allen.png",
      "Justin Jefferson": "/players/justin_jefferson.png",
      "Travis Kelce": "/players/travis_kelce.png",
      // ── MLB (local static images) ─────────────────────────────────────────────
      "Shohei Ohtani": "/players/shohei_ohtani.png",
      "Mike Trout": "/players/mike_trout.png",
      "Ronald Acuna Jr.": "/players/ronald_acuna.png",
      // ── EPL / Soccer (local static images) ───────────────────────────────────
      "Erling Haaland": "/players/erling_haaland.png",
      "Mohamed Salah": "/players/mohamed_salah.png",
      "Bukayo Saka": "/players/bukayo_saka.png",
      "Lionel Messi": "/players/lionel_messi.png",
      "Kylian Mbappe": "/players/kylian_mbappe.png",
      "Vinicius Junior": "/players/vinicius_junior.png",
      // ── NBA 新生代 ────────────────────────────────────────────────────────────
      "Ja Morant": "/players/ja_morant.png",
      "Zion Williamson": "/players/zion_williamson.png",
      "Trae Young": "/players/trae_young.png",
      "Devin Booker": "/players/devin_booker.png",
      "Shai Gilgeous-Alexander": "/players/shai_gilgeous_alexander.png",
      "Anthony Edwards": "/players/anthony_edwards.png",
      "Cade Cunningham": "/players/cade_cunningham.png",
      "Evan Mobley": "/players/evan_mobley.png",
      "Paolo Banchero": "/players/paolo_banchero.png",
      // ── NFL 新生代 ────────────────────────────────────────────────────────────
      "Lamar Jackson": "/players/lamar_jackson.png",
      "Justin Herbert": "/players/justin_herbert.png",
      "Kyler Murray": "/players/kyler_murray.png",
      // ── MLB 新生代 ────────────────────────────────────────────────────────────
      "Fernando Tatis Jr.": "/players/fernando_tatis_jr.png",
      "Juan Soto": "/players/juan_soto.png",
      "Julio Rodriguez": "/players/julio_rodriguez.png",
      // ── Soccer 新生代 ─────────────────────────────────────────────────────────
      "Jude Bellingham": "/players/jude_bellingham.png",
      "Pedri": "/players/pedri.png",
      "Neymar Jr.": "/players/neymar_jr.png",
      // NBA 传奇
      "Kobe Bryant": "/players/kobe_bryant.png",
      "Shaquille O'Neal": "/players/shaquille_oneal.png",
      "Dwyane Wade": "/players/dwyane_wade.png",
      "Tim Duncan": "/players/tim_duncan.png",
      "Dirk Nowitzki": "/players/dirk_nowitzki.png",
      "James Harden": "/players/james_harden.png",
      "Kyrie Irving": "/players/kyrie_irving.png",
      "Russell Westbrook": "/players/russell_westbrook.png",
      "Kawhi Leonard": "/players/kawhi_leonard.png",
      "Klay Thompson": "/players/klay_thompson.png",
      "Draymond Green": "/players/draymond_green.png",
      "Karl-Anthony Towns": "/players/karl_anthony_towns.png",
      // NFL 传奇
      "Tom Brady": "/players/tom_brady.png",
      "Aaron Rodgers": "/players/aaron_rodgers.png",
      "Peyton Manning": "/players/peyton_manning.png",
      "Jerry Rice": "/players/jerry_rice.png",
      "Joe Burrow": "/players/joe_burrow.png",
      // MLB 传奇
      "Ken Griffey Jr.": "/players/ken_griffey_jr.png",
      "Derek Jeter": "/players/derek_jeter.png",
      "Barry Bonds": "/players/barry_bonds.png",
      "Bryce Harper": "/players/bryce_harper.png",
      // Soccer 传奇
      "Lionel Messi": "/players/lionel_messi.png",
      "Cristiano Ronaldo": "/players/cristiano_ronaldo.png",
      // NHL
      "Connor McDavid": "/players/connor_mcdavid.png",
      "Sidney Crosby": "/players/sidney_crosby.png",
      "Alexander Ovechkin": "/players/alexander_ovechkin.png",
      // Soccer 传奇
      "Ronaldinho": "/players/ronaldinho.png",
      "Zinedine Zidane": "/players/zinedine_zidane.png",
      "Thierry Henry": "/players/thierry_henry.png",
      // Soccer 新生代
      "Lamine Yamal": "/players/lamine_yamal.png",
      "Florian Wirtz": "/players/florian_wirtz.png",
      // NBA 传奇
      "Michael Jordan": "/players/michael_jordan.png",
      "Magic Johnson": "/players/magic_johnson.png",
      "Larry Bird": "/players/larry_bird.png",
      // 历史传奇
      "Wayne Gretzky": "/players/wayne_gretzky.png",
      "Babe Ruth": "/players/babe_ruth.png",
      "Wilt Chamberlain": "/players/wilt_chamberlain.png"
    };
    CARD_IMAGES = {
      // ── LeBron James ─────────────────────────────────────────────────────────
      "LeBron James|2003|Topps Chrome": "/cards/lebron_2003_topps_chrome.jpg",
      "LeBron James|2003|Topps": "/cards/lebron_2003_topps_chrome.jpg",
      "LeBron James|2003|Upper Deck Exquisite": "/cards/lebron_2003_exquisite.jpg",
      "LeBron James|2020|Panini Prizm": "/cards/lebron_2003_topps_chrome_2.jpg",
      "LeBron James|2021|Panini Select": "/cards/lebron_2003_topps_chrome_2.jpg",
      // ── Stephen Curry ─────────────────────────────────────────────────────────
      "Stephen Curry|2009|Topps": "/cards/curry_2009_topps_chrome.jpg",
      "Stephen Curry|2009|Topps Chrome": "/cards/curry_2009_topps_chrome.jpg",
      "Stephen Curry|2009|Panini Studio": "/cards/curry_2009_topps_chrome.jpg",
      "Stephen Curry|2009|Bowman Chrome": "/cards/curry_2009_topps_chrome.jpg",
      "Stephen Curry|2020|Panini Prizm": "/cards/curry_2009_topps_chrome.jpg",
      // ── Kevin Durant ──────────────────────────────────────────────────────────
      "Kevin Durant|2007|Topps Chrome": "/cards/durant_2007_topps_chrome_psa10.jpg",
      "Kevin Durant|2007|Bowman Chrome": "/cards/durant_2007_topps_chrome.jpg",
      "Kevin Durant|2020|Panini Prizm": "/cards/durant_2007_topps_chrome.jpg",
      // ── Giannis Antetokounmpo ─────────────────────────────────────────────────
      "Giannis Antetokounmpo|2013|Panini Prizm": "/cards/giannis_2013_prizm_psa9.jpg",
      "Giannis Antetokounmpo|2020|Panini Prizm": "/cards/giannis_2013_prizm_red.jpg",
      "Giannis Antetokounmpo|2013|Panini Select": "/cards/giannis_2013_prizm.jpg",
      // ── Luka Doncic ───────────────────────────────────────────────────────────
      "Luka Doncic|2018|Panini Prizm": "/cards/doncic_2018_prizm_silver.jpg",
      "Luka Doncic|2018|Panini National Treasures": "/cards/doncic_2018_national_treasures.jpg",
      "Luka Doncic|2021|Panini Prizm": "/cards/doncic_2018_prizm_silver_2.jpg",
      "Luka Doncic|2018|Panini Select": "/cards/doncic_2018_prizm_silver_2.jpg",
      // ── Nikola Jokic ──────────────────────────────────────────────────────────
      "Nikola Jokic|2015|Panini Prizm": "/cards/jokic_2015_prizm_psa9.jpg",
      "Nikola Jokic|2020|Panini Prizm": "/cards/jokic_2015_prizm_amazon.jpg",
      "Nikola Jokic|2015|Panini Select": "/cards/jokic_2015_prizm_2.jpg",
      // ── Joel Embiid ───────────────────────────────────────────────────────────
      "Joel Embiid|2014|Panini Prizm": "/cards/embiid_2014_prizm_psa10.jpg",
      "Joel Embiid|2020|Panini Prizm": "/cards/embiid_2014_prizm.jpg",
      // ── Jayson Tatum ──────────────────────────────────────────────────────────
      "Jayson Tatum|2017|Panini Prizm": "/cards/tatum_2017_prizm_silver.jpg",
      "Jayson Tatum|2020|Panini Prizm": "/cards/tatum_2017_prizm_blue.jpg",
      "Jayson Tatum|2017|Panini Select": "/cards/tatum_2017_prizm_emergent.jpg",
      // ── Damian Lillard ────────────────────────────────────────────────────────
      "Damian Lillard|2012|Panini Prizm": "/cards/lillard_2012_prizm.jpg",
      "Damian Lillard|2020|Panini Prizm": "/cards/lillard_2012_prizm.jpg",
      // ── Anthony Davis ─────────────────────────────────────────────────────────
      "Anthony Davis|2012|Panini Prizm": "/cards/davis_2012_prizm_sgc10.jpg",
      "Anthony Davis|2020|Panini Prizm": "/cards/davis_2012_prizm.jpg",
      "Anthony Davis|2012|Panini Select": "/cards/davis_2012_prizm.jpg",
      // ── Victor Wembanyama ─────────────────────────────────────────────────────
      "Victor Wembanyama|2023|Panini Prizm": "/cards/wembanyama_2023_prizm.jpg",
      "Victor Wembanyama|2023|Panini National Treasures": "/cards/wembanyama_2023_national_treasures.jpg",
      "Victor Wembanyama|2024|Panini Prizm": "/cards/wembanyama_2023_prizm_2.jpg",
      "Victor Wembanyama|2023|Panini Select": "/cards/wembanyama_2023_nt_patch.jpg",
      "Victor Wembanyama|2023|Panini Mosaic": "/cards/wembanyama_2023_prizm_2.jpg",
      // ── Tyrese Haliburton ─────────────────────────────────────────────────────
      "Tyrese Haliburton|2020|Panini Prizm": "/cards/haliburton_2020_prizm.jpg",
      "Tyrese Haliburton|2021|Panini Prizm": "/cards/haliburton_2020_prizm_green.jpg",
      "Tyrese Haliburton|2020|Panini Select": "/cards/haliburton_2020_prizm_green.jpg",
      // ── Patrick Mahomes ───────────────────────────────────────────────────────
      "Patrick Mahomes|2017|Panini Prizm": "/cards/mahomes_2017_prizm.jpg",
      "Patrick Mahomes|2017|Panini National Treasures": "/cards/mahomes_2017_prizm.jpg",
      "Patrick Mahomes|2017|Panini Select": "/cards/mahomes_2017_prizm.jpg",
      "Patrick Mahomes|2020|Panini Prizm": "/cards/mahomes_2017_prizm.jpg",
      // ── Josh Allen ────────────────────────────────────────────────────────────
      "Josh Allen|2018|Panini Prizm": "/cards/allen_2018_prizm.jpg",
      "Josh Allen|2018|Panini National Treasures": "/cards/allen_2018_prizm.jpg",
      "Josh Allen|2020|Panini Prizm": "/cards/allen_2018_prizm.jpg",
      "Josh Allen|2018|Panini Select": "/cards/allen_2018_prizm.jpg",
      // ── Justin Jefferson ──────────────────────────────────────────────────────
      "Justin Jefferson|2020|Panini Prizm": "/cards/jefferson_2020_prizm.jpg",
      "Justin Jefferson|2021|Panini Prizm": "/cards/jefferson_2020_prizm.jpg",
      "Justin Jefferson|2020|Panini Select": "/cards/jefferson_2020_prizm.jpg",
      // ── Travis Kelce ──────────────────────────────────────────────────────────
      "Travis Kelce|2013|Panini Prizm": "/cards/kelce_2013_prizm.jpg",
      "Travis Kelce|2020|Panini Prizm": "/cards/kelce_2013_prizm_psa9.jpg",
      "Travis Kelce|2013|Panini Select": "/cards/kelce_2013_prizm_psa9.jpg",
      // ── Shohei Ohtani ─────────────────────────────────────────────────────────
      "Shohei Ohtani|2018|Bowman Chrome": "/cards/ohtani_2018_bowman_chrome.jpg",
      "Shohei Ohtani|2018|Topps Chrome Update": "/cards/ohtani_2018_bowman_chrome.jpg",
      "Shohei Ohtani|2018|Topps Chrome": "/cards/ohtani_2018_bowman_chrome.jpg",
      "Shohei Ohtani|2023|Topps Chrome": "/cards/ohtani_2018_bowman_chrome.jpg",
      // ── Mike Trout ────────────────────────────────────────────────────────────
      "Mike Trout|2011|Topps": "/cards/trout_2011_topps_update.jpg",
      "Mike Trout|2011|Topps Chrome": "/cards/trout_2011_topps_update.jpg",
      "Mike Trout|2011|Bowman Chrome": "/cards/trout_2011_topps_update.jpg",
      "Mike Trout|2020|Panini Prizm": "/cards/trout_2011_topps_update.jpg",
      // ── Ronald Acuna Jr. ──────────────────────────────────────────────────────
      "Ronald Acuna Jr.|2018|Topps Chrome": "/cards/acuna_2018_topps_chrome.jpg",
      "Ronald Acuna Jr.|2018|Topps Chrome Update": "/cards/acuna_2018_topps_chrome_auto.jpg",
      "Ronald Acuna Jr.|2020|Panini Prizm": "/cards/acuna_2018_topps_chrome.jpg",
      "Ronald Acuna Jr.|2018|Bowman Chrome": "/cards/acuna_2018_topps_chrome_auto.jpg",
      // ── Erling Haaland ────────────────────────────────────────────────────────
      "Erling Haaland|2021|Topps Chrome": "/cards/haaland_2021_topps_chrome.jpg",
      "Erling Haaland|2022|Panini Prizm Premier League": "/cards/haaland_2021_topps_chrome.jpg",
      "Erling Haaland|2023|Topps Chrome": "/cards/haaland_2021_topps_chrome.jpg",
      "Erling Haaland|2014|Panini Prizm World Cup": "/cards/haaland_2021_topps_chrome.jpg",
      // ── Mohamed Salah ─────────────────────────────────────────────────────────
      "Mohamed Salah|2018|Panini Prizm World Cup": "/cards/salah_2018_prizm_wc.jpg",
      "Mohamed Salah|2020|Panini Prizm Premier League": "/cards/salah_2018_prizm_wc.jpg",
      "Mohamed Salah|2022|Panini Prizm Premier League": "/cards/salah_2018_prizm_wc.jpg",
      "Mohamed Salah|2014|Panini Prizm World Cup": "/cards/salah_2018_prizm_wc.jpg",
      // ── Bukayo Saka ───────────────────────────────────────────────────────────
      "Bukayo Saka|2020|Topps Chrome": "/cards/saka_2020_topps_merlin.jpg",
      "Bukayo Saka|2022|Panini Prizm Premier League": "/cards/saka_2020_topps_merlin_2.jpg",
      "Bukayo Saka|2023|Topps Chrome": "/cards/saka_2020_topps_merlin.jpg",
      // ── Kylian Mbappe ─────────────────────────────────────────────────────────
      "Kylian Mbappe|2018|Panini Prizm World Cup": "/cards/mbappe_2018_prizm_wc.jpg",
      "Kylian Mbappe|2022|Panini Prizm World Cup": "/cards/mbappe_2018_prizm_wc_2.jpg",
      "Kylian Mbappe|2020|Panini Prizm Ligue 1": "/cards/mbappe_2018_prizm_wc_2.jpg",
      // ── Vinicius Junior ───────────────────────────────────────────────────────
      "Vinicius Junior|2018|Panini Donruss": "/cards/vinicius_2018_donruss.jpg",
      "Vinicius Junior|2018|Panini Donruss Optic": "/cards/vinicius_2018_donruss_optic.jpg",
      "Vinicius Junior|2022|Panini Prizm La Liga": "/cards/vinicius_2018_donruss.jpg",
      "Vinicius Junior|2018|Panini Prizm World Cup": "/cards/vinicius_2018_donruss_optic.jpg",
      // ── Ja Morant ─────────────────────────────────────────────────────────────
      "Ja Morant|2019|Panini Prizm": "/cards/morant_2019_prizm_psa10.jpg",
      "Ja Morant|2019|Panini National Treasures": "/cards/morant_2019_prizm_silver.jpg",
      "Ja Morant|2021|Panini Prizm": "/cards/morant_2019_prizm_psa10.jpg",
      "Ja Morant|2019|Panini Select": "/cards/morant_2019_prizm_silver.jpg",
      // ── Zion Williamson ───────────────────────────────────────────────────────
      "Zion Williamson|2019|Panini National Treasures": "/cards/zion_2019_nt_auto.jpg",
      "Zion Williamson|2019|Panini Prizm": "/cards/zion_2019_prizm.jpg",
      "Zion Williamson|2021|Panini Prizm": "/cards/zion_2019_prizm.jpg",
      "Zion Williamson|2019|Panini Select": "/cards/zion_2019_nt_auto.jpg",
      // ── Trae Young ────────────────────────────────────────────────────────────
      "Trae Young|2018|Panini Prizm": "/cards/trae_2018_prizm_psa10.jpg",
      "Trae Young|2018|Panini National Treasures": "/cards/trae_2018_prizm_silver.jpg",
      "Trae Young|2021|Panini Prizm": "/cards/trae_2018_prizm_psa10.jpg",
      "Trae Young|2018|Panini Select": "/cards/trae_2018_prizm_silver.jpg",
      // ── Devin Booker ──────────────────────────────────────────────────────────
      "Devin Booker|2015|Panini Prizm": "/cards/booker_2015_prizm.jpg",
      "Devin Booker|2015|Panini Prizm Emergent": "/cards/booker_2015_prizm_emergent.jpg",
      "Devin Booker|2020|Panini Prizm": "/cards/booker_2015_prizm.jpg",
      "Devin Booker|2015|Panini Select": "/cards/booker_2015_prizm_emergent.jpg",
      // ── Shai Gilgeous-Alexander ───────────────────────────────────────────────
      "Shai Gilgeous-Alexander|2018|Panini Prizm": "/cards/sga_2018_prizm.jpg",
      "Shai Gilgeous-Alexander|2018|Panini Donruss": "/cards/sga_2018_prizm_green.jpg",
      "Shai Gilgeous-Alexander|2021|Panini Prizm": "/cards/sga_2018_prizm.jpg",
      "Shai Gilgeous-Alexander|2018|Panini Select": "/cards/sga_2018_prizm_green.jpg",
      // ── Anthony Edwards ───────────────────────────────────────────────────────
      "Anthony Edwards|2020|Panini Prizm": "/cards/edwards_2020_prizm_psa9.jpg",
      "Anthony Edwards|2020|Panini National Treasures": "/cards/edwards_2020_nt_rpa.jpg",
      "Anthony Edwards|2022|Panini Prizm": "/cards/edwards_2020_prizm_silver.jpg",
      "Anthony Edwards|2020|Panini Select": "/cards/edwards_2020_prizm_green.jpg",
      // ── Cade Cunningham ───────────────────────────────────────────────────────
      "Cade Cunningham|2021|Panini Prizm": "/cards/cunningham_2021_prizm.jpg",
      "Cade Cunningham|2021|Panini Prizm Choice": "/cards/cunningham_2021_prizm_choice.jpg",
      "Cade Cunningham|2021|Panini National Treasures": "/cards/cunningham_2021_prizm_choice.jpg",
      "Cade Cunningham|2021|Panini Select": "/cards/cunningham_2021_prizm.jpg",
      // ── Evan Mobley ───────────────────────────────────────────────────────────
      "Evan Mobley|2021|Panini National Treasures": "/cards/mobley_2021_nt_rpa.jpg",
      "Evan Mobley|2021|Panini Prizm": "/cards/mobley_2021_nt_dual.jpg",
      "Evan Mobley|2021|Panini Select": "/cards/mobley_2021_nt_rpa.jpg",
      // ── Paolo Banchero ────────────────────────────────────────────────────────
      "Paolo Banchero|2022|Panini Prizm": "/cards/banchero_2022_prizm.jpg",
      "Paolo Banchero|2022|Panini Prizm Draft": "/cards/banchero_2022_prizm_orange.jpg",
      "Paolo Banchero|2022|Panini National Treasures": "/cards/banchero_2022_prizm_orange.jpg",
      "Paolo Banchero|2022|Panini Select": "/cards/banchero_2022_prizm.jpg",
      // ── Lamar Jackson ─────────────────────────────────────────────────────────
      "Lamar Jackson|2018|Panini Prizm": "/cards/jackson_2018_prizm_psa10.jpg",
      "Lamar Jackson|2018|Panini Prizm Silver": "/cards/jackson_2018_prizm_silver.jpg",
      "Lamar Jackson|2020|Panini Prizm": "/cards/jackson_2018_prizm_silver.jpg",
      "Lamar Jackson|2018|Panini Select": "/cards/jackson_2018_prizm_psa10.jpg",
      // ── Justin Herbert ────────────────────────────────────────────────────────
      "Justin Herbert|2020|Panini National Treasures": "/cards/herbert_2020_nt_rpa.jpg",
      "Justin Herbert|2020|Panini Prizm": "/cards/herbert_2020_prizm.jpg",
      "Justin Herbert|2021|Panini Prizm": "/cards/herbert_2020_prizm.jpg",
      "Justin Herbert|2020|Panini Select": "/cards/herbert_2020_nt_rpa.jpg",
      // ── Kyler Murray ──────────────────────────────────────────────────────────
      "Kyler Murray|2019|Panini Prizm": "/cards/murray_2019_prizm.jpg",
      "Kyler Murray|2019|Panini Select": "/cards/murray_2019_prizm.jpg",
      "Kyler Murray|2021|Panini Prizm": "/cards/murray_2019_prizm.jpg",
      // ── Fernando Tatis Jr. ────────────────────────────────────────────────────
      "Fernando Tatis Jr.|2019|Topps Chrome": "/cards/tatis_2019_topps_chrome.jpg",
      "Fernando Tatis Jr.|2019|Topps Chrome Auto": "/cards/tatis_2019_topps_chrome_auto.jpg",
      "Fernando Tatis Jr.|2021|Topps Chrome": "/cards/tatis_2019_topps_chrome.jpg",
      "Fernando Tatis Jr.|2019|Bowman Chrome": "/cards/tatis_2019_topps_chrome_auto.jpg",
      // ── Juan Soto ─────────────────────────────────────────────────────────────
      "Juan Soto|2018|Topps Chrome": "/cards/soto_2018_topps_chrome.jpg",
      "Juan Soto|2018|Topps Update Chrome": "/cards/soto_2018_topps_chrome_2.jpg",
      "Juan Soto|2021|Topps Chrome": "/cards/soto_2018_topps_chrome.jpg",
      "Juan Soto|2018|Bowman Chrome": "/cards/soto_2018_topps_chrome_2.jpg",
      // ── Julio Rodriguez ───────────────────────────────────────────────────────
      "Julio Rodriguez|2022|Topps Chrome": "/cards/jrod_2022_topps_chrome.jpg",
      "Julio Rodriguez|2022|Topps Chrome Auto": "/cards/jrod_2022_topps_chrome_auto.jpg",
      "Julio Rodriguez|2023|Topps Chrome": "/cards/jrod_2022_topps_chrome.jpg",
      "Julio Rodriguez|2022|Bowman Chrome": "/cards/jrod_2022_topps_chrome_auto.jpg",
      // ── Jude Bellingham ───────────────────────────────────────────────────────
      "Jude Bellingham|2020|Topps Chrome UCL": "/cards/bellingham_2020_topps_chrome.jpg",
      "Jude Bellingham|2020|Topps Chrome Bundesliga": "/cards/bellingham_2020_topps_chrome_bund.jpg",
      "Jude Bellingham|2022|Panini Prizm World Cup": "/cards/bellingham_2020_topps_chrome.jpg",
      "Jude Bellingham|2020|Topps Chrome": "/cards/bellingham_2020_topps_chrome_bund.jpg",
      // ── Pedri ─────────────────────────────────────────────────────────────────
      "Pedri|2021|Topps Chrome UCL": "/cards/pedri_2021_topps_chrome.jpg",
      "Pedri|2021|Topps Chrome": "/cards/pedri_2021_topps_chrome_purple.jpg",
      "Pedri|2022|Panini Prizm World Cup": "/cards/pedri_2021_topps_chrome.jpg",
      // ── Neymar Jr. ────────────────────────────────────────────────────────────
      "Neymar Jr.|2014|Panini Prizm World Cup": "/cards/neymar_2014_prizm_wc.jpg",
      "Neymar Jr.|2018|Panini Prizm World Cup": "/cards/neymar_2018_prizm_wc.jpg",
      "Neymar Jr.|2022|Panini Prizm World Cup": "/cards/neymar_2018_prizm_wc.jpg",
      // ── Kobe Bryant ───────────────────────────────────────────────────────────
      "Kobe Bryant|1996|Topps Chrome": "/cards/kobe_bryant_1996_chrome_psa9.jpg",
      "Kobe Bryant|2003|Topps Chrome": "/cards/kobe_bryant_1996_chrome_psa9b.jpg",
      "Kobe Bryant|2007|Topps Chrome": "/cards/kobe_bryant_1996_chrome_psa9.jpg",
      // ── Shaquille O'Neal ──────────────────────────────────────────────────────
      "Shaquille O'Neal|1992|Topps": "/cards/shaquille_oneal_1992_topps_bccg9.jpg",
      "Shaquille O'Neal|1992|Topps Archives": "/cards/shaquille_oneal_1992_archives_gold.jpg",
      "Shaquille O'Neal|1993|Topps Finest": "/cards/shaquille_oneal_1992_archives_gold.jpg",
      "Shaquille O'Neal|1996|Topps Chrome": "/cards/shaquille_oneal_1992_topps_bccg9.jpg",
      // ── Dwyane Wade ───────────────────────────────────────────────────────────
      "Dwyane Wade|2003|Topps Chrome": "/cards/dwyane_wade_2003_chrome_psa10.jpg",
      "Dwyane Wade|2003|Upper Deck Exquisite": "/cards/dwyane_wade_2003_chrome_psa10b.jpg",
      "Dwyane Wade|2007|Topps Chrome": "/cards/dwyane_wade_2003_chrome_psa10.jpg",
      // ── Tim Duncan ────────────────────────────────────────────────────────────
      "Tim Duncan|1997|Topps Chrome": "/cards/tim_duncan_1997_chrome_base.jpg",
      "Tim Duncan|1997|Topps Finest": "/cards/tim_duncan_1997_chrome_refractor.jpg",
      "Tim Duncan|2003|Topps Chrome": "/cards/tim_duncan_1997_chrome_base.jpg",
      // ── Dirk Nowitzki ─────────────────────────────────────────────────────────
      "Dirk Nowitzki|1998|Topps Chrome": "/cards/dirk_nowitzki_1998_chrome_base.jpg",
      "Dirk Nowitzki|1998|Topps Finest": "/cards/dirk_nowitzki_1998_chrome_bccg10.jpg",
      "Dirk Nowitzki|2007|Topps Chrome": "/cards/dirk_nowitzki_1998_chrome_base.jpg",
      // ── James Harden ──────────────────────────────────────────────────────────
      "James Harden|2009|Topps Chrome": "/cards/james_harden_2009_chrome_bgs9.jpg",
      "James Harden|2009|Panini Prizm": "/cards/james_harden_2009_chrome_bgs95.jpg",
      "James Harden|2020|Panini Prizm": "/cards/james_harden_2009_chrome_bgs9.jpg",
      // ── Kyrie Irving ──────────────────────────────────────────────────────────
      "Kyrie Irving|2012|Panini Prizm": "/cards/kyrie_irving_2012_prizm_psa9.jpg",
      "Kyrie Irving|2020|Panini Prizm": "/cards/kyrie_irving_2012_prizm_psa10.jpg",
      // ── Russell Westbrook ─────────────────────────────────────────────────────
      "Russell Westbrook|2008|Topps Chrome": "/cards/russell_westbrook_2008_chrome_psa9.jpg",
      "Russell Westbrook|2008|Panini Prizm": "/cards/russell_westbrook_2008_chrome_refractor.png",
      "Russell Westbrook|2020|Panini Prizm": "/cards/russell_westbrook_2008_chrome_psa9.jpg",
      // ── Kawhi Leonard ─────────────────────────────────────────────────────────
      "Kawhi Leonard|2011|SP Authentic": "/cards/kawhi_leonard_2011_sp_authentic.jpg",
      "Kawhi Leonard|2014|Panini Prizm": "/cards/kawhi_leonard_2014_prizm_blue.webp",
      "Kawhi Leonard|2011|Panini Prizm": "/cards/kawhi_leonard_2011_sp_authentic.jpg",
      "Kawhi Leonard|2020|Panini Prizm": "/cards/kawhi_leonard_2014_prizm_blue.webp",
      // ── Draymond Green ────────────────────────────────────────────────────────
      "Draymond Green|2012|Panini Prizm": "/cards/draymond_green_2012_prizm_psa10.jpg",
      "Draymond Green|2020|Panini Prizm": "/cards/draymond_green_2012_prizm_psa10.jpg",
      // ── Karl-Anthony Towns ────────────────────────────────────────────────────
      "Karl-Anthony Towns|2015|Panini Prizm Emergent": "/cards/karl_anthony_towns_2015_prizm_emergent.jpg",
      "Karl-Anthony Towns|2015|Panini Prizm": "/cards/karl_anthony_towns_2015_prizm_emergent.jpg",
      "Karl-Anthony Towns|2020|Panini Prizm": "/cards/karl_anthony_towns_2015_prizm_emergent.jpg",
      // ── Tom Brady ─────────────────────────────────────────────────────────────
      "Tom Brady|2000|Bowman Chrome": "/cards/tom_brady_2000_bowman_chrome_base.jpg",
      "Tom Brady|2000|Topps Chrome": "/cards/tom_brady_2000_bowman_chrome_refractor.jpg",
      "Tom Brady|2005|Topps Chrome": "/cards/tom_brady_2000_bowman_chrome_base.jpg",
      // ── Aaron Rodgers ─────────────────────────────────────────────────────────
      "Aaron Rodgers|2005|Topps Chrome": "/cards/aaron_rodgers_2005_chrome_psa9.jpg",
      "Aaron Rodgers|2020|Panini Prizm": "/cards/aaron_rodgers_2005_chrome_auto.jpg",
      // ── Peyton Manning ────────────────────────────────────────────────────────
      "Peyton Manning|1998|Topps Chrome": "/cards/peyton_manning_1998_chrome_base.jpg",
      "Peyton Manning|1998|Topps Finest": "/cards/peyton_manning_1998_chrome_bgs9.jpg",
      // ── Jerry Rice ────────────────────────────────────────────────────────────
      "Jerry Rice|1986|Topps": "/cards/jerry_rice_1986_topps_psa10.jpg",
      "Jerry Rice|1990|Topps": "/cards/jerry_rice_1986_topps_psa10.jpg",
      // ── Joe Burrow ────────────────────────────────────────────────────────────
      "Joe Burrow|2020|Panini Prizm": "/cards/joe_burrow_2020_prizm_base.jpg",
      "Joe Burrow|2020|Panini National Treasures": "/cards/joe_burrow_2020_prizm_red_yellow.jpg",
      "Joe Burrow|2021|Panini Prizm": "/cards/joe_burrow_2020_prizm_base.jpg",
      // ── Ken Griffey Jr. ───────────────────────────────────────────────────────
      "Ken Griffey Jr.|1989|Topps": "/cards/ken_griffey_jr_1989_topps_base.jpg",
      "Ken Griffey Jr.|1989|Bowman": "/cards/ken_griffey_jr_1989_topps_traded.jpg",
      "Ken Griffey Jr.|1990|Topps": "/cards/ken_griffey_jr_1989_topps_base.jpg",
      // ── Derek Jeter ───────────────────────────────────────────────────────────
      "Derek Jeter|1993|Bowman": "/cards/derek_jeter_1993_bowman_base.jpg",
      "Derek Jeter|1993|Topps": "/cards/derek_jeter_1993_bowman_psa10.jpg",
      "Derek Jeter|1994|Topps": "/cards/derek_jeter_1993_bowman_base.jpg",
      // ── Barry Bonds ───────────────────────────────────────────────────────────
      "Barry Bonds|1987|Topps": "/cards/barry_bonds_1987_topps_psa10.jpg",
      "Barry Bonds|1990|Topps": "/cards/barry_bonds_1987_topps_psa10.jpg",
      // ── Bryce Harper ──────────────────────────────────────────────────────────
      "Bryce Harper|2011|Bowman Chrome": "/cards/bryce_harper_2011_bowman_chrome_psa10.jpg",
      "Bryce Harper|2012|Topps Chrome": "/cards/bryce_harper_2011_bowman_chrome_refractor.jpg",
      // ── Lionel Messi ──────────────────────────────────────────────────────────
      "Lionel Messi|2014|Panini Prizm World Cup": "/cards/lionel_messi_2018_prizm_base.jpg",
      "Lionel Messi|2004|Panini Megacracks": "/cards/lionel_messi_2018_prizm_black_gold.jpg",
      "Lionel Messi|2022|Panini Prizm World Cup": "/cards/lionel_messi_2018_prizm_base.jpg",
      "Lionel Messi|2018|Panini Prizm World Cup": "/cards/lionel_messi_2018_prizm_black_gold.jpg",
      // ── Cristiano Ronaldo ─────────────────────────────────────────────────────
      "Cristiano Ronaldo|2018|Panini Prizm World Cup": "/cards/cristiano_ronaldo_2018_prizm_base.jpg",
      "Cristiano Ronaldo|2022|Panini Prizm World Cup": "/cards/cristiano_ronaldo_2018_prizm_scorers.jpg",
      "Cristiano Ronaldo|2014|Panini Prizm World Cup": "/cards/cristiano_ronaldo_2018_prizm_base.jpg",
      // ── Connor McDavid ────────────────────────────────────────────────────────
      "Connor McDavid|2015|Upper Deck": "/cards/mcdavid_2015_young_guns.jpg",
      "Connor McDavid|2016|Upper Deck": "/cards/mcdavid_2015_young_guns_psa.jpg",
      "Connor McDavid|2020|Upper Deck": "/cards/mcdavid_2015_young_guns.jpg",
      // ── Sidney Crosby ─────────────────────────────────────────────────────────
      "Sidney Crosby|2005|Upper Deck": "/cards/crosby_2005_young_guns.jpg",
      "Sidney Crosby|2010|Upper Deck": "/cards/crosby_2005_young_guns.jpg",
      // ── Alexander Ovechkin ────────────────────────────────────────────────────
      "Alexander Ovechkin|2005|Upper Deck": "/cards/ovechkin_2005_young_guns.jpg",
      "Alexander Ovechkin|2010|Upper Deck": "/cards/ovechkin_2005_young_guns.jpg",
      // ── Ronaldinho ────────────────────────────────────────────────────────────
      "Ronaldinho|2004|Panini": "/cards/ronaldinho_2004_panini.jpg",
      "Ronaldinho|2006|Panini": "/cards/ronaldinho_2004_panini.jpg",
      "Ronaldinho|2004|Topps": "/cards/ronaldinho_2004_panini.jpg",
      // ── Zinedine Zidane ───────────────────────────────────────────────────────
      "Zinedine Zidane|2006|Panini": "/cards/zidane_2006_panini.jpg",
      "Zinedine Zidane|2002|Panini": "/cards/zidane_2006_panini.jpg",
      "Zinedine Zidane|1998|Panini": "/cards/zidane_2006_panini.jpg",
      // ── Thierry Henry ─────────────────────────────────────────────────────────
      "Thierry Henry|2006|Panini": "/cards/henry_2006_panini.jpg",
      "Thierry Henry|2003|Topps": "/cards/henry_2006_panini.jpg",
      "Thierry Henry|1998|Panini": "/cards/henry_2006_panini.jpg",
      // ── Lamine Yamal ─────────────────────────────────────────────────────────
      "Lamine Yamal|2024|Panini Select FIFA": "/cards/yamal_2024_select_patch.jpg",
      "Lamine Yamal|2024|Topps Now": "/cards/yamal_2024_topps_now.jpg",
      "Lamine Yamal|2024|Panini Select La Liga": "/cards/yamal_2024_select_gold.jpg",
      "Lamine Yamal|2024|Topps": "/cards/yamal_2024_topps_now.jpg",
      // ── Florian Wirtz ─────────────────────────────────────────────────────────
      "Florian Wirtz|2023|Topps Chrome UEFA": "/cards/wirtz_2023_chrome.jpg",
      "Florian Wirtz|2022|Topps Chrome UEFA": "/cards/wirtz_2022_chrome.jpg",
      "Florian Wirtz|2022|Topps Chrome": "/cards/wirtz_2022_chrome.jpg",
      "Florian Wirtz|2024|Topps Chrome Bundesliga": "/cards/wirtz_2023_chrome.jpg",
      // ── Michael Jordan ────────────────────────────────────────────────────────
      "Michael Jordan|1986|Fleer": "/cards/jordan_1986_fleer.jpg",
      "Michael Jordan|1997|Topps Chrome": "/cards/jordan_1986_fleer.jpg",
      // ── Magic Johnson ─────────────────────────────────────────────────────────
      "Magic Johnson|1980|Topps": "/cards/magic_1980_topps.jpg",
      "Magic Johnson|1986|Fleer": "/cards/magic_1980_topps.jpg",
      // ── Larry Bird ────────────────────────────────────────────────────────────
      "Larry Bird|1980|Topps": "/cards/bird_1980_topps.jpg",
      "Larry Bird|1986|Fleer": "/cards/bird_1980_topps.jpg",
      // ── Wayne Gretzky ─────────────────────────────────────────────────────────
      "Wayne Gretzky|1979|O-Pee-Chee": "/cards/gretzky_1979_opc.jpg",
      "Wayne Gretzky|1985|O-Pee-Chee": "/cards/gretzky_1979_opc.jpg",
      // ── Babe Ruth ─────────────────────────────────────────────────────────────
      "Babe Ruth|1933|Goudey": "/cards/ruth_1933_goudey.jpg",
      "Babe Ruth|1934|Goudey": "/cards/ruth_1933_goudey.jpg",
      // ── Wilt Chamberlain ──────────────────────────────────────────────────────
      "Wilt Chamberlain|1961|Fleer": "/cards/chamberlain_1961_fleer.jpg",
      "Wilt Chamberlain|1969|Topps": "/cards/chamberlain_1961_fleer.jpg",
      // ── Klay Thompson ───────────────────────────────────────────────────────────────────────────────────
      "Klay Thompson|2012|Panini Prizm": "/cards/klay_thompson_prizm_2012_psa10.jpg",
      "Klay Thompson|2012|National Treasures": "/cards/klay_thompson_nt_2012_rpa_bgs95.jpg",
      "Klay Thompson|2023|Panini Prizm": "/cards/klay_thompson_prizm_2023_white_ice.jpg",
      "Klay Thompson|2023|National Treasures": "/cards/klay_thompson_nt_2023_clutch.jpg",
      "Klay Thompson|2024|Topps Chrome": "/cards/klay_thompson_chrome_2024_green.jpg",
      "Klay Thompson|2024|Panini Select": "/cards/klay_thompson_select_2024_white.jpg",
      "Klay Thompson|2020|Donruss Optic": "/cards/klay_thompson_optic_2020_holo.jpg",
      "Klay Thompson|2021|Donruss Optic": "/cards/klay_thompson_optic_2021_holo.jpg"
    };
    MOCK_PLAYERS = SEED_PLAYERS.map((p, i) => ({
      id: i + 1,
      externalId: p.externalId,
      name: p.name,
      sport: p.sport,
      team: p.team,
      position: p.position,
      jerseyNumber: "0",
      imageUrl: PLAYER_IMAGES[p.name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=200`,
      performanceScore: p.performanceScore,
      recentStats: null,
      lastStatsUpdate: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }));
    MOCK_CARDS = [];
    MOCK_PRICE_HISTORY = [];
    MOCK_PORTFOLIO_POSITIONS = [];
    MOCK_WATCHLIST = [];
    MOCK_NOTIFICATIONS = [];
    MOCK_REPORTS = [];
    MOCK_TREND_SNAPSHOTS = [];
    cardIdCounter = 1;
    phIdCounter = 1;
    for (const player of MOCK_PLAYERS) {
      const cards2 = generateCardData(player.id, player.name, player.sport, player.performanceScore);
      for (const c of cards2) {
        const cardId = cardIdCounter++;
        const cardImageUrl = getCardImage(player.name, c.year, c.brand);
        MOCK_CARDS.push({
          id: cardId,
          playerId: player.id,
          playerName: player.name,
          sport: player.sport,
          year: c.year,
          brand: c.brand,
          set: c.set,
          cardNumber: null,
          parallel: c.parallel,
          grade: c.grade,
          population: Math.floor(Math.random() * 500) + 10,
          imageUrl: cardImageUrl,
          currentPrice: c.currentPrice,
          avgPrice30d: c.avgPrice30d,
          priceChange7d: c.priceChange7d,
          dealScore: c.dealScore,
          isDealOpportunity: c.isDealOpportunity,
          marketSentiment: c.marketSentiment,
          populationTitle: "PSA Population Report",
          pop10Count: Math.floor(Math.random() * 200) + 1,
          shortTermTarget: c.currentPrice * (1 + (Math.random() * 0.15 + 0.05)),
          longTermTarget: c.currentPrice * (1 + (Math.random() * 0.4 + 0.2)),
          riskLevel: c.priceChange7d > 5 ? "Medium" : c.priceChange7d < -5 ? "High" : "Low",
          signal: c.priceChange7d > 5 ? "BUY" : c.priceChange7d < -5 ? "WAIT" : "HOLD",
          lastPriceUpdate: /* @__PURE__ */ new Date(),
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        for (const ph of c.priceHistory) {
          MOCK_PRICE_HISTORY.push({
            id: phIdCounter++,
            cardId,
            price: ph.price,
            source: ph.source,
            saleDate: ph.date,
            condition: c.grade,
            listingUrl: null,
            createdAt: /* @__PURE__ */ new Date()
          });
        }
      }
    }
    MOCK_PORTFOLIO_POSITIONS.push(
      { id: 1, userId: 1, cardId: 1, quantity: 1, averageCost: 1200, targetPrice: 1800, notes: "\u6838\u5FC3\u957F\u671F\u4ED3\u4F4D", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() },
      { id: 2, userId: 1, cardId: 2, quantity: 2, averageCost: 350, targetPrice: 520, notes: "\u8D5B\u5B63\u50AC\u5316\u89C2\u5BDF", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() },
      { id: 3, userId: 1, cardId: 5, quantity: 1, averageCost: 680, targetPrice: 960, notes: "\u4E16\u754C\u676F\u7A97\u53E3\u671F", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
    );
    MOCK_WATCHLIST.push({ id: 1, userId: 1, cardId: 1, playerId: null, alertPriceBelow: 1100, alertDealScoreAbove: 82, notes: "\u9AD8\u7AEF\u5361\u91CD\u70B9\u8DDF\u8E2A", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
    MOCK_NOTIFICATIONS.push({ id: 1, userId: 1, type: "scan_complete", title: "\u793A\u4F8B\u901A\u77E5", content: "\u6B22\u8FCE\u4F7F\u7528 CardIQ\uFF0C\u672C\u5730\u6A21\u5F0F\u4E0B\u4E5F\u53EF\u4EE5\u4F53\u9A8C\u5B8C\u6574\u5DE5\u4F5C\u6D41\u3002", cardId: null, isRead: false, createdAt: /* @__PURE__ */ new Date() });
    MOCK_REPORTS.push({ id: 1, userId: 1, title: "\u793A\u4F8B\u7814\u7A76\u62A5\u544A", sport: "NBA", content: "\u8FD9\u662F\u4E00\u4E2A\u672C\u5730\u793A\u4F8B\u62A5\u544A\uFF0C\u7528\u4E8E\u5C55\u793A AI \u62A5\u544A\u5217\u8868\u4E0E\u8BE6\u60C5\u80FD\u529B\u3002", topDeals: [1, 2, 3], createdAt: /* @__PURE__ */ new Date() });
    MOCK_TREND_SNAPSHOTS.push(
      { id: 1, cardId: 1, trend: "bullish", confidence: 82, compositeScore: 84, source: "scan", notes: "\u521D\u59CB\u5F3A\u52BF\u6837\u672C", createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 3) },
      { id: 2, cardId: 1, trend: "bullish", confidence: 86, compositeScore: 88, source: "scan", notes: "\u8FD1\u671F\u7EE7\u7EED\u8D70\u5F3A", createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 1) },
      { id: 3, cardId: 2, trend: "neutral", confidence: 70, compositeScore: 61, source: "scan", notes: "\u533A\u95F4\u9707\u8361", createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 2) }
    );
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addPortfolioPosition: () => addPortfolioPosition,
  addToWatchlist: () => addToWatchlist,
  createNotification: () => createNotification,
  createScanJob: () => createScanJob,
  getAllCards: () => getAllCards,
  getAllWatchlistItems: () => getAllWatchlistItems,
  getCardById: () => getCardById,
  getCardsByPlayer: () => getCardsByPlayer,
  getDb: () => getDb,
  getDealOpportunities: () => getDealOpportunities,
  getLatestScanJob: () => getLatestScanJob,
  getLatestTrendSnapshot: () => getLatestTrendSnapshot,
  getPlayerByExternalId: () => getPlayerByExternalId,
  getPlayerById: () => getPlayerById,
  getPortfolioSummary: () => getPortfolioSummary,
  getPriceHistory: () => getPriceHistory,
  getReportById: () => getReportById,
  getScanJobHistory: () => getScanJobHistory,
  getScanSchedule: () => getScanSchedule,
  getTopPlayers: () => getTopPlayers,
  getTrendHistory: () => getTrendHistory,
  getUnreadNotificationCount: () => getUnreadNotificationCount,
  getUserByOpenId: () => getUserByOpenId,
  getUserNotifications: () => getUserNotifications,
  getUserPortfolio: () => getUserPortfolio,
  getUserReports: () => getUserReports,
  getUserWatchlist: () => getUserWatchlist,
  insertPriceHistory: () => insertPriceHistory,
  insertTrendSnapshot: () => insertTrendSnapshot,
  markAllNotificationsRead: () => markAllNotificationsRead,
  markNotificationRead: () => markNotificationRead,
  removeFromWatchlist: () => removeFromWatchlist,
  removePortfolioPosition: () => removePortfolioPosition,
  saveInvestmentReport: () => saveInvestmentReport,
  searchPlayers: () => searchPlayers,
  updatePortfolioPosition: () => updatePortfolioPosition,
  updateScanJob: () => updateScanJob,
  updateScheduleLastRun: () => updateScheduleLastRun,
  updateWatchlistItem: () => updateWatchlistItem,
  upsertCard: () => upsertCard,
  upsertPlayer: () => upsertPlayer,
  upsertScanSchedule: () => upsertScanSchedule,
  upsertUser: () => upsertUser
});
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  textFields.forEach((field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertPlayer(player) {
  const db = await getDb();
  if (!db) return;
  await db.insert(players).values(player).onDuplicateKeyUpdate({
    set: {
      name: player.name,
      team: player.team,
      position: player.position,
      performanceScore: player.performanceScore,
      recentStats: player.recentStats,
      lastStatsUpdate: player.lastStatsUpdate,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getPlayerByExternalId(externalId) {
  const db = await getDb();
  if (!db) return MOCK_PLAYERS.find((p) => p.externalId === externalId);
  const result = await db.select().from(players).where(eq(players.externalId, externalId)).limit(1);
  return result[0];
}
async function searchPlayers(query, sport) {
  const db = await getDb();
  if (!db) {
    return MOCK_PLAYERS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) && (!sport || sport === "ALL" || p.sport === sport)).slice(0, 20);
  }
  const conditions = [sql`${players.name} LIKE ${`%${query}%`}`];
  if (sport && sport !== "ALL") {
    conditions.push(eq(players.sport, sport));
  }
  return db.select().from(players).where(and(...conditions)).limit(20);
}
async function getPlayerById(id) {
  const db = await getDb();
  if (!db) return MOCK_PLAYERS.find((player) => player.id === id);
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result[0];
}
async function getTopPlayers(sport, limit = 20) {
  const db = await getDb();
  if (!db) {
    return MOCK_PLAYERS.filter((p) => !sport || sport === "ALL" || p.sport === sport).sort((a, b) => b.performanceScore - a.performanceScore).slice(0, limit);
  }
  const conditions = sport && sport !== "ALL" ? [eq(players.sport, sport)] : [];
  return db.select().from(players).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(players.performanceScore)).limit(limit);
}
async function upsertCard(card) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(cards).values(card).onDuplicateKeyUpdate({
    set: {
      currentPrice: card.currentPrice,
      avgPrice30d: card.avgPrice30d,
      priceChange7d: card.priceChange7d,
      dealScore: card.dealScore,
      isDealOpportunity: card.isDealOpportunity,
      marketSentiment: card.marketSentiment,
      lastPriceUpdate: card.lastPriceUpdate,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  return result[0].insertId ?? 0;
}
async function getCardById(id) {
  const db = await getDb();
  if (!db) return MOCK_CARDS.find((c) => c.id === id);
  const result = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return result[0];
}
async function getCardsByPlayer(playerId) {
  const db = await getDb();
  if (!db) return MOCK_CARDS.filter((c) => c.playerId === playerId).sort((a, b) => b.dealScore - a.dealScore);
  return db.select().from(cards).where(eq(cards.playerId, playerId)).orderBy(desc(cards.dealScore));
}
async function getDealOpportunities(sport, limit = 30) {
  const db = await getDb();
  if (!db) {
    return MOCK_CARDS.filter((c) => c.isDealOpportunity && (!sport || sport === "ALL" || c.sport === sport)).sort((a, b) => b.dealScore - a.dealScore).slice(0, limit);
  }
  const conditions = [eq(cards.isDealOpportunity, true)];
  if (sport && sport !== "ALL") {
    conditions.push(eq(cards.sport, sport));
  }
  return db.select().from(cards).where(and(...conditions)).orderBy(desc(cards.dealScore)).limit(limit);
}
async function getAllCards(sport, limit = 200) {
  const db = await getDb();
  if (!db) {
    return MOCK_CARDS.filter((c) => !sport || sport === "ALL" || c.sport === sport).sort((a, b) => b.dealScore - a.dealScore).slice(0, limit);
  }
  const conditions = sport && sport !== "ALL" ? [eq(cards.sport, sport)] : [];
  return db.select().from(cards).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(cards.dealScore)).limit(limit);
}
async function insertPriceHistory(record) {
  const db = await getDb();
  if (!db) return;
  await db.insert(priceHistory).values(record);
}
async function getPriceHistory(cardId, days = 90) {
  const db = await getDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
  if (!db) {
    return MOCK_PRICE_HISTORY.filter((ph) => ph.cardId === cardId && ph.saleDate >= since).sort((a, b) => a.saleDate.getTime() - b.saleDate.getTime());
  }
  return db.select().from(priceHistory).where(and(eq(priceHistory.cardId, cardId), gte(priceHistory.saleDate, since))).orderBy(priceHistory.saleDate);
}
async function getUserWatchlist(userId) {
  const db = await getDb();
  if (!db) return MOCK_WATCHLIST.filter((item) => item.userId === userId).sort((a, b) => b.id - a.id);
  return db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(desc(watchlist.createdAt));
}
async function addToWatchlist(item) {
  const db = await getDb();
  if (!db) {
    const exists = MOCK_WATCHLIST.find((entry) => entry.userId === item.userId && (item.cardId && entry.cardId === item.cardId || item.playerId && entry.playerId === item.playerId));
    if (exists) return;
    const nextId = (MOCK_WATCHLIST[0]?.id ?? 0) + 1;
    MOCK_WATCHLIST.unshift({ id: nextId, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date(), ...item });
    return;
  }
  const conditions = [eq(watchlist.userId, item.userId)];
  if (item.cardId) conditions.push(eq(watchlist.cardId, item.cardId));
  if (item.playerId) conditions.push(eq(watchlist.playerId, item.playerId));
  const existing = await db.select().from(watchlist).where(and(...conditions)).limit(1);
  if (existing[0]) return;
  await db.insert(watchlist).values(item);
}
async function removeFromWatchlist(id, userId) {
  const db = await getDb();
  if (!db) {
    const index = MOCK_WATCHLIST.findIndex((item) => item.id === id && item.userId === userId);
    if (index >= 0) MOCK_WATCHLIST.splice(index, 1);
    return;
  }
  await db.delete(watchlist).where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));
}
async function updateWatchlistItem(id, userId, data) {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_WATCHLIST.find((item) => item.id === id && item.userId === userId);
    if (existing) Object.assign(existing, data, { updatedAt: /* @__PURE__ */ new Date() });
    return;
  }
  await db.update(watchlist).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));
}
async function getAllWatchlistItems() {
  const db = await getDb();
  if (!db) return MOCK_WATCHLIST;
  return db.select().from(watchlist);
}
async function createNotification(notif) {
  const db = await getDb();
  if (!db) {
    const nextId = (MOCK_NOTIFICATIONS[0]?.id ?? 0) + 1;
    MOCK_NOTIFICATIONS.unshift({ id: nextId, isRead: false, createdAt: /* @__PURE__ */ new Date(), ...notif });
    return;
  }
  await db.insert(notifications).values(notif);
}
async function getUserNotifications(userId, limit = 50) {
  const db = await getDb();
  if (!db) return MOCK_NOTIFICATIONS.filter((item) => item.userId === userId).slice(0, limit);
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function markNotificationRead(id, userId) {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_NOTIFICATIONS.find((item) => item.id === id && item.userId === userId);
    if (existing) existing.isRead = true;
    return;
  }
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}
async function markAllNotificationsRead(userId) {
  const db = await getDb();
  if (!db) {
    MOCK_NOTIFICATIONS.filter((item) => item.userId === userId).forEach((item) => item.isRead = true);
    return;
  }
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
async function getUnreadNotificationCount(userId) {
  const db = await getDb();
  if (!db) return MOCK_NOTIFICATIONS.filter((item) => item.userId === userId && !item.isRead).length;
  const result = await db.select({ count: sql`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}
async function saveInvestmentReport(data) {
  const db = await getDb();
  if (!db) {
    const nextId = (MOCK_REPORTS[0]?.id ?? 0) + 1;
    MOCK_REPORTS.unshift({ id: nextId, createdAt: /* @__PURE__ */ new Date(), ...data });
    return nextId;
  }
  const result = await db.insert(investmentReports).values({
    userId: data.userId,
    title: data.title,
    sport: data.sport,
    content: data.content,
    topDeals: data.topDeals ?? []
  });
  return result[0].insertId ?? 0;
}
async function getUserReports(userId) {
  const db = await getDb();
  if (!db) return MOCK_REPORTS.filter((item) => item.userId === userId);
  return db.select().from(investmentReports).where(eq(investmentReports.userId, userId)).orderBy(desc(investmentReports.createdAt)).limit(20);
}
async function getReportById(id, userId) {
  const db = await getDb();
  if (!db) return MOCK_REPORTS.find((item) => item.id === id && item.userId === userId);
  const result = await db.select().from(investmentReports).where(and(eq(investmentReports.id, id), eq(investmentReports.userId, userId))).limit(1);
  return result[0];
}
async function createScanJob(triggeredBy = "manual") {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(scanJobs).values({ status: "pending", triggeredBy });
  return result.insertId ?? 0;
}
async function updateScanJob(id, data) {
  const db = await getDb();
  if (!db) return;
  const updateData = { ...data };
  if (data.status === "running") updateData.startedAt = /* @__PURE__ */ new Date();
  if (data.status === "completed" || data.status === "failed") updateData.completedAt = /* @__PURE__ */ new Date();
  await db.update(scanJobs).set(updateData).where(eq(scanJobs.id, id));
}
async function getLatestScanJob() {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(scanJobs).orderBy(desc(scanJobs.createdAt)).limit(1);
  return result[0];
}
async function getScanJobHistory(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scanJobs).orderBy(desc(scanJobs.createdAt)).limit(limit);
}
async function getScanSchedule() {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(scanSchedule).limit(1);
  return result[0];
}
async function upsertScanSchedule(data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getScanSchedule();
  if (existing) {
    await db.update(scanSchedule).set({
      enabled: data.enabled,
      hour: data.hour,
      minute: data.minute,
      timezone: data.timezone ?? "Asia/Shanghai",
      dealScoreThreshold: data.dealScoreThreshold ?? 70,
      nextRunAt: data.nextRunAt
    }).where(eq(scanSchedule.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(scanSchedule).values({
      enabled: data.enabled,
      hour: data.hour,
      minute: data.minute,
      timezone: data.timezone ?? "Asia/Shanghai",
      dealScoreThreshold: data.dealScoreThreshold ?? 70,
      nextRunAt: data.nextRunAt
    });
    return result.insertId ?? 0;
  }
}
async function updateScheduleLastRun(id, lastRunAt, nextRunAt) {
  const db = await getDb();
  if (!db) return;
  await db.update(scanSchedule).set({ lastRunAt, nextRunAt }).where(eq(scanSchedule.id, id));
}
async function getUserPortfolio(userId) {
  const db = await getDb();
  if (!db) {
    return MOCK_PORTFOLIO_POSITIONS.filter((item) => item.userId === userId).sort((a, b) => b.id - a.id);
  }
  return db.select().from(portfolioPositions).where(eq(portfolioPositions.userId, userId)).orderBy(desc(portfolioPositions.createdAt));
}
async function addPortfolioPosition(item) {
  const db = await getDb();
  if (!db) {
    const existing2 = MOCK_PORTFOLIO_POSITIONS.find((position) => position.userId === item.userId && position.cardId === item.cardId);
    if (existing2) {
      const totalQuantity = Number(existing2.quantity) + Number(item.quantity ?? 1);
      const totalCost = Number(existing2.averageCost) * Number(existing2.quantity) + Number(item.averageCost) * Number(item.quantity ?? 1);
      existing2.quantity = totalQuantity;
      existing2.averageCost = totalCost / totalQuantity;
      existing2.targetPrice = item.targetPrice ?? existing2.targetPrice;
      existing2.notes = item.notes ?? existing2.notes;
      existing2.updatedAt = /* @__PURE__ */ new Date();
      return;
    }
    MOCK_PORTFOLIO_POSITIONS.unshift({
      id: mockPortfolioIdCounter++,
      quantity: 1,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      ...item
    });
    return;
  }
  const existing = await db.select().from(portfolioPositions).where(and(eq(portfolioPositions.userId, item.userId), eq(portfolioPositions.cardId, item.cardId))).limit(1);
  if (existing[0]) {
    const totalQuantity = Number(existing[0].quantity) + Number(item.quantity ?? 1);
    const totalCost = Number(existing[0].averageCost) * Number(existing[0].quantity) + Number(item.averageCost) * Number(item.quantity ?? 1);
    await db.update(portfolioPositions).set({
      quantity: totalQuantity,
      averageCost: totalCost / totalQuantity,
      targetPrice: item.targetPrice ?? existing[0].targetPrice,
      notes: item.notes ?? existing[0].notes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(portfolioPositions.id, existing[0].id));
    return;
  }
  await db.insert(portfolioPositions).values(item);
}
async function updatePortfolioPosition(id, userId, data) {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_PORTFOLIO_POSITIONS.find((position) => position.id === id && position.userId === userId);
    if (!existing) return;
    Object.assign(existing, data, { updatedAt: /* @__PURE__ */ new Date() });
    return;
  }
  await db.update(portfolioPositions).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(portfolioPositions.id, id), eq(portfolioPositions.userId, userId)));
}
async function removePortfolioPosition(id, userId) {
  const db = await getDb();
  if (!db) {
    const idx = MOCK_PORTFOLIO_POSITIONS.findIndex((position) => position.id === id && position.userId === userId);
    if (idx >= 0) MOCK_PORTFOLIO_POSITIONS.splice(idx, 1);
    return;
  }
  await db.delete(portfolioPositions).where(and(eq(portfolioPositions.id, id), eq(portfolioPositions.userId, userId)));
}
async function getPortfolioSummary(userId) {
  const positions = await getUserPortfolio(userId);
  const cardsById = new Map(MOCK_CARDS.map((card) => [card.id, card]));
  let costBasis = 0;
  let marketValue = 0;
  for (const position of positions) {
    const quantity = Number(position.quantity ?? 0);
    costBasis += Number(position.averageCost ?? 0) * quantity;
    let card = cardsById.get(position.cardId);
    if (!card) {
      card = await getCardById(position.cardId);
    }
    marketValue += Number(card?.currentPrice ?? 0) * quantity;
  }
  const unrealizedPnL = marketValue - costBasis;
  return {
    positions: positions.length,
    costBasis,
    marketValue,
    unrealizedPnL,
    unrealizedPnLPercent: costBasis > 0 ? unrealizedPnL / costBasis * 100 : 0
  };
}
async function insertTrendSnapshot(item) {
  const db = await getDb();
  if (!db) {
    MOCK_TREND_SNAPSHOTS.unshift({ id: mockTrendSnapshotIdCounter++, createdAt: /* @__PURE__ */ new Date(), ...item });
    return;
  }
  await db.insert(trendSnapshots).values(item);
}
async function getTrendHistory(cardId, limit = 20) {
  const db = await getDb();
  if (!db) {
    return MOCK_TREND_SNAPSHOTS.filter((item) => item.cardId === cardId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit);
  }
  return db.select().from(trendSnapshots).where(eq(trendSnapshots.cardId, cardId)).orderBy(desc(trendSnapshots.createdAt)).limit(limit);
}
async function getLatestTrendSnapshot(cardId) {
  const history = await getTrendHistory(cardId, 1);
  return history[0];
}
var _db, mockPortfolioIdCounter, mockTrendSnapshotIdCounter;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_mockDb();
    _db = null;
    mockPortfolioIdCounter = MOCK_PORTFOLIO_POSITIONS.length + 1;
    mockTrendSnapshotIdCounter = MOCK_TREND_SNAPSHOTS.length + 1;
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios2 from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios2.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/routers.ts
import { z as z4 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/routers.ts
init_db();
init_sportsDataService();

// server/cronScheduler.ts
init_db();
init_schema();
import * as cron from "node-cron";
import { eq as eq2 } from "drizzle-orm";
var _runScanFn = null;
function registerScanRunner(fn) {
  _runScanFn = fn;
}
var _currentTask = null;
function calcNextRunAt(hour, minute) {
  const now = /* @__PURE__ */ new Date();
  const utc8Offset = 8 * 60 * 60 * 1e3;
  const nowUtc8 = new Date(now.getTime() + utc8Offset);
  const next = new Date(nowUtc8);
  next.setUTCHours(hour, minute, 0, 0);
  if (next <= nowUtc8) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return new Date(next.getTime() - utc8Offset);
}
function stopCurrentTask() {
  if (_currentTask) {
    _currentTask.stop();
    _currentTask = null;
    console.log("[CronScheduler] Stopped existing cron task");
  }
}
async function startScheduledScan() {
  stopCurrentTask();
  const db = await getDb();
  if (!db) {
    console.warn("[CronScheduler] Database not available, skipping cron setup");
    return;
  }
  const rows = await db.select().from(scanSchedule).limit(1);
  const config = rows[0];
  if (!config || !config.enabled) {
    console.log("[CronScheduler] Auto-scan is disabled or not configured");
    return;
  }
  const { hour, minute } = config;
  const utcHour = (hour - 8 + 24) % 24;
  const cronExpr = `${minute} ${utcHour} * * *`;
  console.log(`[CronScheduler] Scheduling daily scan at ${hour}:${String(minute).padStart(2, "0")} CST (${cronExpr} UTC)`);
  _currentTask = cron.schedule(cronExpr, async () => {
    console.log("[CronScheduler] Triggered scheduled scan");
    try {
      if (!_runScanFn) {
        console.warn("[CronScheduler] No scan runner registered");
        return;
      }
      const result = await _runScanFn();
      console.log(`[CronScheduler] Scan complete: ${result.dealsFound} deals found, ${result.cardsScanned} cards scanned`);
      const db2 = await getDb();
      if (db2) {
        await db2.update(scanSchedule).set({
          lastRunAt: /* @__PURE__ */ new Date(),
          nextRunAt: calcNextRunAt(hour, minute)
        }).where(eq2(scanSchedule.id, config.id));
      }
    } catch (err) {
      console.error("[CronScheduler] Scheduled scan failed:", err);
    }
  });
  await db.update(scanSchedule).set({
    nextRunAt: calcNextRunAt(hour, minute)
  }).where(eq2(scanSchedule.id, config.id));
  console.log(`[CronScheduler] Next run at: ${calcNextRunAt(hour, minute).toISOString()}`);
}
async function initCronScheduler() {
  console.log("[CronScheduler] Initializing...");
  await startScheduledScan();
}

// server/portfolioRouter.ts
import { z as z2 } from "zod";
init_db();
var portfolioRouter = router({
  get: publicProcedure.query(async () => {
    const positions = await getUserPortfolio(1);
    const enriched = await Promise.all(
      positions.map(async (position) => ({
        ...position,
        card: await getCardById(position.cardId)
      }))
    );
    const summary = await getPortfolioSummary(1);
    return { positions: enriched, summary };
  }),
  add: publicProcedure.input(
    z2.object({
      cardId: z2.number(),
      quantity: z2.number().positive(),
      averageCost: z2.number().positive(),
      targetPrice: z2.number().positive().optional(),
      notes: z2.string().optional()
    })
  ).mutation(async ({ input }) => {
    await addPortfolioPosition({ userId: 1, ...input });
    return { success: true };
  }),
  update: publicProcedure.input(
    z2.object({
      id: z2.number(),
      quantity: z2.number().positive().optional(),
      averageCost: z2.number().positive().optional(),
      targetPrice: z2.number().positive().optional(),
      notes: z2.string().optional()
    })
  ).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updatePortfolioPosition(id, 1, data);
    return { success: true };
  }),
  remove: publicProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await removePortfolioPosition(input.id, 1);
    return { success: true };
  })
});

// server/marketDataRouter.ts
import { z as z3 } from "zod";
init_db();

// server/marketDataService.ts
import { readFile } from "node:fs/promises";
init_db();
function buildSearchKeyword(card) {
  return [card.year, card.playerName, card.brand, card.set, card.parallel, card.grade].filter(Boolean).join(" ").trim();
}
function normalizePrice(value) {
  const num = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}
function normalizeManualItems(items, fallbackSource = "manual") {
  return items.map((item) => ({
    title: item.title || item.name || "\u5916\u90E8\u6210\u4EA4\u8BB0\u5F55",
    price: normalizePrice(item.price ?? item.amount ?? item.salePrice),
    soldAt: new Date(item.soldAt || item.saleDate || item.date || Date.now()).toISOString(),
    source: item.source || fallbackSource,
    url: item.url || item.listingUrl || null,
    condition: item.condition || item.grade || null
  })).filter((item) => item.price > 0).slice(0, 30);
}
function parseCsvLine(line) {
  const result = [];
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
function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const columns = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = columns[index] || "";
      return acc;
    }, {});
  });
}
function getConfiguredSources(mode) {
  const raw = process.env.MARKET_DATA_SOURCES?.split(",").map((item) => item.trim()).filter(Boolean);
  if (raw && raw.length > 0) return raw;
  if (mode === "aggregate") return ["manual", "feed", "csv", "apify"];
  return [mode];
}
function tokenize(text2) {
  return text2.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").split(/\s+/).filter(Boolean);
}
function heuristicMatchScore(card, sale) {
  const saleTokens = new Set(tokenize(`${sale.title} ${sale.condition || ""}`));
  const targets = [card.playerName, String(card.year || ""), card.brand, card.set, card.parallel, card.grade].filter(Boolean);
  const hits = targets.filter((target) => tokenize(target).some((token) => saleTokens.has(token))).length;
  return hits / Math.max(targets.length, 1);
}
async function reviewSalesWithAI(card, items) {
  const sample = items.slice(0, 12);
  if (sample.length === 0) return { reviewed: items, aiAssisted: false };
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "\u4F60\u662F\u7403\u661F\u5361\u6210\u4EA4\u6570\u636E\u6E05\u6D17\u52A9\u624B\u3002\u5224\u65AD\u6BCF\u6761\u6210\u4EA4\u662F\u5426\u4E0E\u76EE\u6807\u5361\u7247\u9AD8\u5EA6\u5339\u914D\uFF0C\u8F93\u51FA\u4E25\u683C JSON\u3002matched \u4E3A\u662F\u5426\u4FDD\u7559\uFF0Cconfidence \u4E3A 0-100\u3002suspect \u4E3A\u662F\u5426\u7591\u4F3C\u810F\u6570\u636E\u6216\u9519\u5361\u3002"
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
              grade: card.grade
            },
            sales: sample.map((item, index) => ({ index, title: item.title, condition: item.condition, price: item.price, soldAt: item.soldAt, source: item.source }))
          })
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200
    });
    const content = response.choices[0]?.message?.content;
    const text2 = typeof content === "string" ? content : "";
    const payload = JSON.parse(text2 || "{}");
    const reviews = Array.isArray(payload.items) ? payload.items : [];
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
async function fetchManualEndpoints(card) {
  const endpoints = [
    process.env.MARKET_DATA_ENDPOINT,
    ...process.env.MARKET_DATA_ENDPOINTS?.split(",").map((item) => item.trim()).filter(Boolean) || []
  ].filter(Boolean);
  if (endpoints.length === 0) return [];
  const results = await Promise.allSettled(
    endpoints.map(async (endpoint, index) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...process.env.MARKET_DATA_TOKEN ? { Authorization: `Bearer ${process.env.MARKET_DATA_TOKEN}` } : {}
        },
        body: JSON.stringify({ keyword: buildSearchKeyword(card), card })
      });
      if (!response.ok) throw new Error(`Manual market endpoint failed: ${response.status}`);
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
      return normalizeManualItems(items, `manual-bridge-${index + 1}`);
    })
  );
  return results.flatMap((item) => item.status === "fulfilled" ? item.value : []);
}
async function fetchFeedEndpoint(card) {
  const template = process.env.MARKET_DATA_FEED_URL_TEMPLATE || process.env.MARKET_DATA_FEED_URL;
  if (!template) return [];
  const query = encodeURIComponent(buildSearchKeyword(card));
  const url = template.replaceAll("{query}", query);
  const response = await fetch(url, {
    headers: process.env.MARKET_DATA_TOKEN ? { Authorization: `Bearer ${process.env.MARKET_DATA_TOKEN}` } : void 0
  });
  if (!response.ok) throw new Error(`Feed market endpoint failed: ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  return normalizeManualItems(items, "feed");
}
async function fetchCsvSource(card) {
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
  const rows = parseCsv(content).filter((row) => `${row.title || row.name || ""} ${row.playerName || ""} ${row.brand || ""} ${row.set || ""}`.toLowerCase().includes(keyword)).slice(0, 30);
  return normalizeManualItems(rows, "csv");
}
async function fetchApifyItems(card) {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_EBAY_SOLD_ACTOR_ID;
  if (!token || !actorId) return [];
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      searchTerms: [buildSearchKeyword(card)],
      maxItems: 20
    })
  });
  if (!response.ok) throw new Error(`Apify actor failed: ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : [];
  return normalizeManualItems(items, "apify-ebay-sold");
}
async function fallbackFromHistory(cardId) {
  const history = await getPriceHistory(cardId, 45);
  return history.slice(-20).reverse().map((item) => ({
    title: "\u5E73\u53F0\u5386\u53F2\u6210\u4EA4\u8BB0\u5F55",
    price: Number(item.price),
    soldAt: new Date(item.saleDate).toISOString(),
    source: item.source || "mock",
    url: item.listingUrl || null,
    condition: item.condition || null
  }));
}
function dedupeSales(items) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    const key = `${item.title.toLowerCase()}|${item.price}|${item.soldAt.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function filterOutlierSales(items) {
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
function buildSourceBreakdown(items) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = item.source;
    const kind = key.includes("manual") ? "bridge" : key.includes("apify") ? "apify" : key.includes("feed") ? "feed" : key.includes("csv") ? "csv" : "history";
    const current = map.get(key) || { source: key, count: 0, kind };
    current.count += 1;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
function buildQualityScore(items, usedSources, outliers, aiAssisted) {
  let score = 45;
  score += Math.min(items.length, 12) * 3;
  score += Math.min(usedSources.length, 4) * 8;
  score -= Math.min(outliers, 6) * 4;
  const withUrls = items.filter((item) => Boolean(item.url)).length;
  score += Math.min(withUrls, 8);
  if (aiAssisted) score += 6;
  return Math.max(20, Math.min(98, score));
}
function getMarketDataStatus() {
  const mode = process.env.MARKET_DATA_MODE || (process.env.MARKET_DATA_SOURCES ? "aggregate" : process.env.MARKET_DATA_ENDPOINT ? "manual" : process.env.APIFY_TOKEN ? "apify" : "mock");
  const configuredSources = getConfiguredSources(mode);
  return {
    mode,
    configured: mode === "manual" ? Boolean(process.env.MARKET_DATA_ENDPOINT || process.env.MARKET_DATA_ENDPOINTS) : mode === "apify" ? Boolean(process.env.APIFY_TOKEN && process.env.APIFY_EBAY_SOLD_ACTOR_ID) : mode === "feed" ? Boolean(process.env.MARKET_DATA_FEED_URL || process.env.MARKET_DATA_FEED_URL_TEMPLATE) : mode === "csv" ? Boolean(process.env.MARKET_DATA_CSV_PATH || process.env.MARKET_DATA_CSV_URL_TEMPLATE) : mode === "aggregate" ? configuredSources.some((item) => ["manual", "feed", "csv", "apify"].includes(item)) : true,
    providerLabel: mode === "aggregate" ? "Multi-Source Trade Aggregator" : mode === "apify" ? "Apify eBay Sold Actor" : mode === "manual" ? "Manual Market Bridge" : mode === "feed" ? "JSON Feed Market Bridge" : mode === "csv" ? "CSV / Export Import" : "Mock History",
    supportedSources: [
      "\u81EA\u5B9A\u4E49 Bridge \u63A5\u53E3\uFF08\u95F2\u9C7C / \u5361\u6DD8 / \u5185\u90E8\u805A\u5408\uFF09",
      "Apify eBay Sold Actor",
      "JSON Feed / Serverless \u805A\u5408\u63A5\u53E3",
      "CSV \u5BFC\u5165\uFF08130point / \u624B\u5DE5\u6574\u7406 / \u5BFC\u51FA\u6570\u636E\uFF09",
      "\u5E73\u53F0\u5386\u53F2\u6210\u4EA4\u56DE\u9000",
      "\u5185\u7F6E AI \u6807\u9898\u6E05\u6D17\u4E0E\u9519\u5361\u8FC7\u6EE4"
    ],
    configuredSources,
    note: mode === "aggregate" ? "\u805A\u5408\u591A\u4E2A\u5916\u90E8\u6765\u6E90\uFF0C\u81EA\u52A8\u53BB\u91CD\u3001\u8FC7\u6EE4\u5F02\u5E38\u503C\uFF0C\u5E76\u7528 AI \u505A\u6807\u9898\u6807\u51C6\u5316\u4E0E\u9519\u5361\u8FC7\u6EE4\u3002" : mode === "apify" ? "\u901A\u8FC7 Apify Actor \u62C9\u53D6\u5916\u90E8\u6210\u4EA4\u6570\u636E\uFF0C\u5E76\u7531 AI \u534F\u52A9\u6E05\u6D17\u5339\u914D\u7ED3\u679C\u3002" : mode === "manual" ? "\u901A\u8FC7\u81EA\u5B9A\u4E49\u6865\u63A5\u63A5\u53E3\u83B7\u53D6\u5916\u90E8\u5E73\u53F0\u6570\u636E\uFF1B\u9002\u5408\u63A5\u5361\u6DD8\u3001\u95F2\u9C7C\u6216\u5185\u90E8\u805A\u5408\u670D\u52A1\u3002" : mode === "feed" ? "\u901A\u8FC7 JSON Feed \u83B7\u53D6\u5916\u90E8\u6210\u4EA4\uFF0C\u9002\u5408\u81EA\u5EFA Worker / Edge \u6293\u53D6\u670D\u52A1\u3002" : mode === "csv" ? "\u901A\u8FC7\u672C\u5730\u6216\u8FDC\u7A0B CSV \u5BFC\u5165\u6210\u4EA4\u8BB0\u5F55\uFF0C\u9002\u5408\u4EBA\u5DE5\u6574\u7406\u7684\u6210\u4EA4\u6837\u672C\u3002" : "\u5F53\u524D\u4F7F\u7528\u672C\u5730\u5386\u53F2\u6210\u4EA4\u6A21\u62DF\u6570\u636E\uFF0C\u53EF\u5207\u6362\u5230 aggregate / manual / apify / feed / csv\u3002"
  };
}
async function lookupCardMarketData(card) {
  const status = getMarketDataStatus();
  const sources = getConfiguredSources(status.mode);
  try {
    const allFetched = await Promise.allSettled(
      sources.map(async (source) => {
        if (source === "manual") return fetchManualEndpoints(card);
        if (source === "apify") return fetchApifyItems(card);
        if (source === "feed") return fetchFeedEndpoint(card);
        if (source === "csv") return fetchCsvSource(card);
        return [];
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
        note: `${status.note} \u5F53\u524D\u56DE\u9000\u4E3A\u5E73\u53F0\u5386\u53F2\u6210\u4EA4\u6570\u636E\u3002`,
        sourceBreakdown: buildSourceBreakdown(recentSales),
        qualityScore: buildQualityScore(recentSales, ["mock-history"], 0, false),
        totalFetched: recentSales.length,
        filteredOutliers: 0,
        usedSources: ["mock-history"],
        aiAssisted: false
      };
    }
    const sourceBreakdown = buildSourceBreakdown(recentSales);
    const usedSources = sourceBreakdown.map((item) => item.source);
    return {
      provider: status.providerLabel,
      mode: status.mode,
      configured: status.configured,
      recentSales,
      note: aiReviewed.aiAssisted ? `${status.note} \u5DF2\u542F\u7528\u5185\u7F6E AI \u505A\u6210\u4EA4\u6807\u9898\u6807\u51C6\u5316\u4E0E\u9519\u5361\u8FC7\u6EE4\u3002` : status.note,
      sourceBreakdown,
      qualityScore: buildQualityScore(recentSales, usedSources, outliers, aiReviewed.aiAssisted),
      totalFetched,
      filteredOutliers: outliers,
      usedSources,
      aiAssisted: aiReviewed.aiAssisted
    };
  } catch (error) {
    const history = await fallbackFromHistory(card.id);
    return {
      provider: status.providerLabel,
      mode: status.mode,
      configured: status.configured,
      recentSales: history,
      note: `${status.note} \u5916\u90E8\u63A5\u53E3\u8C03\u7528\u5931\u8D25\uFF0C\u5DF2\u56DE\u9000\u5230\u5E73\u53F0\u5386\u53F2\u6570\u636E\uFF1A${error.message}`,
      sourceBreakdown: buildSourceBreakdown(history),
      qualityScore: buildQualityScore(history, ["mock-history"], 0, false),
      totalFetched: history.length,
      filteredOutliers: 0,
      usedSources: ["mock-history"],
      aiAssisted: false
    };
  }
}

// server/marketDataRouter.ts
var marketDataRouter = router({
  status: publicProcedure.query(async () => getMarketDataStatus()),
  lookupByCard: publicProcedure.input(z3.object({ cardId: z3.number() })).query(async ({ input }) => {
    const card = await getCardById(input.cardId);
    if (!card) throw new Error("Card not found");
    return lookupCardMarketData(card);
  })
});

// server/cardAnalysisService.ts
var analysisCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 1e3 * 60 * 10;
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function buildCacheKey(card, history) {
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
    historyCount: history.length
  });
}
function computeMetrics(card, history) {
  const prices = history.map((item) => Number(item.price || 0)).filter(Boolean);
  const last30Average = prices.length > 0 ? average(prices) : Number(card.avgPrice30d || card.currentPrice || 0);
  const currentPrice = Number(card.currentPrice || 0);
  const priceChange7d = Number(card.priceChange7d || 0);
  const performanceScore = Number(card.dealScore || 0);
  const population = Number(card.population || 250);
  const valuation = clamp(Math.round(70 + (last30Average - currentPrice) / Math.max(last30Average || 1, 1) * 100 + (performanceScore - 70) * 0.3), 35, 96);
  const momentum = clamp(Math.round(55 + priceChange7d * 3 + (prices.length >= 5 ? 6 : 0)), 20, 95);
  const rarity = clamp(Math.round(85 - Math.min(population, 1e3) / 20), 25, 95);
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
    population
  };
}
function buildFallback(card, history, intelligence) {
  const metrics = computeMetrics(card, history);
  const intelligenceBoost = intelligence ? intelligence.compositeScore * 0.35 : 0;
  const overall = average([metrics.valuation, metrics.momentum, metrics.rarity, metrics.liquidity, metrics.performanceScore || 70, intelligenceBoost || 65]);
  const signal = overall >= 78 ? "BUY" : overall >= 62 ? "HOLD" : "WAIT";
  const riskLevel = metrics.momentum < 45 || metrics.liquidity < 45 ? "High" : overall >= 80 ? "Low" : "Medium";
  const downside = metrics.currentPrice * (riskLevel === "High" ? 0.88 : 0.93);
  const shortTermTarget = Number((metrics.currentPrice * (signal === "BUY" ? 1.12 : signal === "HOLD" ? 1.06 : 1.02)).toFixed(2));
  const longTermTarget = Number((metrics.currentPrice * (signal === "BUY" ? 1.28 : signal === "HOLD" ? 1.18 : 1.08)).toFixed(2));
  const summary = `${card.playerName} \u8FD9\u5F20 ${card.year} ${card.brand} ${card.set} \u5F53\u524D\u66F4\u50CF\u4E00\u5F20${signal === "BUY" ? "\u53EF\u79EF\u6781\u7814\u7A76\u7684\u8FDB\u653B\u578B\u8D44\u4EA7" : signal === "HOLD" ? "\u9002\u5408\u7EE7\u7EED\u8DDF\u8E2A\u7684\u5E73\u8861\u578B\u8D44\u4EA7" : "\u9700\u8981\u7B49\u5F85\u786E\u8BA4\u4FE1\u53F7\u7684\u89C2\u5BDF\u578B\u8D44\u4EA7"}\u3002\u73B0\u4EF7 $${metrics.currentPrice.toFixed(2)}\uFF0C\u76F8\u5BF9\u8FD1 30 \u5929\u5747\u4EF7 ${metrics.last30Average.toFixed(2)} ${metrics.currentPrice < metrics.last30Average ? "\u5B58\u5728\u4E00\u5B9A\u6298\u4EF7" : "\u5DF2\u7ECF\u63A5\u8FD1\u6216\u8D85\u8FC7\u5747\u4EF7"}\uFF0C\u77ED\u671F\u6CE2\u52A8 ${metrics.priceChange7d >= 0 ? "\u504F\u5F3A" : "\u504F\u5F31"}\u3002`;
  return {
    summary,
    signal,
    confidence: clamp(Math.round(overall), 58, 94),
    shortTermTarget,
    longTermTarget,
    riskLevel,
    thesis: [
      `\u4F30\u503C\u5206 ${metrics.valuation}\uFF0C\u5F53\u524D\u4EF7\u4E0E 30 \u65E5\u5747\u4EF7\u76F8\u6BD4${metrics.currentPrice < metrics.last30Average ? "\u4ECD\u6709\u6298\u4EF7\u7A7A\u95F4" : "\u5DF2\u4E0D\u7B97\u4FBF\u5B9C"}\u3002`,
      `\u52A8\u91CF\u5206 ${metrics.momentum}\uFF0C\u8FD1 7 \u65E5${metrics.priceChange7d >= 0 ? "\u5EF6\u7EED\u4E0A\u884C" : "\u4ECD\u5728\u56DE\u64A4"}\u3002`,
      `\u7A00\u7F3A\u5EA6\u5206 ${metrics.rarity}\uFF0C\u4EBA\u53E3\u62A5\u544A ${metrics.population}\uFF0C${metrics.population < 100 ? "\u4F9B\u7ED9\u504F\u7D27" : "\u4F9B\u7ED9\u4E2D\u7B49"}\u3002`
    ],
    catalysts: [
      `\u5982\u679C\u7403\u5458\u70ED\u5EA6\u548C\u8D5B\u573A\u8868\u73B0\u7EE7\u7EED\u63D0\u5347\uFF0C\u77ED\u671F\u76EE\u6807\u53EF\u770B\u5411 $${shortTermTarget.toFixed(2)}\u3002`,
      `\u82E5\u51FA\u73B0\u91CD\u8981\u8D5B\u4E8B\u3001\u5956\u9879\u6216\u5B63\u540E\u8D5B\u7A97\u53E3\uFF0C\u5361\u4EF7\u5F39\u6027\u901A\u5E38\u4F1A\u589E\u5F3A\u3002`,
      `\u9AD8\u8BC4\u7EA7\u4E0E\u4E3B\u6D41\u54C1\u724C\u5728\u5E02\u573A\u60C5\u7EEA\u56DE\u6696\u65F6\u66F4\u5BB9\u6613\u83B7\u5F97\u6D41\u52A8\u6027\u6EA2\u4EF7\u3002`,
      ...intelligence ? [`\u667A\u80FD\u4FE1\u53F7\u5F15\u64CE\u5F53\u524D\u7ED9\u51FA ${intelligence.trend} \u5224\u65AD\uFF0C\u7EFC\u5408\u5206 ${intelligence.compositeScore}\u3002`] : []
    ],
    risks: [
      `\u82E5\u8DCC\u7834 $${downside.toFixed(2)} \u9644\u8FD1\uFF0C\u77ED\u671F\u8D8B\u52BF\u53EF\u80FD\u7EE7\u7EED\u8F6C\u5F31\u3002`,
      `${metrics.liquidity < 50 ? "\u5F53\u524D\u6210\u4EA4\u6837\u672C\u8F83\u5C11\uFF0C\u6D41\u52A8\u6027\u98CE\u9669\u504F\u9AD8\u3002" : "\u6D41\u52A8\u6027\u5C1A\u53EF\uFF0C\u4F46\u4ECD\u9700\u5173\u6CE8\u6210\u4EA4\u5BC6\u5EA6\u53D8\u5316\u3002"}`,
      `${riskLevel === "High" ? "\u66F4\u9002\u5408\u5206\u6279\u8BD5\u4ED3\uFF0C\u4E0D\u5B9C\u91CD\u4ED3\u8FFD\u9AD8\u3002" : "\u6CE8\u610F\u4E8B\u4EF6\u9A71\u52A8\u7ED3\u675F\u540E\u7684\u60C5\u7EEA\u56DE\u843D\u3002"}`,
      ...intelligence?.offCourt.headlines?.some((item) => item.sentiment < 0) ? ["\u8FD1\u671F\u573A\u5916\u8206\u60C5\u5B58\u5728\u8D1F\u9762\u9879\uFF0C\u9700\u8B66\u60D5\u7A81\u53D1\u4E8B\u4EF6\u653E\u5927\u6CE2\u52A8\u3002"] : []
    ],
    actionPlan: [
      signal === "BUY" ? `\u53EF\u8003\u8651\u5206\u4E24\u5230\u4E09\u7B14\u5728 $${metrics.currentPrice.toFixed(2)} \u9644\u8FD1\u9010\u6B65\u5EFA\u4ED3\u3002` : signal === "HOLD" ? `\u5EFA\u8BAE\u7EE7\u7EED\u6301\u6709\uFF0C\u5E76\u89C2\u5BDF\u662F\u5426\u6709\u6548\u7A81\u7834 $${shortTermTarget.toFixed(2)}\u3002` : `\u4F18\u5148\u7B49\u5F85\u4EF7\u683C\u548C\u6210\u4EA4\u91CF\u4F01\u7A33\uFF0C\u518D\u8003\u8651\u4ECB\u5165\u3002`,
      `\u5C06\u76EE\u6807\u4EF7\u8BBE\u5728 $${shortTermTarget.toFixed(2)} / $${longTermTarget.toFixed(2)} \u4E24\u7EA7\u3002`,
      `\u82E5\u57FA\u672C\u9762\u6216\u4EF7\u683C\u7ED3\u6784\u6076\u5316\uFF0C\u91CD\u65B0\u8BC4\u4F30\u4ED3\u4F4D\u4E0E\u6B62\u635F\u7EAA\u5F8B\u3002`
    ],
    factorScores: {
      valuation: metrics.valuation,
      momentum: metrics.momentum,
      rarity: metrics.rarity,
      liquidity: metrics.liquidity
    },
    reasoning: {
      valuation: `\u5F53\u524D\u4EF7 $${metrics.currentPrice.toFixed(2)}\uFF0C30 \u65E5\u5747\u4EF7 $${metrics.last30Average.toFixed(2)}\u3002`,
      momentum: `\u8FD1 7 \u65E5\u53D8\u52A8 ${metrics.priceChange7d >= 0 ? "+" : ""}${metrics.priceChange7d.toFixed(1)}%\u3002`,
      rarity: `\u4EBA\u53E3\u62A5\u544A ${metrics.population}\uFF0C\u8BC4\u7EA7\u4E0E\u5E73\u884C\u7248\u672C\u51B3\u5B9A\u7A00\u7F3A\u6027\u3002`,
      liquidity: `\u6700\u8FD1\u7EB3\u5165\u5206\u6790\u7684\u6210\u4EA4\u6837\u672C ${history.length} \u6761\u3002`
    }
  };
}
async function buildLlmAnalysis(card, history, intelligence) {
  const metrics = computeMetrics(card, history);
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "\u4F60\u662F\u8D44\u6DF1\u7403\u661F\u5361\u4E8C\u7EA7\u5E02\u573A\u7814\u7A76\u5458\u3002\u8BF7\u6839\u636E\u8F93\u5165\u6570\u636E\u751F\u6210\u4E13\u4E1A\u3001\u514B\u5236\u3001\u7ED3\u6784\u5316\u7684\u4E2D\u6587\u6295\u8D44\u5206\u6790\uFF0C\u4E0D\u8981\u5938\u5927\u6536\u76CA\uFF0C\u4E0D\u8981\u7F16\u9020\u4E0D\u5B58\u5728\u7684\u4FE1\u606F\u3002"
      },
      {
        role: "user",
        content: `\u8BF7\u5206\u6790\u8FD9\u5F20\u7403\u661F\u5361\uFF0C\u5E76\u8F93\u51FA\u7ED3\u6784\u5316 JSON\u3002
\u7403\u5458\uFF1A${card.playerName}
\u5361\u7247\uFF1A${card.year} ${card.brand} ${card.set} ${card.parallel || "Base"} ${card.grade || "RAW"}
\u5F53\u524D\u4EF7\uFF1A$${metrics.currentPrice.toFixed(2)}
30\u65E5\u5747\u4EF7\uFF1A$${metrics.last30Average.toFixed(2)}
7\u65E5\u53D8\u5316\uFF1A${metrics.priceChange7d.toFixed(1)}%
\u4EF7\u503C\u8BC4\u5206\uFF1A${Number(card.dealScore || 0).toFixed(1)}
\u4EBA\u53E3\u62A5\u544A\uFF1A${metrics.population}
\u6837\u672C\u6210\u4EA4\u6570\uFF1A${history.length}
\u667A\u80FD\u4FE1\u53F7\uFF1A${intelligence ? `${intelligence.trend} / \u7EFC\u5408\u5206 ${intelligence.compositeScore} / \u7F6E\u4FE1\u5EA6 ${intelligence.confidence}` : "\u6682\u65E0"}
\u8D5B\u573A\u4FE1\u53F7\uFF1A${intelligence ? intelligence.onCourt.details.join("\uFF1B") : "\u6682\u65E0"}
\u573A\u5916\u4FE1\u53F7\uFF1A${intelligence ? intelligence.offCourt.details.join("\uFF1B") : "\u6682\u65E0"}
\u5E02\u573A\u4FE1\u53F7\uFF1A${intelligence ? intelligence.market.details.join("\uFF1B") : "\u6682\u65E0"}`
      }
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
              liquidity: { type: "number" }
            },
            required: ["valuation", "momentum", "rarity", "liquidity"]
          },
          reasoning: {
            type: "object",
            additionalProperties: false,
            properties: {
              valuation: { type: "string" },
              momentum: { type: "string" },
              rarity: { type: "string" },
              liquidity: { type: "string" }
            },
            required: ["valuation", "momentum", "rarity", "liquidity"]
          }
        },
        required: ["summary", "signal", "confidence", "shortTermTarget", "longTermTarget", "riskLevel", "thesis", "catalysts", "risks", "actionPlan", "factorScores", "reasoning"]
      }
    }
  });
  const content = response.choices[0]?.message?.content;
  const text2 = typeof content === "string" ? content : Array.isArray(content) ? content.map((item) => item.text || "").join("") : "";
  if (!text2) return null;
  const parsed = JSON.parse(text2);
  parsed.confidence = clamp(Number(parsed.confidence || 0), 55, 98);
  parsed.shortTermTarget = Number(Number(parsed.shortTermTarget).toFixed(2));
  parsed.longTermTarget = Number(Number(parsed.longTermTarget).toFixed(2));
  return parsed;
}
async function analyzeCardTrend({ card, history, intelligence }) {
  const cacheKey = buildCacheKey(card, history);
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  let result;
  try {
    result = await buildLlmAnalysis(card, history, intelligence) || buildFallback(card, history, intelligence);
  } catch {
    result = buildFallback(card, history, intelligence);
  }
  analysisCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result
  });
  return result;
}

// server/signalIntelligenceService.ts
init_db();

// server/signalConfigService.ts
var DEFAULT_SIGNAL_WEIGHTS = {
  onCourt: 42,
  offCourt: 18,
  market: 40
};
var currentWeights = { ...DEFAULT_SIGNAL_WEIGHTS };
function clamp2(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeSignalWeights(weights) {
  const safe = {
    onCourt: clamp2(Number(weights.onCourt || 0), 0, 100),
    offCourt: clamp2(Number(weights.offCourt || 0), 0, 100),
    market: clamp2(Number(weights.market || 0), 0, 100)
  };
  const total = safe.onCourt + safe.offCourt + safe.market;
  if (total <= 0) {
    return { ...DEFAULT_SIGNAL_WEIGHTS };
  }
  return {
    onCourt: Number((safe.onCourt / total * 100).toFixed(1)),
    offCourt: Number((safe.offCourt / total * 100).toFixed(1)),
    market: Number((safe.market / total * 100).toFixed(1))
  };
}
function buildSummary(weights) {
  const entries = [
    { key: "\u8D5B\u573A", value: weights.onCourt },
    { key: "\u573A\u5916", value: weights.offCourt },
    { key: "\u5E02\u573A", value: weights.market }
  ].sort((a, b) => b.value - a.value);
  return `\u5F53\u524D AI \u5206\u6790\u6743\u91CD\uFF1A${entries[0].key} ${entries[0].value}% \u4E3A\u4E3B\uFF0C${entries[1].key} ${entries[1].value}% \u6B21\u4E4B\uFF0C${entries[2].key} ${entries[2].value}% \u8F85\u52A9\u786E\u8BA4\u3002`;
}
function getSignalSettings() {
  const normalizedWeights = normalizeSignalWeights(currentWeights);
  return {
    weights: { ...currentWeights },
    normalizedWeights,
    summary: buildSummary(normalizedWeights)
  };
}
function getSignalWeights() {
  return getSignalSettings().normalizedWeights;
}
function updateSignalSettings(weights) {
  currentWeights = {
    onCourt: clamp2(Number(weights.onCourt || 0), 0, 100),
    offCourt: clamp2(Number(weights.offCourt || 0), 0, 100),
    market: clamp2(Number(weights.market || 0), 0, 100)
  };
  return getSignalSettings();
}
function resetSignalSettings() {
  currentWeights = { ...DEFAULT_SIGNAL_WEIGHTS };
  return getSignalSettings();
}

// server/signalIntelligenceService.ts
init_sportsDataService();
var POSITIVE_KEYWORDS = ["mvp", "all-star", "record", "career high", "return", "extension", "win", "\u51A0\u519B", "\u590D\u51FA", "\u521B\u7EAA\u5F55", "\u7EED\u7EA6", "\u5165\u9009", "\u6700\u4F73"];
var NEGATIVE_KEYWORDS = ["injury", "out", "suspended", "controversy", "trade rumor", "miss", "hurt", "\u4F24\u75C5", "\u505C\u8D5B", "\u4E89\u8BAE", "\u4F20\u95FB", "\u7F3A\u9635"];
function clamp3(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function calculateCompositeSignalScore(input, weights = getSignalWeights()) {
  const compositeScore = clamp3(
    Math.round(
      input.onCourt * (weights.onCourt / 100) + input.offCourt * (weights.offCourt / 100) + input.market * (weights.market / 100)
    ),
    20,
    97
  );
  const trend = compositeScore >= 76 ? "bullish" : compositeScore <= 52 ? "bearish" : "neutral";
  return { compositeScore, trend, weights };
}
function scoreHeadline(title) {
  const lower = title.toLowerCase();
  let score = 0;
  for (const word of POSITIVE_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) score += 1;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) score -= 1;
  }
  return clamp3(score * 20, -100, 100);
}
function parseRssHeadlines(xml) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => match[1]);
  return items.slice(0, 8).map((item) => {
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.slice(1).find(Boolean)?.trim() || "Untitled";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || null;
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || null;
    return {
      title,
      url: link,
      publishedAt: pubDate,
      sentiment: scoreHeadline(title)
    };
  });
}
async function fetchOffCourtSignals(playerName, sport) {
  const endpoint = process.env.NEWS_SIGNAL_ENDPOINT;
  const rssTemplate = process.env.NEWS_SIGNAL_RSS_TEMPLATE;
  try {
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...process.env.NEWS_SIGNAL_TOKEN ? { Authorization: `Bearer ${process.env.NEWS_SIGNAL_TOKEN}` } : {}
        },
        body: JSON.stringify({ playerName, sport, limit: 8 })
      });
      if (response.ok) {
        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
        const headlines = items.slice(0, 8).map((item) => ({
          title: item.title || item.headline || "Untitled",
          url: item.url || item.link || null,
          publishedAt: item.publishedAt || item.date || null,
          sentiment: typeof item.sentiment === "number" ? item.sentiment : scoreHeadline(item.title || item.headline || "")
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
  return [];
}
async function computeOnCourtScore(card) {
  const player = await getPlayerById(card.playerId);
  const externalId = Number(player?.externalId || 0);
  const scoreFromCard = Number(player?.performanceScore ?? 50);
  if (!externalId || card.sport !== "NBA") {
    return {
      score: clamp3(scoreFromCard, 30, 95),
      trend: scoreFromCard >= 80 ? "\u7ADE\u6280\u72B6\u6001\u5F3A\u52BF" : scoreFromCard >= 65 ? "\u7ADE\u6280\u72B6\u6001\u5E73\u7A33" : "\u7ADE\u6280\u72B6\u6001\u4E00\u822C",
      details: [
        `\u5F53\u524D\u8868\u73B0\u8BC4\u5206 ${scoreFromCard.toFixed(1)} / 100\u3002`,
        `\u975E NBA \u6216\u7F3A\u5C11\u5916\u90E8 ID \u65F6\uFF0C\u4F7F\u7528\u5E73\u53F0\u7403\u5458\u8868\u73B0\u8BC4\u5206\u4F5C\u4E3A\u8D5B\u573A\u4FE1\u53F7\u3002`
      ]
    };
  }
  const stats = await fetchPlayerStats(externalId, 2024);
  if (stats.length === 0) {
    return {
      score: clamp3(scoreFromCard, 30, 95),
      trend: "\u8FD1\u671F\u6BD4\u8D5B\u6837\u672C\u4E0D\u8DB3",
      details: [`\u672A\u6293\u5230\u5B9E\u65F6\u6BD4\u8D5B\u6570\u636E\uFF0C\u56DE\u9000\u4F7F\u7528\u5E73\u53F0\u8868\u73B0\u8BC4\u5206 ${scoreFromCard.toFixed(1)}\u3002`]
    };
  }
  const recent = stats.slice(0, 5);
  const previous = stats.slice(5, 10);
  const recentPerf = calculatePerformanceScore(recent).score;
  const prevPerf = previous.length > 0 ? calculatePerformanceScore(previous).score : recentPerf;
  const delta = recentPerf - prevPerf;
  const score = clamp3(Math.round(recentPerf + delta * 0.6), 25, 98);
  return {
    score,
    trend: delta > 6 ? "\u8D5B\u573A\u8868\u73B0\u52A0\u901F\u4E0A\u884C" : delta < -6 ? "\u8D5B\u573A\u8868\u73B0\u8D70\u5F31" : "\u8D5B\u573A\u8868\u73B0\u7A33\u5B9A",
    details: [
      `\u8FD1 5 \u573A\u8868\u73B0\u8BC4\u5206 ${recentPerf.toFixed(1)}\uFF0C\u6B64\u524D\u533A\u95F4 ${prevPerf.toFixed(1)}\u3002`,
      `\u6700\u8FD1 5 \u573A\u573A\u5747 ${avg(recent.map((item) => Number(item.pts || 0))).toFixed(1)} \u5206\u3001${avg(recent.map((item) => Number(item.reb || 0))).toFixed(1)} \u677F\u3001${avg(recent.map((item) => Number(item.ast || 0))).toFixed(1)} \u52A9\u3002`
    ]
  };
}
async function computeMarketScore(card) {
  const history = await getPriceHistory(card.id, 45);
  const prices = history.map((item) => Number(item.price || 0));
  const averagePrice = prices.length > 0 ? avg(prices) : Number(card.avgPrice30d || card.currentPrice || 0);
  const currentPrice = Number(card.currentPrice || 0);
  const change7d = Number(card.priceChange7d || 0);
  const marketData = await lookupCardMarketData(card);
  const externalPrices = marketData.recentSales.map((item) => Number(item.price || 0)).filter(Boolean);
  const externalAverage = externalPrices.length > 0 ? avg(externalPrices) : averagePrice;
  let score = 55;
  score += (externalAverage - currentPrice) / Math.max(externalAverage || 1, 1) * 100;
  score += change7d * 2;
  score += Math.min(history.length, 12);
  score = clamp3(Math.round(score), 20, 96);
  return {
    score,
    trend: score >= 78 ? "\u5E02\u573A\u7ED3\u6784\u504F\u5F3A" : score >= 60 ? "\u5E02\u573A\u7ED3\u6784\u4E2D\u6027" : "\u5E02\u573A\u7ED3\u6784\u504F\u5F31",
    details: [
      `\u5F53\u524D\u4EF7 $${currentPrice.toFixed(2)}\uFF0C\u5E73\u53F0\u5747\u4EF7\u7EA6 $${averagePrice.toFixed(2)}\uFF0C\u5916\u90E8\u6210\u4EA4\u5747\u4EF7\u7EA6 $${externalAverage.toFixed(2)}\u3002`,
      `\u8FD1 7 \u65E5\u4EF7\u683C\u53D8\u5316 ${change7d >= 0 ? "+" : ""}${change7d.toFixed(1)}%\uFF0C\u6700\u8FD1\u6837\u672C ${history.length} \u6761\u3002`,
      `\u5916\u90E8\u884C\u60C5\u6765\u6E90\uFF1A${marketData.provider}\uFF08${marketData.mode}\uFF09`
    ]
  };
}
async function getCardTrendIntelligence(cardId) {
  const cardRaw = await getCardById(cardId);
  if (!cardRaw) throw new Error("Card not found");
  const card = cardRaw;
  const [onCourt, headlines, market] = await Promise.all([
    computeOnCourtScore(card),
    fetchOffCourtSignals(card.playerName, card.sport),
    computeMarketScore(card)
  ]);
  const offCourtScore = headlines.length > 0 ? clamp3(Math.round(55 + avg(headlines.map((item) => item.sentiment)) * 0.35), 20, 95) : 52;
  const weights = getSignalWeights();
  const offCourt = {
    score: offCourtScore,
    trend: offCourtScore >= 70 ? "\u573A\u5916\u8206\u8BBA\u504F\u6B63\u9762" : offCourtScore <= 40 ? "\u573A\u5916\u8206\u8BBA\u504F\u8D1F\u9762" : "\u573A\u5916\u8206\u8BBA\u4E2D\u6027",
    headlines,
    details: headlines.length > 0 ? [`\u6700\u8FD1\u6293\u53D6 ${headlines.length} \u6761\u573A\u5916\u52A8\u6001\uFF0C\u5E73\u5747\u60C5\u7EEA\u5206 ${offCourtScore}\u3002`, `\u5F53\u524D\u573A\u5916\u6743\u91CD ${weights.offCourt}%\u3002`] : ["\u5F53\u524D\u672A\u914D\u7F6E\u65B0\u95FB\u6E90\u6216\u672A\u6293\u5230\u6709\u6548\u573A\u5916\u52A8\u6001\u3002", `\u5F53\u524D\u573A\u5916\u6743\u91CD ${weights.offCourt}%\u3002`]
  };
  const { compositeScore, trend } = calculateCompositeSignalScore({
    onCourt: onCourt.score,
    offCourt: offCourt.score,
    market: market.score
  }, weights);
  const confidence = clamp3(Math.round(58 + Math.abs(onCourt.score - market.score) * -0.15 + (headlines.length > 0 ? 8 : 0) + Math.min(10, market.score / 12)), 52, 95);
  const summary = trend === "bullish" ? `${card.playerName} \u5F53\u524D\u5448\u73B0\u504F\u591A\u8D70\u52BF\uFF1A\u8D5B\u573A\u8868\u73B0\u4E0E\u5E02\u573A\u7ED3\u6784\u540C\u6B65\u504F\u5F3A${headlines.length > 0 ? "\uFF0C\u573A\u5916\u4FE1\u606F\u9762\u4E5F\u63D0\u4F9B\u652F\u6301" : ""}\u3002` : trend === "bearish" ? `${card.playerName} \u5F53\u524D\u5448\u73B0\u504F\u5F31\u8D70\u52BF\uFF1A\u4EF7\u683C\u7ED3\u6784\u6216\u8D5B\u573A\u8868\u73B0\u5B58\u5728\u538B\u529B\uFF0C\u5EFA\u8BAE\u63A7\u5236\u8282\u594F\u3002` : `${card.playerName} \u5F53\u524D\u8D70\u52BF\u504F\u4E2D\u6027\uFF0C\u5EFA\u8BAE\u7EE7\u7EED\u8DDF\u8E2A\u8D5B\u573A\u50AC\u5316\u4E0E\u5916\u90E8\u6210\u4EA4\u786E\u8BA4\u3002`;
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
      details: [...onCourt.details, `\u5F53\u524D\u8D5B\u573A\u6743\u91CD ${weights.onCourt}%\u3002`]
    },
    offCourt,
    market: {
      ...market,
      details: [...market.details, `\u5F53\u524D\u5E02\u573A\u6743\u91CD ${weights.market}%\u3002`]
    }
  };
}

// server/marketIntelligenceService.ts
init_db();
function resolveHistoryOffset(window) {
  if (window === "7D") return 7;
  if (window === "30D") return 30;
  return 1;
}
function normalizeItem(card, intelligence) {
  return {
    cardId: card.id,
    playerName: card.playerName,
    sport: card.sport,
    title: `${card.year || ""} ${card.brand || ""} ${card.set || ""} ${card.parallel || "Base"}`.trim(),
    currentPrice: Number(card.currentPrice || 0),
    trend: intelligence.trend,
    confidence: intelligence.confidence,
    compositeScore: intelligence.compositeScore,
    summary: intelligence.summary
  };
}
function buildMoverEventLabel(previousTrend, currentTrend, deltaScore) {
  if (previousTrend && previousTrend !== currentTrend) {
    return {
      eventLabel: `\u8D8B\u52BF\u53CD\u8F6C\uFF1A${previousTrend} \u2192 ${currentTrend}`,
      eventSeverity: "high"
    };
  }
  if (deltaScore >= 12) {
    return { eventLabel: "\u5F3A\u52BF\u62C9\u5347", eventSeverity: "high" };
  }
  if (deltaScore >= 6) {
    return { eventLabel: "\u7A33\u6B65\u8D70\u5F3A", eventSeverity: "medium" };
  }
  if (deltaScore <= -12) {
    return { eventLabel: "\u6025\u901F\u8F6C\u5F31", eventSeverity: "high" };
  }
  if (deltaScore <= -6) {
    return { eventLabel: "\u70ED\u5EA6\u56DE\u843D", eventSeverity: "medium" };
  }
  return { eventLabel: "\u7A84\u5E45\u6CE2\u52A8", eventSeverity: "low" };
}
async function buildMarketIntelligenceBoard(limit = 18) {
  const cards2 = await getAllCards(void 0, limit);
  const intelligences = await Promise.all(cards2.map(async (card) => ({
    card,
    intelligence: await getCardTrendIntelligence(card.id)
  })));
  const ranked = intelligences.map(({ card, intelligence }) => normalizeItem(card, intelligence)).sort((a, b) => b.compositeScore - a.compositeScore || b.confidence - a.confidence);
  return {
    scanned: ranked.length,
    bullish: ranked.filter((item) => item.trend === "bullish").slice(0, 6),
    bearish: ranked.filter((item) => item.trend === "bearish").sort((a, b) => a.compositeScore - b.compositeScore).slice(0, 6),
    neutral: ranked.filter((item) => item.trend === "neutral").slice(0, 6),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function buildTrendMoversBoard(limit = 20, historyOffset = 1) {
  const cards2 = await getAllCards(void 0, limit);
  const items = await Promise.all(cards2.map(async (card) => {
    const intelligence = await getCardTrendIntelligence(card.id);
    const history = await getTrendHistory(card.id, Math.max(historyOffset, 1) + 1);
    const previous = history[historyOffset - 1];
    const previousScore = previous ? Number(previous.compositeScore || 0) : void 0;
    const deltaScore = previousScore !== void 0 ? intelligence.compositeScore - previousScore : 0;
    return {
      ...normalizeItem(card, intelligence),
      deltaScore,
      previousScore,
      previousTrend: previous?.trend,
      ...buildMoverEventLabel(previous?.trend, intelligence.trend, deltaScore)
    };
  }));
  const sorted = items.sort((a, b) => b.deltaScore - a.deltaScore || b.compositeScore - a.compositeScore);
  return {
    risers: sorted.filter((item) => item.deltaScore > 0).slice(0, 8),
    fallers: [...sorted].reverse().filter((item) => item.deltaScore < 0).slice(0, 8)
  };
}
async function buildDailyTrendSummary(limit = 20, window = "24H") {
  const movers = await buildTrendMoversBoard(limit, resolveHistoryOffset(window));
  const topRiser = movers.risers[0];
  const topFaller = movers.fallers[0];
  const reversalCount = [...movers.risers, ...movers.fallers].filter((item) => item.eventLabel.includes("\u8D8B\u52BF\u53CD\u8F6C")).length;
  return {
    window,
    topRiser,
    topFaller,
    reversalCount,
    risersCount: movers.risers.length,
    fallersCount: movers.fallers.length,
    summary: `\u8D8B\u52BF\u6458\u8981\uFF08${window}\uFF09\uFF1A\u4E0A\u5347 ${movers.risers.length} \u5F20\uFF0C\u4E0B\u884C ${movers.fallers.length} \u5F20\uFF0C\u53CD\u8F6C ${reversalCount} \u5F20\u3002${topRiser ? `\u6700\u5F3A\u4E0A\u5347 ${topRiser.playerName}\uFF08+${topRiser.deltaScore}\uFF09` : ""}${topFaller ? `\uFF1B\u6700\u5927\u56DE\u843D ${topFaller.playerName}\uFF08${topFaller.deltaScore}\uFF09` : ""}`
  };
}

// server/boxIntelligenceService.ts
var manufacturers = [
  {
    manufacturer: "Panini",
    overview: "Panini \u4ECD\u7136\u662F\u7BEE\u7403\u5361\u6838\u5FC3\u5382\u5546\u4E4B\u4E00\uFF0C\u54C1\u724C\u5C42\u7EA7\u5B8C\u6574\uFF0C\u8986\u76D6\u5165\u95E8\u5230\u9AD8\u7AEF\u3002",
    positioning: ["Prizm / Select / Mosaic \u9002\u5408\u770B\u6D41\u52A8\u6027", "Court Kings / Noir \u504F\u5BA1\u7F8E\u548C\u4E2D\u9AD8\u7AEF", "Donruss / Choice \u9002\u5408\u8FFD\u65B0\u79C0\u548C\u5F69\u8679"],
    strengths: ["\u54C1\u724C\u77E9\u9635\u6210\u719F", "\u5E73\u884C\u548C\u7F16\u53F7\u4F53\u7CFB\u5B8C\u5584", "\u4E8C\u7EA7\u5E02\u573A\u6D41\u901A\u6027\u5F3A"],
    watchouts: ["\u540C\u7403\u5458\u540C\u5E74\u4EA7\u54C1\u8F83\u591A\uFF0C\u8D44\u91D1\u5BB9\u6613\u5206\u6563", "\u70ED\u95E8\u7CFB\u5217\u9AD8\u5CF0\u671F\u5C01\u8721\u4EF7\u6CE2\u52A8\u5927"]
  },
  {
    manufacturer: "Topps",
    overview: "Topps Chrome Basketball \u56DE\u5F52\u540E\uFF0CChrome \u98CE\u683C\u548C\u6298\u5C04\u7CFB\u91CD\u65B0\u5438\u5F15\u5927\u91CF\u5173\u6CE8\u3002",
    positioning: ["Chrome Hobby \u9002\u5408\u8FFD auto \u4E0E SSP", "Sapphire \u504F\u8D85\u9AD8\u7AEF\u5C55\u793A\u548C\u9650\u91CF", "NBL / OTE \u66F4\u504F\u9898\u6750\u4E0E\u6F5C\u529B"],
    strengths: ["Chrome \u5BA1\u7F8E\u7EDF\u4E00", "\u6298\u5C04\u5E73\u884C\u8BA4\u53EF\u5EA6\u9AD8", "\u5B98\u65B9 checklist / odds \u9875\u9762\u900F\u660E"],
    watchouts: ["\u65B0\u54C1\u521D\u671F\u4EF7\u683C\u6CE2\u52A8\u5927", "\u4E0D\u540C\u5B50\u7CFB\u5217\u5B9A\u4F4D\u5DEE\u5F02\u660E\u663E\uFF0C\u9700\u8981\u5206\u8FA8\u4E3B\u7EBF\u548C\u5206\u652F"]
  },
  {
    manufacturer: "Upper Deck",
    overview: "Upper Deck \u7BEE\u7403\u66F4\u591A\u51FA\u73B0\u5728\u6570\u5B57/\u5A31\u4E50\u5316\u4EA7\u54C1\u5F62\u6001\u548C\u7279\u6B8A\u6388\u6743\u573A\u666F\u4E2D\u3002",
    positioning: ["e-Pack \u9002\u5408\u4F4E\u6469\u64E6\u5C1D\u8BD5", "\u66F4\u504F\u6570\u5B57\u4F53\u9A8C\u3001\u6210\u5C31\u7CFB\u7EDF\u4E0E\u4EA4\u6613\u751F\u6001"],
    strengths: ["\u6570\u5B57\u5316\u4EA4\u4E92\u5F3A", "\u9002\u5408\u8F7B\u91CF\u4F53\u9A8C\u548C\u793E\u4EA4\u4EA4\u6613", "\u4E0D\u9700\u8981\u7EBF\u4E0B\u62C6\u76D2\u95E8\u69DB"],
    watchouts: ["NBA \u4E3B\u7EBF\u7EB8\u5361\u77E9\u9635\u4E0D\u5982 Panini/Topps \u5B8C\u6574", "\u66F4\u9002\u5408\u8865\u5145\u800C\u975E\u66FF\u4EE3\u4E3B\u6D41 Hobby \u76D2"]
  }
];
var products = [
  {
    id: "panini-court-kings-2024-25",
    manufacturer: "Panini",
    productLine: "Court Kings Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "\u504F\u827A\u672F\u5361\u9762\u548C\u5206\u5C42\u65B0\u79C0\u8BBE\u8BA1\u7684\u4E2D\u9AD8\u7AEF\u7BEE\u7403\u4EA7\u54C1\uFF0C\u9002\u5408\u559C\u6B22\u5BA1\u7F8E\u548C\u5206\u7EA7\u5C55\u793A\u7684\u73A9\u5BB6\u3002",
    whatToChase: ["\u65B0\u79C0\u5206\u7EA7\u5361", "\u7B7E\u5B57\u5361", "\u9AD8\u7AEF\u63D2\u5361", "\u4F4E\u7F16\u53F7\u5E73\u884C"],
    boxHits: ["\u91CD\u70B9\u770B\u65B0\u79C0\u5206\u5C42", "\u7B7E\u5B57\u4E0E\u4F4E\u7F16\u53F7\u66F4\u51B3\u5B9A\u957F\u671F\u4EF7\u503C", "\u4E0D\u9760\u5927\u91CF base \u83B7\u80DC"],
    strengths: ["\u98CE\u683C\u8FA8\u8BC6\u5EA6\u9AD8", "\u4F18\u8D28\u65B0\u79C0\u5361\u5E38\u6709\u72EC\u7ACB\u5BA1\u7F8E\u6EA2\u4EF7", "\u9002\u5408\u6536\u85CF\u4E0E\u4E2D\u671F\u6301\u6709"],
    risks: ["\u6D41\u52A8\u6027\u4E0D\u5982 Prizm/Select \u666E\u9002", "\u4EF7\u683C\u66F4\u4F9D\u8D56\u5177\u4F53\u7403\u5458\u548C\u753B\u98CE\u504F\u597D"],
    buyRating: "MEDIUM",
    audience: "\u559C\u6B22\u5BA1\u7F8E\u5361\u9762\u3001\u504F\u4E2D\u9AD8\u7AEF\u6536\u85CF\u7684\u73A9\u5BB6",
    sourceTitle: "Panini America Box Wars 2025",
    sourceUrl: "https://blog.paniniamerica.net/paninis-always-exciting-box-wars-returns-to-the-national/",
    note: "\u4F9D\u636E Panini 2025 NSCC Box Wars \u65E5\u7A0B\u53EF\u786E\u8BA4 2024-25 Court Kings Basketball Hobby \u4E3A\u5176\u91CD\u70B9\u6D3B\u52A8\u4EA7\u54C1\u4E4B\u4E00\uFF1B\u5177\u4F53\u7BB1\u914D\u5EFA\u8BAE\u4EE5\u6B63\u5F0F\u4EA7\u54C1\u9875/\u6E05\u5355\u4E3A\u51C6\u3002",
    brandKeywords: ["Panini"],
    setKeywords: ["Court Kings"],
    strategy: ["\u66F4\u9002\u5408\u6311\u753B\u98CE\u548C\u7A00\u6709\u65B0\u79C0\u5206\u5C42", "\u4E0D\u5EFA\u8BAE\u628A\u9884\u7B97\u5168\u538B\u5728 base\uFF0C\u4F18\u5148\u76EF\u4F4E\u7F16\u548C\u7B7E\u5B57", "\u9002\u5408\u4F5C\u4E3A\u6536\u85CF\u4ED3\u4F4D\uFF0C\u4E0D\u662F\u6700\u9AD8\u6D41\u52A8\u6027\u7684\u4EA4\u6613\u76D2"]
  },
  {
    id: "panini-mosaic-2024-25",
    manufacturer: "Panini",
    productLine: "Mosaic Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "\u89C6\u89C9\u51B2\u51FB\u5F3A\u3001\u63D2\u5361\u548C\u6298\u5C04\u4E30\u5BCC\uFF0C\u9002\u5408\u8FFD\u70ED\u70B9\u7403\u5458\u548C\u77ED\u4E2D\u7EBF\u4EA4\u6613\u3002",
    whatToChase: ["Genesis / case hit \u7C7B\u7A00\u6709\u5361", "Rookie parallels", "\u70ED\u95E8\u7403\u661F\u4F4E\u7F16"],
    boxHits: ["\u5F69\u8272\u5E73\u884C\u4E0E case hit \u662F\u6838\u5FC3", "\u65B0\u79C0\u548C\u8D85\u7EA7\u7403\u661F\u51B3\u5B9A\u6EA2\u4EF7\u5F39\u6027"],
    strengths: ["\u56FE\u50CF\u98CE\u683C\u5F3A", "\u8BDD\u9898\u5361\u8F83\u591A", "\u9002\u5408\u70ED\u70B9\u65F6\u671F\u64CD\u4F5C"],
    risks: ["\u4E0D\u540C\u7A00\u6709\u5EA6\u4EF7\u683C\u5206\u5C42\u5927", "\u666E\u901A base \u4E0E\u5E38\u89C1\u5E73\u884C\u627F\u63A5\u5F31"],
    buyRating: "MEDIUM",
    audience: "\u559C\u6B22\u8FFD\u70ED\u70B9\u3001\u8FFD case hit \u7684\u77ED\u4E2D\u7EBF\u73A9\u5BB6",
    sourceTitle: "Panini America Box Wars 2025",
    sourceUrl: "https://blog.paniniamerica.net/paninis-always-exciting-box-wars-returns-to-the-national/",
    note: "Panini \u5728 2025 Box Wars \u4E2D\u7EB3\u5165 2024-25 Mosaic Hobby Basketball\uFF0C\u8BF4\u660E\u5176\u4ECD\u662F\u6D3B\u8DC3\u4E3B\u7EBF\u4EA7\u54C1\u3002",
    brandKeywords: ["Panini"],
    setKeywords: ["Mosaic"],
    strategy: ["\u9002\u5408\u8FFD\u70ED\u95E8\u65B0\u79C0\u548C\u8BDD\u9898\u7403\u661F", "\u5F3A\u63D2\u5361\u548C\u7A00\u6709 case hit \u51B3\u5B9A\u4E0A\u9650", "\u66F4\u9002\u5408\u505A\u70ED\u5EA6\u4EA4\u6613\uFF0C\u4E0D\u9002\u5408\u53EA\u770B base"]
  },
  {
    id: "panini-select-2024-25",
    manufacturer: "Panini",
    productLine: "Select Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "\u5C42\u7EA7\u611F\u5F3A\u3001\u5206\u5C42 base \u4E0E\u5F69\u5E73\u4F53\u7CFB\u6210\u719F\uFF0C\u9002\u5408\u505A\u7403\u661F\u540C\u5E74\u591A\u5C42\u7EA7\u5E03\u5C40\u3002",
    whatToChase: ["Concourse / Premier / Courtside \u9AD8\u5C42\u7EA7\u65B0\u79C0", "\u4F4E\u7F16\u53F7 tie-dye / gold", "\u7B7E\u5B57\u5361"],
    boxHits: ["\u5C42\u7EA7 base + \u5E73\u884C\u4F53\u7CFB", "\u9AD8\u5C42\u7EA7\u7248\u672C\u66F4\u5BB9\u6613\u62C9\u5F00\u5DEE\u4EF7"],
    strengths: ["\u9002\u5408\u505A\u540C\u7403\u5458\u591A\u5C42\u7EA7\u6BD4\u8F83", "\u9AD8\u5C42\u7EA7\u5361\u8FA8\u8BC6\u5EA6\u5F3A", "\u6D41\u52A8\u6027\u4F18\u4E8E\u51B7\u95E8\u7CFB\u5217"],
    risks: ["\u5C42\u7EA7\u591A\u5BFC\u81F4\u65B0\u624B\u5224\u65AD\u6210\u672C\u9AD8", "\u9700\u8981\u7CBE\u51C6\u533A\u5206\u5C42\u7EA7\u4E0E\u5E73\u884C"],
    buyRating: "HIGH",
    audience: "\u61C2\u5C42\u7EA7\u4F53\u7CFB\u3001\u613F\u610F\u7CBE\u6311\u7248\u672C\u7684\u73A9\u5BB6",
    sourceTitle: "Panini America Box Wars 2025",
    sourceUrl: "https://blog.paniniamerica.net/paninis-always-exciting-box-wars-returns-to-the-national/",
    note: "Panini 2025 Box Wars \u660E\u786E\u5217\u51FA 2024-25 Select Basketball Hobby\uFF0C\u5C5E\u4E8E\u503C\u5F97\u6301\u7EED\u8DDF\u8E2A\u7684\u4E3B\u7EBF\u4EA7\u54C1\u3002",
    brandKeywords: ["Panini"],
    setKeywords: ["Select"],
    strategy: ["\u4F18\u5148\u5173\u6CE8 Courtside / Premier \u7B49\u9AD8\u5C42\u7EA7\u7248\u672C", "\u9002\u5408\u628A\u540C\u7403\u661F\u591A\u5C42\u7EA7\u5361\u505A\u7EB5\u5411\u6BD4\u8F83", "\u5982\u679C\u9884\u7B97\u6709\u9650\uFF0C\u4E70\u76D2\u4E0D\u5982\u76F4\u63A5\u4E70\u9AD8\u5C42\u7EA7\u5355\u5361"]
  },
  {
    id: "topps-chrome-2024-25",
    manufacturer: "Topps",
    productLine: "Topps Chrome Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "Topps Chrome Basketball \u4E3B\u7EBF\u56DE\u5F52\u4EA7\u54C1\uFF0C\u6298\u5C04\u4F53\u7CFB\u3001SSP \u548C autograph \u662F\u4EF7\u503C\u6838\u5FC3\u3002",
    whatToChase: ["2 autos per hobby box", "SSP case hits", "Radiating Rookies / Helix / Ultra Violet All-Stars", "\u70ED\u95E8\u65B0\u79C0 refractors"],
    boxHits: ["\u6BCF Hobby \u76D2 2 \u5F20 autographs", "8 cards per pack / 12 packs per box", "200-card base set + \u591A\u79CD SSP inserts"],
    strengths: ["\u5B98\u65B9 odds / checklist \u900F\u660E", "Chrome \u5BA1\u7F8E\u7EDF\u4E00", "\u65B0\u79C0\u4E0E SSP \u9898\u6750\u517C\u5177"],
    risks: ["\u65B0\u54C1\u9AD8\u70ED\u5EA6\u65F6\u6EA2\u4EF7\u660E\u663E", "\u8FFD SSP \u6CE2\u52A8\u5927"],
    buyRating: "HIGH",
    audience: "\u91CD\u89C6\u5B98\u65B9\u900F\u660E\u5EA6\u3001\u504F\u597D refractor \u4F53\u7CFB\u7684\u73A9\u5BB6",
    sourceTitle: "Topps 2024/25 Chrome Basketball Hobby Box",
    sourceUrl: "https://www.topps.com/products/2024-25-topps-chrome-basketball-hobby-box-pre-order",
    note: "Topps \u5B98\u65B9\u9875\u9762\u663E\u793A\u8BE5\u4EA7\u54C1\u6709 2 autos per hobby box\uFF0C\u5E76\u63D0\u4F9B checklist / odds \u4E0B\u8F7D\u5165\u53E3\u3002",
    brandKeywords: ["Topps"],
    setKeywords: ["Chrome"],
    strategy: ["\u9002\u5408\u56F4\u7ED5\u6298\u5C04\u5E73\u884C\u548C SSP \u505A\u7B5B\u9009", "\u9996\u53D1\u671F\u9002\u5408\u770B\u70ED\u5EA6\uFF0C\u7A33\u5B9A\u671F\u66F4\u9002\u5408\u6311\u5355\u5361", "\u60F3\u8FFD hit \u53EF\u4EE5\u8003\u8651\u4E70\u76D2\uFF0C\u60F3\u63A7\u98CE\u9669\u5EFA\u8BAE\u4E70\u5355\u5361"]
  },
  {
    id: "topps-chrome-sapphire-2025-26",
    manufacturer: "Topps",
    productLine: "Topps Chrome Basketball Sapphire",
    season: "2025-26",
    format: "Hobby Box",
    description: "Chrome \u7684\u8D85\u9AD8\u7AEF\u5206\u652F\uFF0C\u5F3A\u8C03\u7A00\u7F3A\u3001\u5C55\u793A\u611F\u548C Sapphire \u4E13\u5C5E\u89C6\u89C9\u3002",
    whatToChase: ["Sapphire-exclusive parallels", "Infinite Sapphire", "Sapphire Selections", "\u9AD8\u7AEF\u7403\u661F/\u65B0\u79C0\u9650\u91CF\u7248\u672C"],
    boxHits: ["\u66F4\u504F\u9650\u91CF\u4E0E\u5C55\u793A\u6027", "\u4E0D\u662F\u5E38\u89C4\u6D41\u52A8\u6027\u53D6\u5411\uFF0C\u800C\u662F\u7CBE\u54C1\u8DEF\u7EBF"],
    strengths: ["\u5C55\u793A\u6548\u679C\u6781\u5F3A", "\u9002\u5408\u9AD8\u51C0\u503C\u73A9\u5BB6\u8FFD\u9876\u7EA7\u7248\u672C", "\u9650\u91CF\u5C5E\u6027\u9C9C\u660E"],
    risks: ["\u5C01\u8721\u4EF7\u683C\u9AD8", "\u5BB9\u9519\u7387\u4F4E\uFF0C\u9700\u8981\u5BF9\u7403\u5458\u548C\u65F6\u70B9\u66F4\u654F\u611F"],
    buyRating: "LOW",
    audience: "\u9AD8\u9884\u7B97\u3001\u504F\u5C55\u793A\u578B\u4E0E\u7CBE\u54C1\u8DEF\u7EBF\u7684\u73A9\u5BB6",
    sourceTitle: "Topps Chrome Basketball Sapphire 2025-26",
    sourceUrl: "https://launches.topps.com/en-US/launch/2025-26-topps-chrome-basketball-sapphire-hobby-box",
    note: "Topps Launch \u9875\u9762\u5C06 Sapphire \u5B9A\u4F4D\u4E3A\u66F4\u7A00\u7F3A\u3001\u66F4\u9AD8\u7EA7\u7684 Chrome \u6F14\u7ECE\uFF0C\u4EF7\u683C\u4E5F\u66F4\u9AD8\u3002",
    brandKeywords: ["Topps"],
    setKeywords: ["Sapphire"],
    strategy: ["\u66F4\u9002\u5408\u4F5C\u4E3A\u9AD8\u7AEF\u7CBE\u54C1\u4ED3\u4F4D", "\u4E0D\u5EFA\u8BAE\u65B0\u624B\u4EE5\u62C6\u76D2\u65B9\u5F0F\u5165\u95E8", "\u4E70\u76D2\u4E4B\u524D\u5148\u786E\u8BA4\u81EA\u5DF1\u8FFD\u7684\u662F\u7403\u5458\u8FD8\u662F\u5C55\u793A\u6027\u7248\u672C"]
  },
  {
    id: "upper-deck-epack-basketball",
    manufacturer: "Upper Deck",
    productLine: "Upper Deck e-Pack Basketball",
    season: "Always On",
    format: "Digital / Pack Platform",
    description: "\u6570\u5B57\u5316\u5F00\u5305\u4E0E\u4EA4\u6613\u5E73\u53F0\uFF0C\u9002\u5408\u4F5C\u4E3A\u4F4E\u6469\u64E6\u8BD5\u6C34\u3001\u8865\u5145\u5A31\u4E50\u6027\u548C\u6210\u5C31\u7CFB\u7EDF\u3002",
    whatToChase: ["\u5E73\u53F0\u4E13\u5C5E achievements", "\u6570\u5B57\u5408\u6210\u4E0E\u8F6C\u5B9E\u5361\u673A\u4F1A", "\u4F4E\u95E8\u69DB\u4EA4\u6613\u4F53\u9A8C"],
    boxHits: ["\u66F4\u50CF\u5E73\u53F0\u751F\u6001\u800C\u975E\u5355\u4E00\u7EB8\u76D2\u4EA7\u54C1", "\u9002\u5408\u8F7B\u4F53\u9A8C\u548C\u793E\u4EA4\u4EA4\u6613"],
    strengths: ["\u4E0A\u624B\u6210\u672C\u4F4E", "\u4EA4\u6613\u548C\u6210\u5C31\u7CFB\u7EDF\u5F3A", "\u9002\u5408\u65E5\u5E38\u8F7B\u91CF\u53C2\u4E0E"],
    risks: ["\u4E0D\u7B49\u540C\u4E8E\u4F20\u7EDF NBA \u4E3B\u7EBF Hobby \u76D2", "\u66F4\u504F\u5E73\u53F0\u4F53\u9A8C\u800C\u975E\u7EB8\u5361\u4E3B\u6218\u573A"],
    buyRating: "MEDIUM",
    audience: "\u60F3\u4F4E\u6210\u672C\u8BD5\u6C34\u3001\u559C\u6B22\u6570\u5B57\u4EA4\u4E92\u7684\u73A9\u5BB6",
    sourceTitle: "Upper Deck e-Pack About",
    sourceUrl: "https://www.upperdeckepack.com/About",
    note: "Upper Deck e-Pack \u5B98\u65B9 About \u9875\u5F3A\u8C03\u7BEE\u7403\u4EA7\u54C1\u3001\u4EA4\u6613\u3001\u6210\u5C31\u4E0E weekly releases \u7684\u6570\u5B57\u5316\u4F53\u9A8C\u3002",
    brandKeywords: ["Upper Deck"],
    setKeywords: ["e-Pack"],
    strategy: ["\u66F4\u9002\u5408\u8F7B\u91CF\u4F53\u9A8C\u548C\u793E\u4EA4\u4EA4\u6613", "\u4E0D\u8981\u548C\u4F20\u7EDF Hobby \u76D2\u7528\u540C\u4E00\u903B\u8F91\u6BD4\u8F83", "\u9002\u5408\u4F5C\u4E3A\u8865\u5145\u53C2\u4E0E\u65B9\u5F0F\u800C\u4E0D\u662F\u4E3B\u4ED3\u4F4D"]
  }
];
function getBoxProducts(manufacturer) {
  return manufacturer && manufacturer !== "ALL" ? products.filter((item) => item.manufacturer === manufacturer) : products;
}
function getBoxById(id) {
  return products.find((item) => item.id === id);
}
function getBoxIntelligence(manufacturer) {
  const filteredProducts = getBoxProducts(manufacturer);
  const grouped = manufacturers.map((item) => ({
    ...item,
    products: filteredProducts.filter((product) => product.manufacturer === item.manufacturer)
  })).filter((item) => item.products.length > 0 || !manufacturer || manufacturer === "ALL");
  const buyingGuide = [
    {
      title: "\u4F18\u5148\u4E70\u4E3B\u7EBF\u9AD8\u6D41\u52A8\u6027\u76D2",
      content: "\u5982\u679C\u76EE\u6807\u662F\u770B\u884C\u60C5\u548C\u505A\u4EA4\u6613\uFF0C\u4F18\u5148\u8003\u8651 Prizm / Select / Topps Chrome \u8FD9\u79CD\u5E02\u573A\u8BA8\u8BBA\u5EA6\u9AD8\u3001\u5361\u4EF7\u5C42\u6B21\u6E05\u6670\u7684\u4EA7\u54C1\u3002"
    },
    {
      title: "\u628A\u9884\u7B97\u5206\u6210\u76D2\u5B50 + \u5355\u5361\u4E24\u90E8\u5206",
      content: "\u70ED\u95E8\u76D2\u5B50\u9002\u5408\u53C2\u4E0E\u9996\u53D1\u70ED\u5EA6\uFF0C\u4F46\u771F\u6B63\u7684\u957F\u671F\u56DE\u62A5\u901A\u5E38\u6765\u81EA\u6311\u4E2D\u7279\u5B9A\u7403\u661F\u3001\u7CFB\u5217\u548C\u5E73\u884C\u7684\u5355\u5361\u3002"
    },
    {
      title: "\u5148\u770B checklist / odds\uFF0C\u518D\u51B3\u5B9A\u662F\u4E0D\u662F\u8FFD hit",
      content: "\u9AD8\u7AEF\u76D2\u548C Sapphire \u8FD9\u7C7B\u4EA7\u54C1\u5BB9\u9519\u7387\u4F4E\uFF0C\u9002\u5408\u5BF9\u7403\u5458\u4E0E checklist \u6709\u628A\u63E1\u7684\u73A9\u5BB6\u3002"
    }
  ];
  return {
    manufacturers: grouped,
    products: filteredProducts,
    buyingGuide,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/signalCenterService.ts
init_db();
function uniqueByCardId(items) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    if (!map.has(item.cardId)) map.set(item.cardId, item);
  }
  return Array.from(map.values());
}
function decideAction({
  trend,
  compositeScore,
  riskLevel,
  signal
}) {
  if (trend === "bearish" || riskLevel === "High") return "RISK";
  if (signal === "BUY" && compositeScore >= 74) return "BUY";
  if (signal === "WAIT" && compositeScore <= 58) return "RISK";
  return "WAIT";
}
function buildReasons(intelligence, analysis, mover) {
  const reasons = [
    intelligence.onCourt.details[0],
    intelligence.offCourt.details[0],
    intelligence.market.details[0],
    mover?.eventLabel ? `${mover.eventLabel}${typeof mover.deltaScore === "number" ? `\uFF0C\u5206\u6570\u53D8\u5316 ${mover.deltaScore >= 0 ? "+" : ""}${mover.deltaScore}` : ""}\u3002` : null,
    analysis.thesis[0]
  ].filter(Boolean);
  return reasons.slice(0, 4);
}
async function enrichItem(item, mover) {
  const card = await getCardById(item.cardId);
  if (!card) return null;
  const history = await getPriceHistory(item.cardId, 30);
  const intelligence = await getCardTrendIntelligence(item.cardId);
  const analysis = await analyzeCardTrend({ card, history, intelligence });
  const action = decideAction({
    trend: intelligence.trend,
    compositeScore: intelligence.compositeScore,
    riskLevel: analysis.riskLevel,
    signal: analysis.signal
  });
  const currentPrice = Number(card.currentPrice || item.currentPrice || 0);
  const shortTermTarget = Number(analysis.shortTermTarget || currentPrice);
  const priceGapPct = currentPrice > 0 ? Number(((shortTermTarget - currentPrice) / currentPrice * 100).toFixed(1)) : 0;
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
      liquidity: analysis.factorScores.liquidity
    }
  };
}
async function buildSignalCenterBoard(window = "24H") {
  const [marketBoard, movers, summary] = await Promise.all([
    buildMarketIntelligenceBoard(24),
    buildTrendMoversBoard(24, resolveHistoryOffset(window)),
    buildDailyTrendSummary(24, window)
  ]);
  const moverByCardId = /* @__PURE__ */ new Map();
  for (const item of [...movers.risers, ...movers.fallers]) moverByCardId.set(item.cardId, item);
  const buyCandidates = uniqueByCardId([...marketBoard.bullish, ...movers.risers]).slice(0, 4);
  const waitCandidates = uniqueByCardId([...marketBoard.neutral, ...movers.risers.slice(0, 2), ...movers.fallers.slice(0, 2)]).slice(0, 4);
  const riskCandidates = uniqueByCardId([...marketBoard.bearish, ...movers.fallers]).slice(0, 4);
  const [buy, wait, risk] = await Promise.all([
    Promise.all(buyCandidates.map((item) => enrichItem(item, moverByCardId.get(item.cardId)))).then((items) => items.filter(Boolean)),
    Promise.all(waitCandidates.map((item) => enrichItem(item, moverByCardId.get(item.cardId)))).then((items) => items.filter(Boolean)),
    Promise.all(riskCandidates.map((item) => enrichItem(item, moverByCardId.get(item.cardId)))).then((items) => items.filter(Boolean))
  ]);
  const normalizedBuy = buy.filter((item) => item.action !== "RISK").sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 4);
  const normalizedWait = wait.filter((item) => item.action === "WAIT").sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  const normalizedRisk = risk.filter((item) => item.action !== "BUY").sort((a, b) => a.compositeScore - b.compositeScore).slice(0, 4);
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    window,
    summary,
    buy: normalizedBuy,
    wait: normalizedWait,
    risk: normalizedRisk,
    spotlight: {
      buy: normalizedBuy[0],
      wait: normalizedWait[0],
      risk: normalizedRisk[0]
    }
  };
}

// server/cardChatService.ts
init_db();
function formatCardTitle(card) {
  return `${card.year || ""} ${card.brand || ""} ${card.set || ""} ${card.parallel || "Base"}`.trim();
}
async function buildCardSummary(cardId) {
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
      confidence: analysis.confidence
    },
    systemBlock: `\u7403\u5458\uFF1A${card.playerName}
\u5361\u7247\uFF1A${title}
\u5F53\u524D\u4EF7\uFF1A$${Number(card.currentPrice || 0).toFixed(2)}
7\u65E5\u53D8\u5316\uFF1A${Number(card.priceChange7d || 0).toFixed(1)}%
\u4EF7\u503C\u5206\uFF1A${Number(card.dealScore || 0).toFixed(1)}
AI \u4FE1\u53F7\uFF1A${analysis.signal}
AI \u7F6E\u4FE1\u5EA6\uFF1A${analysis.confidence}
\u77ED\u671F\u76EE\u6807\u4EF7\uFF1A$${Number(analysis.shortTermTarget || 0).toFixed(2)}
\u957F\u671F\u76EE\u6807\u4EF7\uFF1A$${Number(analysis.longTermTarget || 0).toFixed(2)}
\u6838\u5FC3\u903B\u8F91\uFF1A${analysis.thesis.join("\uFF1B")}
\u50AC\u5316\u5242\uFF1A${analysis.catalysts.join("\uFF1B")}
\u98CE\u9669\uFF1A${analysis.risks.join("\uFF1B")}
\u8D5B\u573A\u4FE1\u53F7\uFF1A${intelligence.onCourt.details.join("\uFF1B")}
\u573A\u5916\u4FE1\u53F7\uFF1A${intelligence.offCourt.details.join("\uFF1B")}
\u5E02\u573A\u4FE1\u53F7\uFF1A${intelligence.market.details.join("\uFF1B")}`
  };
}
async function buildRelatedCards(cardId, rawCard) {
  if (!cardId || !rawCard?.playerId) return [];
  const cards2 = await getCardsByPlayer(rawCard.playerId);
  return cards2.filter((item) => item.id !== cardId).sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0)).slice(0, 3).map((item) => ({
    cardId: item.id,
    title: formatCardTitle(item),
    playerName: item.playerName,
    reason: item.brand === rawCard.brand ? `\u540C\u7403\u5458\u540C\u54C1\u724C\u8DEF\u7EBF\uFF0C\u9002\u5408\u6A2A\u5411\u6BD4\u8F83 ${item.set || "\u7CFB\u5217"} \u8868\u73B0\u3002` : `\u540C\u7403\u5458\u4E0D\u540C\u54C1\u724C\u8DEF\u7EBF\uFF0C\u9002\u5408\u6BD4\u8F83\u6D41\u52A8\u6027\u4E0E\u5BA1\u7F8E\u6EA2\u4EF7\u3002`
  }));
}
function buildFallbackAnswer(message, context, compareContext) {
  if (context && compareContext) {
    return `\u4F60\u5F53\u524D\u5728\u6BD4\u8F83\u4E24\u5F20\u5361\uFF1A${context.title} \u548C ${compareContext.title}\u3002\u524D\u8005\u73B0\u4EF7\u7EA6 $${context.currentPrice.toFixed(2)}\uFF0C\u540E\u8005\u7EA6 $${compareContext.currentPrice.toFixed(2)}\u3002\u5982\u679C\u4F60\u66F4\u770B\u91CD\u77ED\u7EBF\u70ED\u5EA6\uFF0C\u4F18\u5148\u770B\u8FD1 7 \u5929\u8D70\u52BF\u66F4\u5F3A\u3001AI \u7F6E\u4FE1\u5EA6\u66F4\u9AD8\u7684\u4E00\u5F20\uFF1B\u5982\u679C\u66F4\u770B\u91CD\u957F\u671F\u914D\u7F6E\uFF0C\u8FD8\u8981\u7ED3\u5408\u54C1\u724C\u4E3B\u7EBF\u5730\u4F4D\u3001\u7CFB\u5217\u6D41\u52A8\u6027\u548C\u4EBA\u53E3\u62A5\u544A\u4E00\u8D77\u5224\u65AD\u3002\u4F60\u53EF\u4EE5\u7EE7\u7EED\u8FFD\u95EE\u6211\u201C\u54EA\u5F20\u66F4\u9002\u5408\u77ED\u7EBF\u201D\u6216\u201C\u54EA\u5F20\u66F4\u9002\u5408\u957F\u671F\u6301\u6709\u201D\u3002`;
  }
  if (context) {
    return `\u8FD9\u5F20\u5361\u662F ${context.playerName} \u7684 ${context.title}\u3002\u5F53\u524D\u4EF7\u683C\u7EA6 $${context.currentPrice.toFixed(2)}\uFF0C\u8FD1 7 \u5929 ${context.priceChange7d >= 0 ? "\u4E0A\u6DA8" : "\u56DE\u843D"} ${Math.abs(context.priceChange7d).toFixed(1)}%\u3002${context.signal ? ` \u5F53\u524D AI \u4FE1\u53F7\u504F\u5411 ${context.signal}\uFF0C\u7F6E\u4FE1\u5EA6 ${context.confidence || 0}%\u3002` : ""} \u4F60\u53EF\u4EE5\u7EE7\u7EED\u95EE\u6211\u5B83\u7684\u6295\u8D44\u903B\u8F91\u3001\u98CE\u9669\u70B9\u3001\u9002\u5408\u4E70\u5165\u7684\u65F6\u673A\uFF0C\u6216\u8005\u548C\u5176\u4ED6\u54C1\u724C/\u7CFB\u5217\u5982\u4F55\u6BD4\u8F83\u3002`;
  }
  return `\u6211\u53EF\u4EE5\u5E2E\u4F60\u7406\u89E3\u7403\u661F\u5361\u7684\u4EF7\u683C\u3001\u54C1\u724C\u3001\u7CFB\u5217\u3001\u98CE\u9669\u548C\u4E70\u5165\u903B\u8F91\u3002\u4F60\u521A\u521A\u95EE\u7684\u662F\uFF1A\u201C${message}\u201D\u3002\u5982\u679C\u4F60\u6253\u5F00\u67D0\u5F20\u5361\u7684\u8BE6\u60C5\u9875\u518D\u63D0\u95EE\uFF0C\u6211\u4F1A\u7ED3\u5408\u8FD9\u5F20\u5361\u7684\u4EF7\u683C\u3001\u8D70\u52BF\u548C AI \u5206\u6790\u7ED9\u4F60\u66F4\u5177\u4F53\u7684\u56DE\u7B54\u3002`;
}
async function chatWithCardAdvisor(input) {
  const message = input.message.trim();
  if (!message) {
    return {
      answer: "\u4F60\u53EF\u4EE5\u76F4\u63A5\u95EE\u6211\uFF1A\u8FD9\u5F20\u5361\u503C\u4E0D\u503C\u5F97\u4E70\u3001\u4E3A\u4EC0\u4E48\u6DA8\u3001\u9002\u5408\u957F\u671F\u6301\u6709\u5417\u3001\u548C Prizm/Select \u76F8\u6BD4\u600E\u4E48\u6837\u3002",
      suggestions: ["\u8FD9\u5F20\u5361\u503C\u4E0D\u503C\u5F97\u4E70\uFF1F", "\u5B83\u4E3A\u4EC0\u4E48\u6700\u8FD1\u4E0A\u6DA8\uFF1F", "\u8FD9\u5F20\u5361\u9002\u5408\u957F\u671F\u6301\u6709\u5417\uFF1F"],
      relatedCards: []
    };
  }
  let cardContext;
  let compareContext;
  let relatedCards = [];
  let systemCardContext = "\u5F53\u524D\u6CA1\u6709\u7ED1\u5B9A\u5177\u4F53\u5361\u7247\uFF0C\u8BF7\u57FA\u4E8E\u5E73\u53F0\u901A\u7528\u77E5\u8BC6\u56DE\u7B54\uFF0C\u5E76\u63D0\u9192\u7528\u6237\u6253\u5F00\u5361\u7247\u8BE6\u60C5\u9875\u53EF\u83B7\u5F97\u66F4\u7CBE\u51C6\u5206\u6790\u3002";
  if (input.cardId) {
    const current = await buildCardSummary(input.cardId);
    if (current) {
      cardContext = current.summary;
      relatedCards = await buildRelatedCards(input.cardId, current.rawCard);
      systemCardContext = `\u5F53\u524D\u7528\u6237\u6B63\u5728\u67E5\u770B\u5177\u4F53\u5361\u7247\uFF0C\u8BF7\u4F18\u5148\u56F4\u7ED5\u8FD9\u5F20\u5361\u56DE\u7B54\u3002
${current.systemBlock}`;
      if (input.compareCardId && input.compareCardId !== input.cardId) {
        const compare = await buildCardSummary(input.compareCardId);
        if (compare) {
          compareContext = compare.summary;
          systemCardContext += `

\u7528\u6237\u8FD8\u8981\u6C42\u4E0E\u4F60\u5F53\u524D\u5361\u7247\u8FDB\u884C\u5BF9\u6BD4\uFF0C\u8BF7\u540C\u65F6\u53C2\u8003\u8FD9\u5F20\u5BF9\u6BD4\u5361\uFF1A
${compare.systemBlock}

\u56DE\u7B54\u65F6\u8BF7\u660E\u786E\u8BF4\u660E\u4E24\u5F20\u5361\u5404\u81EA\u7684\u4F18\u52A3\u3001\u9002\u5408\u7684\u6301\u6709\u5468\u671F\u548C\u66F4\u9002\u5408\u54EA\u7C7B\u7528\u6237\u3002`;
        }
      }
    }
  }
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u7403\u661F\u5361\u5E73\u53F0\u5185\u7684 AI \u987E\u95EE\uFF0C\u64C5\u957F\u7528\u4E2D\u6587\u5411\u666E\u901A\u7528\u6237\u89E3\u91CA\u7403\u661F\u5361\u7684\u54C1\u724C\u3001\u7CFB\u5217\u3001\u4EF7\u683C\u8D70\u52BF\u3001\u7A00\u7F3A\u6027\u548C\u6295\u8D44\u903B\u8F91\u3002
\u8981\u6C42\uFF1A
1. \u56DE\u7B54\u8981\u76F4\u63A5\u3001\u5177\u4F53\u3001\u597D\u61C2\u3002
2. \u5982\u679C\u6709\u5361\u7247\u4E0A\u4E0B\u6587\uFF0C\u5C31\u4F18\u5148\u7ED3\u5408\u8BE5\u5361\u7247\u6570\u636E\u89E3\u91CA\uFF0C\u4E0D\u8981\u6CDB\u6CDB\u800C\u8C08\u3002
3. \u4E0D\u5938\u5927\u6536\u76CA\uFF0C\u4E0D\u627F\u8BFA\u8D5A\u94B1\u3002
4. \u5982\u679C\u7528\u6237\u95EE\u201C\u503C\u4E0D\u503C\u5F97\u4E70\u201D\uFF0C\u8BF7\u540C\u65F6\u8BB2\u673A\u4F1A\u548C\u98CE\u9669\u3002
5. \u5982\u679C\u5728\u5BF9\u6BD4\u4E24\u5F20\u5361\uFF0C\u8981\u660E\u786E\u6307\u51FA\uFF1A\u8C01\u66F4\u9002\u5408\u77ED\u7EBF\u3001\u8C01\u66F4\u9002\u5408\u957F\u7EBF\u3001\u8C01\u98CE\u9669\u66F4\u9AD8\u3002
6. \u7ED3\u5C3E\u7ED9 2-3 \u4E2A\u53EF\u4EE5\u7EE7\u7EED\u8FFD\u95EE\u7684\u5EFA\u8BAE\u65B9\u5411\u3002
${systemCardContext}`
        },
        ...(input.history || []).slice(-8).map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message }
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
              maxItems: 3
            }
          },
          required: ["answer", "suggestions"]
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    const text2 = typeof content === "string" ? content : Array.isArray(content) ? content.map((item) => item.text || "").join("") : "";
    if (!text2) throw new Error("empty response");
    const parsed = JSON.parse(text2);
    return {
      answer: parsed.answer,
      suggestions: parsed.suggestions?.slice(0, 3) || [],
      cardContext,
      compareContext,
      relatedCards
    };
  } catch {
    return {
      answer: buildFallbackAnswer(message, cardContext, compareContext),
      suggestions: compareContext ? ["\u54EA\u5F20\u66F4\u9002\u5408\u77ED\u7EBF\uFF1F", "\u54EA\u5F20\u66F4\u9002\u5408\u957F\u671F\u6301\u6709\uFF1F", "\u4E24\u5F20\u5361\u54EA\u4E2A\u98CE\u9669\u66F4\u9AD8\uFF1F"] : cardContext ? ["\u8FD9\u5F20\u5361\u6700\u5927\u7684\u98CE\u9669\u662F\u4EC0\u4E48\uFF1F", "\u73B0\u5728\u9002\u5408\u4E70\u5165\u8FD8\u662F\u7B49\u56DE\u8C03\uFF1F", "\u5B83\u548C\u540C\u7403\u5458\u5176\u4ED6\u7CFB\u5217\u6BD4\u600E\u4E48\u6837\uFF1F"] : ["Prizm \u548C Select \u6709\u4EC0\u4E48\u533A\u522B\uFF1F", "\u4EC0\u4E48\u6837\u7684\u5361\u66F4\u4FDD\u503C\uFF1F", "\u5982\u4F55\u5224\u65AD\u4E00\u5F20\u5361\u662F\u4E0D\u662F\u9AD8\u4F4D\uFF1F"],
      cardContext,
      compareContext,
      relatedCards
    };
  }
}

// server/externalDataService.ts
import https from "https";
import http from "http";
function fetchUrl(url, options = {}) {
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
          ...options.headers
        },
        timeout: options.timeout || 15e3
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
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
async function searchEbaySoldListings(playerName, cardInfo) {
  const parts = [playerName];
  if (cardInfo.year) parts.push(String(cardInfo.year));
  if (cardInfo.brand) parts.push(cardInfo.brand.replace("Panini ", ""));
  if (cardInfo.parallel && cardInfo.parallel !== "Base") parts.push(cardInfo.parallel);
  if (cardInfo.grade && cardInfo.grade !== "Raw") parts.push(cardInfo.grade);
  parts.push("card");
  const query = parts.join(" ");
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=214&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=20`;
  try {
    const html = await fetchUrl(url, { timeout: 12e3 });
    return parseEbayListings(html, query);
  } catch (err) {
    console.error("[eBay] Fetch error:", err);
    return [];
  }
}
function parseEbayListings(html, query) {
  const listings = [];
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
    const gradeMatch = title.match(/PSA\s*(\d+)|BGS\s*(\d+\.?\d*)|SGC\s*(\d+)/i);
    const grade = gradeMatch ? gradeMatch[0].toUpperCase() : "Raw";
    listings.push({
      title,
      price,
      currency: "USD",
      soldDate: dateMatch ? dateMatch[1] : (/* @__PURE__ */ new Date()).toLocaleDateString("en-US"),
      condition: grade !== "Raw" ? "Graded" : "Ungraded",
      grade,
      url: linkMatch ? linkMatch[1].split("?")[0] : `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
      imageUrl: imgMatch ? imgMatch[1] : "",
      source: "ebay"
    });
    count++;
  }
  return listings;
}
async function searchKataoListings(playerName, cardInfo) {
  const parts = [playerName];
  if (cardInfo.year) parts.push(String(cardInfo.year));
  if (cardInfo.brand) {
    const brandShort = cardInfo.brand.replace("Panini ", "").replace("National Treasures", "NT");
    parts.push(brandShort);
  }
  if (cardInfo.grade && cardInfo.grade !== "Raw") parts.push(cardInfo.grade);
  const query = parts.join(" ");
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.cardhobby.com.cn/api/v1/product/search?keyword=${encodedQuery}&page=1&pageSize=10&sort=time`;
  try {
    const data = await fetchUrl(url, {
      timeout: 1e4,
      headers: {
        "Accept": "application/json",
        "Origin": "https://www.cardhobby.com.cn",
        "Referer": "https://www.cardhobby.com.cn/"
      }
    });
    const json2 = JSON.parse(data);
    return parseKataoResponse(json2);
  } catch (err) {
    try {
      const webUrl = `https://www.cardhobby.com.cn/Market/Search?keyword=${encodedQuery}&sort=2`;
      const html = await fetchUrl(webUrl, { timeout: 1e4 });
      return parseKataoHtml(html);
    } catch (err2) {
      console.error("[\u5361\u6DD8] Fetch error:", err2);
      return [];
    }
  }
}
function parseKataoResponse(json2) {
  const listings = [];
  const items = json2?.data?.list || json2?.data?.items || json2?.result?.list || [];
  for (const item of items.slice(0, 8)) {
    const price = parseFloat(item.price || item.currentPrice || item.salePrice || 0);
    if (!price) continue;
    listings.push({
      title: item.title || item.name || item.cardName || "\u7403\u661F\u5361",
      price,
      currency: "CNY",
      soldDate: item.soldTime || item.createTime || item.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      condition: item.grade ? "Graded" : "Ungraded",
      grade: item.grade || item.cardGrade || "Raw",
      url: item.url || `https://www.cardhobby.com.cn/Market/Detail/${item.id || ""}`,
      imageUrl: item.imageUrl || item.coverImage || item.img || "",
      source: "katao"
    });
  }
  return listings;
}
function parseKataoHtml(html) {
  const listings = [];
  const priceRegex = /class="price[^"]*"[^>]*>[\s\S]*?¥\s*([0-9,]+\.?\d*)/g;
  const titleRegex = /class="title[^"]*"[^>]*>([^<]{5,100})</g;
  const prices = [];
  const titles = [];
  let m;
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parseFloat(m[1].replace(",", ""));
    if (!isNaN(p) && p > 0) prices.push(p);
  }
  while ((m = titleRegex.exec(html)) !== null) {
    const t2 = m[1].trim();
    if (t2.length > 5) titles.push(t2);
  }
  for (let i = 0; i < Math.min(prices.length, titles.length, 8); i++) {
    listings.push({
      title: titles[i],
      price: prices[i],
      currency: "CNY",
      soldDate: (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN"),
      condition: "Unknown",
      grade: "Raw",
      url: "https://www.cardhobby.com.cn",
      imageUrl: "",
      source: "katao"
    });
  }
  return listings;
}
async function getMarketData(playerName, cardInfo) {
  const [ebayListings, kataoListings] = await Promise.allSettled([
    searchEbaySoldListings(playerName, cardInfo),
    searchKataoListings(playerName, cardInfo)
  ]);
  const ebay = ebayListings.status === "fulfilled" ? ebayListings.value : [];
  const katao = kataoListings.status === "fulfilled" ? kataoListings.value : [];
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
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}

// server/aiAnalysisService.ts
import https2 from "https";
import http2 from "http";
var OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
var OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
var AI_MODEL = "gemini-2.5-flash";
async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const body = JSON.stringify({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert sports card market analyst. Always respond with valid JSON only, no markdown formatting."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });
  const url = `${OPENAI_BASE_URL}/chat/completions`;
  const parsed = new URL(url);
  const client = parsed.protocol === "https:" ? https2 : http2;
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
          "Content-Length": Buffer.byteLength(body)
        },
        timeout: 45e3
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const json2 = JSON.parse(data);
            if (json2.error) {
              reject(new Error(`API Error: ${json2.error.message || JSON.stringify(json2.error)}`));
              return;
            }
            const text2 = json2?.choices?.[0]?.message?.content || "";
            resolve(text2);
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
async function analyzeCardTrend2(input) {
  const priceHistoryText = input.priceHistory.slice(-10).map((p) => `${p.date}: $${p.price} (${p.source})`).join("\n");
  const ebayText = input.ebayListings && input.ebayListings.length > 0 ? input.ebayListings.slice(0, 5).map((l) => `  - $${l.price} (${l.grade}, sold ${l.soldDate})`).join("\n") : "  No recent eBay data available";
  const kataoText = input.kataoListings && input.kataoListings.length > 0 ? input.kataoListings.slice(0, 5).map((l) => `  - \xA5${l.price} (${l.grade}, ${l.soldDate})`).join("\n") : "  No recent Katao (Chinese market) data available";
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

Chinese Market (\u5361\u6DD8):
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
    const cleaned = response.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
    const analysis = JSON.parse(jsonStr);
    console.log(`[AI Analysis] Success: signal=${analysis.signal}, confidence=${analysis.confidence}`);
    return {
      signal: analysis.signal || "HOLD",
      confidence: Math.min(100, Math.max(0, Number(analysis.confidence) || 70)),
      shortTermOutlook: analysis.shortTermOutlook || "\u5E02\u573A\u6570\u636E\u4E0D\u8DB3\uFF0C\u5EFA\u8BAE\u6301\u7EED\u89C2\u5BDF",
      longTermOutlook: analysis.longTermOutlook || "\u957F\u671F\u8D70\u52BF\u53D6\u51B3\u4E8E\u7403\u5458\u8868\u73B0",
      keyFactors: Array.isArray(analysis.keyFactors) ? analysis.keyFactors : [],
      priceTarget: {
        low: Number(analysis.priceTarget?.low) || Math.round(input.currentPrice * 0.85),
        mid: Number(analysis.priceTarget?.mid) || input.currentPrice,
        high: Number(analysis.priceTarget?.high) || Math.round(input.currentPrice * 1.3),
        currency: "USD"
      },
      riskLevel: analysis.riskLevel || "Medium",
      summary: analysis.summary || "AI \u5206\u6790\u6682\u65F6\u4E0D\u53EF\u7528",
      catalysts: Array.isArray(analysis.catalysts) ? analysis.catalysts : [],
      risks: Array.isArray(analysis.risks) ? analysis.risks : [],
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      aiModel: AI_MODEL
    };
  } catch (err) {
    console.error("[AI Analysis] Error:", err);
    return generateFallbackAnalysis(input);
  }
}
function generateFallbackAnalysis(input) {
  const priceChange = input.priceChange7d;
  const performanceBonus = input.performanceScore > 90 ? 10 : input.performanceScore > 80 ? 5 : 0;
  let signal = "HOLD";
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
  const priceDiff = (input.currentPrice - input.avgPrice30d) / input.avgPrice30d * 100;
  return {
    signal,
    confidence,
    shortTermOutlook: priceChange > 0 ? `\u8FD1\u671F\u4EF7\u683C\u4E0A\u6DA8 ${priceChange.toFixed(1)}%\uFF0C\u77ED\u671F\u52A8\u80FD\u8F83\u5F3A\uFF0C\u5173\u6CE8\u6210\u4EA4\u91CF\u53D8\u5316` : `\u8FD1\u671F\u4EF7\u683C\u4E0B\u8DCC ${Math.abs(priceChange).toFixed(1)}%\uFF0C\u5EFA\u8BAE\u7B49\u5F85\u4EF7\u683C\u4F01\u7A33\u540E\u5165\u573A`,
    longTermOutlook: input.performanceScore > 85 ? "\u7403\u5458\u7ADE\u6280\u72B6\u6001\u4F18\u79C0\uFF0C\u957F\u671F\u6301\u6709\u4EF7\u503C\u8F83\u9AD8\uFF0C\u5EFA\u8BAE\u9022\u4F4E\u5E03\u5C40" : "\u957F\u671F\u8D70\u52BF\u9700\u5173\u6CE8\u7403\u5458\u8D5B\u5B63\u8868\u73B0\u548C\u5E02\u573A\u6574\u4F53\u6D41\u52A8\u6027",
    keyFactors: [
      `7\u65E5\u6DA8\u8DCC\u5E45: ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
      `\u8F8330\u65E5\u5747\u4EF7: ${priceDiff > 0 ? "+" : ""}${priceDiff.toFixed(1)}%`,
      `\u7403\u5458\u72B6\u6001\u8BC4\u5206: ${input.performanceScore}/100`,
      `\u8BC4\u7EA7: ${input.grade}`
    ],
    priceTarget: {
      low: Math.round(input.currentPrice * 0.85),
      mid: Math.round(input.currentPrice * 1.1),
      high: Math.round(input.currentPrice * 1.35),
      currency: "USD"
    },
    riskLevel: priceChange < -10 ? "High" : priceChange > 10 ? "Medium" : "Low",
    summary: `${input.playerName} \u7684 ${input.year} ${input.brand} ${input.parallel} \u5361\u7247\u5F53\u524D\u4EF7\u683C\u4E3A $${input.currentPrice}\uFF0C\u8F8330\u65E5\u5747\u4EF7${priceDiff >= 0 ? "\u4E0A\u6DA8" : "\u4E0B\u8DCC"} ${Math.abs(priceDiff).toFixed(1)}%\u3002\u7403\u5458\u72B6\u6001\u8BC4\u5206 ${input.performanceScore}/100\uFF0C${input.performanceScore > 85 ? "\u7ADE\u6280\u72B6\u6001\u4F18\u79C0" : "\u72B6\u6001\u7A33\u5B9A"}\u3002\u7EFC\u5408\u5224\u65AD\u5EFA\u8BAE${signal === "STRONG_BUY" || signal === "BUY" ? "\u9002\u91CF\u4E70\u5165" : signal === "HOLD" ? "\u6301\u6709\u89C2\u671B" : "\u7B49\u5F85\u66F4\u597D\u65F6\u673A"}\u3002`,
    catalysts: [
      "\u7403\u5458\u8D5B\u5B63\u8868\u73B0\u5F3A\u52B2\uFF0C\u5173\u6CE8\u5EA6\u6301\u7EED\u63D0\u5347",
      `${input.parallel} \u7248\u672C\u7A00\u6709\u5EA6\u9AD8\uFF0C\u5E02\u573A\u9700\u6C42\u65FA\u76DB`
    ],
    risks: [
      "\u5E02\u573A\u6D41\u52A8\u6027\u98CE\u9669\uFF0C\u77ED\u671F\u53EF\u80FD\u51FA\u73B0\u4EF7\u683C\u6CE2\u52A8",
      "\u7403\u5458\u4F24\u75C5\u6216\u72B6\u6001\u4E0B\u6ED1\u98CE\u9669"
    ],
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    aiModel: "fallback-rules"
  };
}

// server/multiPlatformService.ts
import https3 from "https";
import http3 from "http";
function fetchUrl2(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const protocol = parsed.protocol === "https:" ? https3 : http3;
    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/html, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
        ...options.headers
      },
      timeout: options.timeout || 15e3
    };
    const req = protocol.request(url, reqOptions, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl2(res.headers.location, options).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => data += chunk);
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
var CNY_TO_USD = parseFloat(process.env.CNY_TO_USD_RATE || "0.138");
async function fetchKataoListings(keyword, status = 1, pageIndex = 1, pageSize = 20) {
  const searchJson = JSON.stringify([{ Key: "Status", Value: status }]);
  const params = new URLSearchParams({
    userId: "",
    pageIndex: String(pageIndex),
    pageSize: String(pageSize),
    searchKey: keyword,
    searchJson,
    sort: "EffectiveTimeStamp",
    sortType: "desc"
  });
  const url = `https://www.cardhobby.com.cn/NewCommodity/SearchCommodity?${params}`;
  try {
    const raw = await fetchUrl2(url, {
      headers: {
        Referer: "https://www.cardhobby.com.cn/Market",
        Accept: "application/json"
      },
      timeout: 12e3
    });
    const json2 = JSON.parse(raw);
    if (!json2.data || json2.result !== 1) {
      throw new Error(json2.msg || "API returned error");
    }
    const data = json2.data;
    const total = data.TotalCount || 0;
    const rawItems = data.PagedMarketItemList || [];
    const listings = rawItems.map((item) => {
      const rawPrice = parseFloat(item.Price || "0");
      const lowestPrice = parseFloat(item.LowestPrice || "0");
      const price = item.ByWay === 2 ? rawPrice > 1 ? rawPrice : lowestPrice : rawPrice;
      const isSold = item.Status === -2;
      return {
        id: String(item.ID),
        title: item.Title || "",
        price,
        currency: "CNY",
        priceUSD: Math.round(price * CNY_TO_USD * 100) / 100,
        status: isSold ? "sold" : "active",
        listedDate: item.EffectiveDate || void 0,
        soldDate: isSold ? item.UpdateDate || item.EffectiveDate || void 0 : void 0,
        condition: item.IsGuarantee ? "\u5DF2\u62C5\u4FDD" : "\u672A\u62C5\u4FDD",
        grade: extractGrade(item.Title || ""),
        seller: item.SellRealName || void 0,
        imageUrl: item.TitImg || void 0,
        url: `https://www.cardhobby.com.cn/market/item/${item.ID}`,
        source: "katao",
        sourceName: "\u5361\u6DD8",
        rawData: item
      };
    });
    return { items: listings, total };
  } catch (err) {
    throw new Error(`\u5361\u6DD8 API \u9519\u8BEF: ${err.message}`);
  }
}
async function getKataoData(playerName, options = {}) {
  const keywordParts = [playerName];
  if (options.year) keywordParts.push(String(options.year));
  if (options.brand) keywordParts.push(options.brand.replace("Panini ", "").replace("National Treasures", "NT"));
  if (options.grade && options.grade !== "Raw") keywordParts.push(options.grade);
  const keyword = keywordParts.join(" ");
  try {
    const [activeResult, soldResult] = await Promise.allSettled([
      fetchKataoListings(keyword, 1, 1, options.pageSize || 10),
      fetchKataoListings(keyword, -2, 1, options.pageSize || 10)
    ]);
    const active = activeResult.status === "fulfilled" ? activeResult.value : { items: [], total: 0 };
    const sold = soldResult.status === "fulfilled" ? soldResult.value : { items: [], total: 0 };
    const allListings = [...active.items, ...sold.items];
    const total = active.total + sold.total;
    return { listings: allListings, total };
  } catch (err) {
    return { listings: [], total: 0, error: err.message };
  }
}
async function getXianyuData(playerName, options = {}) {
  const keyword = buildKeyword(playerName, options, "\u7403\u661F\u5361");
  const cookie = process.env.XIANYU_COOKIE;
  if (cookie) {
    try {
      return await fetchXianyuWithCookie(keyword, cookie);
    } catch (err) {
      console.warn("[\u95F2\u9C7C] Cookie \u65B9\u5F0F\u5931\u8D25\uFF0C\u5C1D\u8BD5 HTML \u89E3\u6790:", err.message);
    }
  }
  try {
    return await fetchXianyuHtml(keyword);
  } catch (err) {
    return {
      listings: [],
      total: 0,
      error: `\u95F2\u9C7C\u6570\u636E\u83B7\u53D6\u5931\u8D25\u3002\u5982\u9700\u5B8C\u6574\u6570\u636E\uFF0C\u8BF7\u5728\u73AF\u5883\u53D8\u91CF XIANYU_COOKIE \u4E2D\u914D\u7F6E\u767B\u5F55 cookie\u3002\u9519\u8BEF: ${err.message}`
    };
  }
}
async function fetchXianyuWithCookie(keyword, cookie) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.goofish.com/search?q=${encodedKeyword}&type=item`;
  const raw = await fetchUrl2(url, {
    headers: {
      Cookie: cookie,
      Referer: "https://www.goofish.com/"
    },
    timeout: 15e3
  });
  return parseXianyuHtml(raw, keyword);
}
async function fetchXianyuHtml(keyword) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.goofish.com/search?q=${encodedKeyword}&type=item`;
  const raw = await fetchUrl2(url, {
    headers: {
      Referer: "https://www.goofish.com/"
    },
    timeout: 15e3
  });
  return parseXianyuHtml(raw, keyword);
}
function parseXianyuHtml(html, keyword) {
  const listings = [];
  const initDataMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?})\s*<\/script>/);
  if (initDataMatch) {
    try {
      const data = JSON.parse(initDataMatch[1]);
      const items = data?.data?.resultList || data?.data?.items || data?.pageData?.data?.resultList || [];
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
          condition: info?.condition || "\u4E8C\u624B",
          seller: info?.user?.nickName || void 0,
          imageUrl: info?.pic || info?.image || void 0,
          url: info?.itemId ? `https://www.goofish.com/item?id=${info.itemId}` : "https://www.goofish.com",
          source: "xianyu",
          sourceName: "\u95F2\u9C7C"
        });
      }
      return { listings, total: listings.length };
    } catch {
    }
  }
  const priceMatches = html.matchAll(/["']priceText["']\s*:\s*["']([^"']+)["']/g);
  const titleMatches = html.matchAll(/["']title["']\s*:\s*["']([^"']{5,100})["']/g);
  const prices = [];
  const titles = [];
  for (const m of priceMatches) {
    const p = parseFloat(m[1].replace(/[^0-9.]/g, ""));
    if (p > 0) prices.push(p);
  }
  for (const m of titleMatches) {
    if (m[1].includes("\u7403\u661F") || m[1].includes("\u5361") || m[1].toLowerCase().includes("card")) {
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
      condition: "\u4E8C\u624B",
      url: "https://www.goofish.com",
      source: "xianyu",
      sourceName: "\u95F2\u9C7C"
    });
  }
  return { listings, total: listings.length };
}
async function getXiaohongshuData(playerName, options = {}) {
  const keyword = buildKeyword(playerName, options, "\u7403\u661F\u5361");
  const cookie = process.env.XHS_COOKIE;
  if (cookie) {
    try {
      return await fetchXhsWithCookie(keyword, cookie);
    } catch (err) {
      console.warn("[\u5C0F\u7EA2\u4E66] Cookie \u65B9\u5F0F\u5931\u8D25\uFF0C\u5C1D\u8BD5 HTML \u89E3\u6790:", err.message);
    }
  }
  try {
    return await fetchXhsHtml(keyword);
  } catch (err) {
    return {
      listings: [],
      total: 0,
      error: `\u5C0F\u7EA2\u4E66\u6570\u636E\u83B7\u53D6\u5931\u8D25\u3002\u5982\u9700\u5B8C\u6574\u6570\u636E\uFF0C\u8BF7\u5728\u73AF\u5883\u53D8\u91CF XHS_COOKIE \u4E2D\u914D\u7F6E\u767B\u5F55 cookie\u3002\u9519\u8BEF: ${err.message}`
    };
  }
}
async function fetchXhsWithCookie(keyword, cookie) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodedKeyword}&type=51`;
  const raw = await fetchUrl2(url, {
    headers: {
      Cookie: cookie,
      Referer: "https://www.xiaohongshu.com/"
    },
    timeout: 15e3
  });
  return parseXhsHtml(raw, keyword);
}
async function fetchXhsHtml(keyword) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodedKeyword}&type=51`;
  const raw = await fetchUrl2(url, {
    headers: {
      Referer: "https://www.xiaohongshu.com/"
    },
    timeout: 15e3
  });
  return parseXhsHtml(raw, keyword);
}
function parseXhsHtml(html, keyword) {
  const listings = [];
  const pricePatterns = [
    /出\s*([0-9,]+\.?\d*)\s*元?/g,
    /售\s*([0-9,]+\.?\d*)\s*元?/g,
    /价格?\s*[:：]\s*([0-9,]+\.?\d*)/g,
    /([0-9,]+\.?\d*)\s*元/g,
    /¥\s*([0-9,]+\.?\d*)/g
  ];
  const titlePattern = /"title"\s*:\s*"([^"]{5,100})"/g;
  const noteIdPattern = /"noteId"\s*:\s*"([^"]+)"/g;
  const descPattern = /"desc"\s*:\s*"([^"]{5,200})"/g;
  const titles = [];
  const noteIds = [];
  const descs = [];
  let m;
  while ((m = titlePattern.exec(html)) !== null) {
    if (m[1].includes("\u7403\u661F") || m[1].includes("\u5361") || m[1].toLowerCase().includes("card") || m[1].toLowerCase().includes("klay") || m[1].toLowerCase().includes("thompson")) {
      titles.push(m[1]);
    }
  }
  while ((m = noteIdPattern.exec(html)) !== null) {
    noteIds.push(m[1]);
  }
  while ((m = descPattern.exec(html)) !== null) {
    descs.push(m[1]);
  }
  const extractedPrices = [];
  for (const desc2 of descs) {
    for (const pattern of pricePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(desc2);
      if (match) {
        const p = parseFloat(match[1].replace(",", ""));
        if (p > 0 && p < 1e6) {
          extractedPrices.push(p);
          break;
        }
      }
    }
  }
  for (let i = 0; i < Math.min(titles.length, 10); i++) {
    const price = extractedPrices[i] || 0;
    const noteId = noteIds[i] || "";
    listings.push({
      id: noteId || `xhs-${i}`,
      title: titles[i],
      price,
      currency: "CNY",
      priceUSD: price ? Math.round(price * CNY_TO_USD * 100) / 100 : void 0,
      status: price > 0 ? "active" : "unknown",
      condition: "\u4E8C\u624B/\u6652\u5361",
      url: noteId ? `https://www.xiaohongshu.com/explore/${noteId}` : "https://www.xiaohongshu.com",
      source: "xiaohongshu",
      sourceName: "\u5C0F\u7EA2\u4E66"
    });
  }
  return { listings, total: listings.length };
}
async function getMultiPlatformData(playerName, options = {}) {
  const keyword = buildKeyword(playerName, options);
  const [kataoResult, xianyuResult, xhsResult] = await Promise.allSettled([
    getKataoData(playerName, options),
    getXianyuData(playerName, options),
    getXiaohongshuData(playerName, options)
  ]);
  const katao = kataoResult.status === "fulfilled" ? kataoResult.value : { listings: [], total: 0, error: String(kataoResult.reason) };
  const xianyu = xianyuResult.status === "fulfilled" ? xianyuResult.value : { listings: [], total: 0, error: String(xianyuResult.reason) };
  const xiaohongshu = xhsResult.status === "fulfilled" ? xhsResult.value : { listings: [], total: 0, error: String(xhsResult.reason) };
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
      xiaohongshu: { listings: xiaohongshu.listings, total: xiaohongshu.total, error: xiaohongshu.error }
    },
    summary: {
      totalListings: allListings.length,
      avgPriceCNY: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      minPriceCNY: prices.length ? Math.min(...prices) : null,
      maxPriceCNY: prices.length ? Math.max(...prices) : null,
      soldCount,
      activeCount,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
function buildKeyword(playerName, options = {}, suffix) {
  const parts = [playerName];
  if (options.year) parts.push(String(options.year));
  if (options.brand) {
    parts.push(options.brand.replace("Panini ", "").replace("National Treasures", "NT"));
  }
  if (options.grade && options.grade !== "Raw") parts.push(options.grade);
  if (suffix) parts.push(suffix);
  return parts.join(" ");
}
function extractGrade(title) {
  const gradePatterns = [
    /PSA\s*(\d+(?:\.\d+)?)/i,
    /BGS\s*(\d+(?:\.\d+)?)/i,
    /SGC\s*(\d+(?:\.\d+)?)/i,
    /CGC\s*(\d+(?:\.\d+)?)/i
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
async function getKataoKlayData(options = {}) {
  const keyword = `Klay Thompson${options.extraKeywords ? " " + options.extraKeywords : ""}`;
  const status = options.status ?? -2;
  try {
    const result = await fetchKataoListings(keyword, status, options.page || 1, options.pageSize || 20);
    return { listings: result.items, total: result.total };
  } catch (err) {
    return { listings: [], total: 0, error: err.message };
  }
}

// server/routers.ts
var cardsRouter = router({
  getDealOpportunities: publicProcedure.input(z4.object({ sport: z4.string().optional(), limit: z4.number().optional() })).query(async ({ input }) => {
    return getDealOpportunities(input.sport, input.limit ?? 30);
  }),
  getAll: publicProcedure.input(z4.object({ sport: z4.string().optional(), limit: z4.number().optional() })).query(async ({ input }) => {
    return getAllCards(input.sport, input.limit ?? 500);
  }),
  getById: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
    return getCardById(input.id);
  }),
  getByPlayer: publicProcedure.input(z4.object({ playerId: z4.number() })).query(async ({ input }) => {
    return getCardsByPlayer(input.playerId);
  }),
  getPriceHistory: publicProcedure.input(z4.object({ cardId: z4.number(), days: z4.number().optional() })).query(async ({ input }) => {
    return getPriceHistory(input.cardId, input.days ?? 90);
  }),
  getTrendIntelligence: publicProcedure.input(z4.object({ cardId: z4.number() })).query(async ({ input }) => {
    return getCardTrendIntelligence(input.cardId);
  }),
  // AI 趋势分析功能
  getTrendHistory: publicProcedure.input(z4.object({ cardId: z4.number(), limit: z4.number().min(1).max(60).optional() })).query(async ({ input }) => {
    return getTrendHistory(input.cardId, input.limit ?? 20);
  }),
  getDailyTrendSummary: publicProcedure.input(z4.object({ limit: z4.number().min(6).max(60).optional(), window: z4.enum(["24H", "7D", "30D"]).optional() }).optional()).query(async ({ input }) => {
    return buildDailyTrendSummary(input?.limit ?? 20, input?.window ?? "24H");
  }),
  getTrendMovers: publicProcedure.input(z4.object({ limit: z4.number().min(6).max(60).optional(), window: z4.enum(["24H", "7D", "30D"]).optional() }).optional()).query(async ({ input }) => {
    return buildTrendMoversBoard(input?.limit ?? 20, resolveHistoryOffset(input?.window ?? "24H"));
  }),
  getTrendBoard: publicProcedure.input(z4.object({ limit: z4.number().min(6).max(60).optional() }).optional()).query(async ({ input }) => {
    return buildMarketIntelligenceBoard(input?.limit ?? 18);
  }),
  getSignalCenterBoard: publicProcedure.input(z4.object({ window: z4.enum(["24H", "7D", "30D"]).optional() }).optional()).query(async ({ input }) => {
    return buildSignalCenterBoard(input?.window ?? "24H");
  }),
  analyzeTrend: publicProcedure.input(z4.object({ cardId: z4.number() })).mutation(async ({ input }) => {
    const cardRaw = await getCardById(input.cardId);
    if (!cardRaw) throw new Error("Card not found");
    const history = await getPriceHistory(input.cardId, 30);
    const intelligence = await getCardTrendIntelligence(input.cardId);
    return analyzeCardTrend({ card: cardRaw, history, intelligence });
  }),
  chatAdvisor: publicProcedure.input(z4.object({
    message: z4.string().min(1),
    cardId: z4.number().optional(),
    compareCardId: z4.number().optional(),
    history: z4.array(z4.object({ role: z4.enum(["user", "assistant"]), content: z4.string().min(1) })).optional()
  })).mutation(async ({ input }) => {
    return chatWithCardAdvisor(input);
  })
});
var playersRouter = router({
  search: publicProcedure.input(z4.object({ query: z4.string(), sport: z4.string().optional() })).query(async ({ input }) => {
    return searchPlayers(input.query, input.sport);
  }),
  getTop: publicProcedure.input(z4.object({ sport: z4.string().optional(), limit: z4.number().optional() })).query(async ({ input }) => {
    return getTopPlayers(input.sport, input.limit ?? 20);
  }),
  getById: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
    const { getPlayerByExternalId: getPlayerByExternalId3, searchPlayers: searchPlayers2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) {
      const { MOCK_PLAYERS: MOCK_PLAYERS2 } = await Promise.resolve().then(() => (init_mockDb(), mockDb_exports));
      return MOCK_PLAYERS2.find((p) => p.id === input.id);
    }
    const { players: players2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq3 } = await import("drizzle-orm");
    const result = await db.select().from(players2).where(eq3(players2.id, input.id)).limit(1);
    return result[0];
  })
});
var watchlistRouter = router({
  get: publicProcedure.query(async () => {
    const items = await getUserWatchlist(1);
    const enriched = await Promise.all(
      items.map(async (item) => {
        const card = item.cardId ? await getCardById(item.cardId) : null;
        return { ...item, card };
      })
    );
    return enriched;
  }),
  add: publicProcedure.input(
    z4.object({
      cardId: z4.number().optional(),
      playerId: z4.number().optional(),
      alertPriceBelow: z4.number().optional(),
      alertDealScoreAbove: z4.number().optional(),
      notes: z4.string().optional()
    })
  ).mutation(async ({ input }) => {
    await addToWatchlist({ userId: 1, ...input });
    return { success: true };
  }),
  remove: publicProcedure.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
    await removeFromWatchlist(input.id, 1);
    return { success: true };
  }),
  update: publicProcedure.input(
    z4.object({
      id: z4.number(),
      alertPriceBelow: z4.number().optional(),
      alertDealScoreAbove: z4.number().optional(),
      notes: z4.string().optional()
    })
  ).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateWatchlistItem(id, 1, data);
    return { success: true };
  })
});
var notificationsRouter = router({
  get: publicProcedure.input(z4.object({ limit: z4.number().optional() })).query(async ({ input }) => {
    return getUserNotifications(1, input.limit ?? 50);
  }),
  unreadCount: publicProcedure.query(async () => {
    return getUnreadNotificationCount(1);
  }),
  markRead: publicProcedure.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
    await markNotificationRead(input.id, 1);
    return { success: true };
  }),
  markAllRead: publicProcedure.mutation(async () => {
    await markAllNotificationsRead(1);
    return { success: true };
  })
});
var reportsRouter = router({
  generate: publicProcedure.input(z4.object({ sport: z4.string().optional(), focus: z4.string().optional() })).mutation(async ({ input }) => {
    const deals = await getDealOpportunities(input.sport, 10);
    const topPlayers = await getTopPlayers(input.sport, 5);
    const dealsText = deals.slice(0, 8).map(
      (c) => `- ${c.playerName} ${c.year} ${c.brand} ${c.parallel} (${c.grade}): \u5F53\u524D\u4EF7 $${c.currentPrice}, 30\u5929\u5747\u4EF7 $${c.avgPrice30d}, \u4EF7\u503C\u8BC4\u5206 ${c.dealScore}/100, \u4EF7\u683C\u53D8\u52A8 ${c.priceChange7d}%`
    ).join("\n");
    const playersText = topPlayers.map((p) => `- ${p.name} (${p.team}): \u8868\u73B0\u8BC4\u5206 ${p.performanceScore}/100`).join("\n");
    const sportLabel = input.sport && input.sport !== "ALL" ? input.sport : "\u591A\u8FD0\u52A8";
    const focusNote = input.focus ? `
\u7279\u522B\u5173\u6CE8\uFF1A${input.focus}` : "";
    const prompt = `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u7403\u661F\u5361\u6295\u8D44\u5206\u6790\u5E08\u3002\u8BF7\u6839\u636E\u4EE5\u4E0B\u5E02\u573A\u6570\u636E\uFF0C\u751F\u6210\u4E00\u4EFD\u8BE6\u7EC6\u7684${sportLabel}\u7403\u661F\u5361\u6295\u8D44\u5EFA\u8BAE\u62A5\u544A\u3002${focusNote}

## \u5F53\u524D\u6295\u8D44\u673A\u4F1A\uFF08\u6309\u8BC4\u5206\u6392\u5E8F\uFF09
${dealsText || "\u6682\u65E0\u9AD8\u5206\u6295\u8D44\u673A\u4F1A"}

## \u8868\u73B0\u6700\u4F73\u7403\u5458
${playersText}

\u8BF7\u63D0\u4F9B\uFF1A
1. **\u5E02\u573A\u6982\u51B5**\uFF1A\u5F53\u524D${sportLabel}\u7403\u661F\u5361\u5E02\u573A\u6574\u4F53\u8D70\u52BF\u5206\u6790
2. **\u91CD\u70B9\u63A8\u8350**\uFF1A\u8BE6\u7EC6\u5206\u6790\u524D3\u5F20\u6700\u5177\u6295\u8D44\u4EF7\u503C\u7684\u5361\u7247\uFF0C\u5305\u62EC\u4E70\u5165\u7406\u7531\u3001\u76EE\u6807\u4EF7\u4F4D\u548C\u98CE\u9669\u63D0\u793A
3. **\u7403\u5458\u52A8\u6001**\uFF1A\u5206\u6790\u8868\u73B0\u6700\u4F73\u7403\u5458\u7684\u5361\u7247\u6295\u8D44\u4EF7\u503C
4. **\u98CE\u9669\u63D0\u793A**\uFF1A\u5F53\u524D\u5E02\u573A\u4E3B\u8981\u98CE\u9669\u56E0\u7D20\uFF08\u4F24\u75C5\u3001\u8D5B\u7A0B\u3001\u5E02\u573A\u60C5\u7EEA\u7B49\uFF09
5. **\u64CD\u4F5C\u5EFA\u8BAE**\uFF1A\u5177\u4F53\u7684\u4E70\u5165/\u6301\u6709/\u5356\u51FA\u5EFA\u8BAE\uFF0C\u5305\u62EC\u4EF7\u683C\u533A\u95F4

\u8BF7\u7528\u4E13\u4E1A\u4F46\u6613\u61C2\u7684\u8BED\u8A00\uFF0C\u7ED3\u5408\u5177\u4F53\u6570\u636E\uFF0C\u7ED9\u51FA\u6709\u5B9E\u9645\u64CD\u4F5C\u4EF7\u503C\u7684\u6295\u8D44\u5EFA\u8BAE\u3002`;
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E13\u4E1A\u7684\u7403\u661F\u5361\u6295\u8D44\u5206\u6790\u5E08\uFF0C\u64C5\u957F\u7ED3\u5408\u7403\u5458\u8868\u73B0\u6570\u636E\u548C\u5E02\u573A\u4EF7\u683C\u5206\u6790\u6295\u8D44\u673A\u4F1A\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u683C\u5F0F\u6E05\u6670\uFF0C\u6570\u636E\u51C6\u786E\u3002" },
        { role: "user", content: prompt }
      ]
    });
    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "\u62A5\u544A\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002";
    const title = `${sportLabel}\u7403\u661F\u5361\u6295\u8D44\u62A5\u544A - ${(/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN")}`;
    const reportId = await saveInvestmentReport({
      userId: 1,
      title,
      sport: input.sport,
      content,
      topDeals: deals.slice(0, 5).map((c) => c.id)
    });
    await createNotification({
      userId: 1,
      type: "report_ready",
      title: "\u6295\u8D44\u62A5\u544A\u5DF2\u751F\u6210",
      content: `\u60A8\u7684${sportLabel}\u7403\u661F\u5361\u6295\u8D44\u5206\u6790\u62A5\u544A\u5DF2\u51C6\u5907\u597D\uFF0C\u53D1\u73B0 ${deals.length} \u4E2A\u6295\u8D44\u673A\u4F1A\u3002`
    });
    return { reportId, title, content };
  }),
  getAll: publicProcedure.query(async () => {
    return getUserReports(1);
  }),
  getById: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
    return getReportById(input.id, 1);
  })
});
var scannerRouter = router({
  runScan: publicProcedure.input(z4.object({ triggeredBy: z4.enum(["manual", "auto"]).optional() }).optional()).mutation(async ({ input }) => {
    const triggeredBy = input?.triggeredBy ?? "manual";
    const jobId = await createScanJob(triggeredBy);
    await updateScanJob(jobId, { status: "running" });
    try {
      const { playersSeeded, cardsSeeded } = await seedDatabase();
      const allCards = await getAllCards(void 0, 200);
      const trendBoard = await buildMarketIntelligenceBoard(24);
      const dailyTrendSummary = await buildDailyTrendSummary(24, "24H");
      const portfolioItems = await getUserPortfolio(1);
      const portfolioCardIds = new Set(portfolioItems.map((item) => item.cardId));
      const allWatchlistItems = await getAllWatchlistItems();
      const allTrendItems = [...trendBoard.bullish, ...trendBoard.neutral, ...trendBoard.bearish];
      for (const item of allTrendItems) {
        const previous = await getLatestTrendSnapshot(item.cardId);
        await insertTrendSnapshot({
          cardId: item.cardId,
          trend: item.trend,
          confidence: item.confidence,
          compositeScore: item.compositeScore,
          source: "scan",
          notes: item.summary
        });
        const isReversalToBearish = previous && previous.trend !== "bearish" && item.trend === "bearish";
        const watched = allWatchlistItems.some((entry) => entry.userId === 1 && entry.cardId === item.cardId);
        const held = portfolioCardIds.has(item.cardId);
        if (isReversalToBearish && (watched || held)) {
          await createNotification({
            userId: 1,
            type: "price_drop",
            title: `\u8D8B\u52BF\u53CD\u8F6C\u9884\u8B66\uFF1A${item.playerName}`,
            content: `${item.title} \u5DF2\u4ECE ${previous.trend} \u8F6C\u4E3A bearish\uFF0C\u7EFC\u5408\u5206 ${item.compositeScore}\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u8BC4\u4F30\u4ED3\u4F4D\u4E0E\u5173\u6CE8\u6761\u4EF6\u3002`,
            cardId: item.cardId
          });
        }
      }
      let dealsFound = 0;
      const dealCards = [];
      for (const card of allCards) {
        if (card.isDealOpportunity) {
          dealsFound++;
          dealCards.push(card);
        }
      }
      const watchlistByUser = /* @__PURE__ */ new Map();
      for (const item of allWatchlistItems) {
        if (!watchlistByUser.has(item.userId)) watchlistByUser.set(item.userId, []);
        watchlistByUser.get(item.userId).push(item);
      }
      let watchlistHits = 0;
      for (const [userId, items] of Array.from(watchlistByUser.entries())) {
        const hitCards = [];
        for (const item of items) {
          if (item.cardId) {
            const matchCard = dealCards.find((c) => c.id === item.cardId);
            if (matchCard) {
              const priceOk = !item.alertPriceBelow || (matchCard.currentPrice ?? 0) <= item.alertPriceBelow;
              const scoreOk = !item.alertDealScoreAbove || (matchCard.dealScore ?? 0) >= item.alertDealScoreAbove;
              if (priceOk && scoreOk) {
                hitCards.push(`${matchCard.playerName} ${matchCard.year ?? ""} ${matchCard.set ?? ""} (${matchCard.parallel ?? "Base"}) - \u8BC4\u5206 ${Math.round(matchCard.dealScore ?? 0)}`);
                watchlistHits++;
              }
            }
          }
          if (item.playerId && !item.cardId) {
            const playerDeals = dealCards.filter((c) => c.playerId === item.playerId);
            for (const matchCard of playerDeals) {
              const priceOk = !item.alertPriceBelow || (matchCard.currentPrice ?? 0) <= item.alertPriceBelow;
              const scoreOk = !item.alertDealScoreAbove || (matchCard.dealScore ?? 0) >= item.alertDealScoreAbove;
              if (priceOk && scoreOk) {
                hitCards.push(`${matchCard.playerName} ${matchCard.year ?? ""} ${matchCard.set ?? ""} (${matchCard.parallel ?? "Base"}) - \u8BC4\u5206 ${Math.round(matchCard.dealScore ?? 0)}`);
                watchlistHits++;
              }
            }
          }
        }
        if (hitCards.length > 0) {
          await createNotification({
            userId,
            type: "deal_alert",
            title: `\u76D1\u63A7\u5217\u8868\u547D\u4E2D ${hitCards.length} \u5F20\u5361\u7247\uFF01`,
            content: `\u4EE5\u4E0B\u7403\u661F\u5361\u5DF2\u8FBE\u5230\u4F60\u7684\u6295\u8D44\u6761\u4EF6\uFF1A
${hitCards.slice(0, 5).join("\n")}${hitCards.length > 5 ? `
\u8FD8\u6709 ${hitCards.length - 5} \u5F20\u66F4\u591A...` : ""}`
          });
        }
      }
      await updateScanJob(jobId, {
        status: "completed",
        dealsFound,
        cardsScanned: allCards.length,
        watchlistHits
      });
      if (dealsFound > 0) {
        await createNotification({
          userId: 1,
          type: "scan_complete",
          title: `\u5E02\u573A\u626B\u63CF\u5B8C\u6210${triggeredBy === "auto" ? "\uFF08\u81EA\u52A8\uFF09" : ""}`,
          content: `\u672C\u6B21\u626B\u63CF\u53D1\u73B0 ${dealsFound} \u4E2A\u6295\u8D44\u673A\u4F1A\uFF0C\u5171\u626B\u63CF ${allCards.length} \u5F20\u7403\u661F\u5361\u3002\u770B\u6DA8\u8D8B\u52BF ${trendBoard.bullish.length} \u5F20\uFF0C\u98CE\u9669\u9884\u8B66 ${trendBoard.bearish.length} \u5F20\u3002${dailyTrendSummary.summary}${watchlistHits > 0 ? `\u76D1\u63A7\u5217\u8868\u547D\u4E2D ${watchlistHits} \u5F20\u3002` : ""}${playersSeeded > 0 ? `\u65B0\u589E ${playersSeeded} \u4F4D\u7403\u5458\u6570\u636E\u3002` : ""}`
        });
        await notifyOwner({
          title: `\u7403\u661F\u5361\u5E02\u573A\u626B\u63CF\u5B8C\u6210${triggeredBy === "auto" ? "\uFF08\u81EA\u52A8\uFF09" : ""}`,
          content: `\u53D1\u73B0 ${dealsFound} \u4E2A\u6295\u8D44\u673A\u4F1A\uFF0C\u5171\u626B\u63CF ${allCards.length} \u5F20\u7403\u661F\u5361\u3002\u770B\u6DA8\u8D8B\u52BF ${trendBoard.bullish.length} \u5F20\uFF0C\u98CE\u9669\u9884\u8B66 ${trendBoard.bearish.length} \u5F20\u3002${dailyTrendSummary.summary}${watchlistHits > 0 ? `\u76D1\u63A7\u5217\u8868\u547D\u4E2D ${watchlistHits} \u5F20\u3002` : ""}`
        });
      }
      return { jobId, dealsFound, cardsScanned: allCards.length, watchlistHits, playersSeeded, cardsSeeded, trendBoard };
    } catch (err) {
      await updateScanJob(jobId, { status: "failed", errorMessage: err.message });
      throw err;
    }
  }),
  getLatestJob: publicProcedure.query(async () => {
    return getLatestScanJob();
  }),
  // 获取扫描历史记录（最近 10 次）
  getTrendHistory: publicProcedure.input(z4.object({ cardId: z4.number(), limit: z4.number().min(1).max(60).optional() })).query(async ({ input }) => {
    return getTrendHistory(input.cardId, input.limit ?? 20);
  }),
  getDailyTrendSummary: publicProcedure.input(z4.object({ limit: z4.number().min(6).max(60).optional(), window: z4.enum(["24H", "7D", "30D"]).optional() }).optional()).query(async ({ input }) => {
    return buildDailyTrendSummary(input?.limit ?? 20, input?.window ?? "24H");
  }),
  getTrendMovers: publicProcedure.input(z4.object({ limit: z4.number().min(6).max(60).optional(), window: z4.enum(["24H", "7D", "30D"]).optional() }).optional()).query(async ({ input }) => {
    return buildTrendMoversBoard(input?.limit ?? 20, resolveHistoryOffset(input?.window ?? "24H"));
  }),
  getTrendBoard: publicProcedure.input(z4.object({ limit: z4.number().min(6).max(60).optional() }).optional()).query(async ({ input }) => {
    return buildMarketIntelligenceBoard(input?.limit ?? 18);
  }),
  getHistory: publicProcedure.input(z4.object({ limit: z4.number().min(1).max(50).optional() })).query(async ({ input }) => {
    return getScanJobHistory(input.limit ?? 10);
  }),
  // 清除旧数据并重新塞入真实演示数据（临时工具）
  reseedAll: publicProcedure.mutation(async () => {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { priceHistory: priceHistory2, cards: cards2, players: players2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const db = await getDb2();
    if (db) {
      await db.delete(priceHistory2);
      await db.delete(cards2);
      await db.delete(players2);
      const rawRes = await db.insert(players2).values({ name: "Debug Insert", externalId: "debug-1" });
      return { rawRes };
    }
    return { error: "no db" };
  }),
  // 初始化种子数据（公开接口，首次使用时调用）
  initSeedData: publicProcedure.mutation(async () => {
    const result = await seedDatabase();
    return result;
  })
});
registerScanRunner(async () => {
  const jobId = await createScanJob();
  await updateScanJob(jobId, { status: "running" });
  try {
    const allCards = await getAllCards(void 0, 200);
    let dealsFound = 0;
    for (const card of allCards) {
      if (card.isDealOpportunity) dealsFound++;
    }
    await updateScanJob(jobId, { status: "completed", dealsFound, cardsScanned: allCards.length });
    return { dealsFound, cardsScanned: allCards.length };
  } catch (err) {
    await updateScanJob(jobId, { status: "failed", errorMessage: err.message });
    throw err;
  }
});
var scheduleRouter = router({
  // 获取当前定时配置
  get: publicProcedure.query(async () => {
    return getScanSchedule();
  }),
  // 保存定时配置（创建或更新）
  upsert: publicProcedure.input(
    z4.object({
      enabled: z4.boolean(),
      hour: z4.number().min(0).max(23),
      minute: z4.number().min(0).max(59),
      timezone: z4.string().optional(),
      dealScoreThreshold: z4.number().min(0).max(100).optional()
    })
  ).mutation(async ({ input }) => {
    const nextRunAt = input.enabled ? calcNextRunAt(input.hour, input.minute) : void 0;
    await upsertScanSchedule({
      enabled: input.enabled,
      hour: input.hour,
      minute: input.minute,
      timezone: input.timezone ?? "Asia/Shanghai",
      dealScoreThreshold: input.dealScoreThreshold ?? 70,
      nextRunAt
    });
    await startScheduledScan();
    return { success: true, nextRunAt };
  }),
  // 快速开关定时扫描
  toggle: publicProcedure.input(z4.object({ enabled: z4.boolean() })).mutation(async ({ input }) => {
    const current = await getScanSchedule();
    const hour = current?.hour ?? 8;
    const minute = current?.minute ?? 0;
    const nextRunAt = input.enabled ? calcNextRunAt(hour, minute) : void 0;
    await upsertScanSchedule({
      enabled: input.enabled,
      hour,
      minute,
      timezone: current?.timezone ?? "Asia/Shanghai",
      dealScoreThreshold: current?.dealScoreThreshold ?? 70,
      nextRunAt
    });
    await startScheduledScan();
    return { success: true, enabled: input.enabled, nextRunAt };
  })
});
var boxesRouter = router({
  getIntelligence: publicProcedure.input(z4.object({ manufacturer: z4.enum(["ALL", "Panini", "Topps", "Upper Deck"]).optional() }).optional()).query(async ({ input }) => {
    return getBoxIntelligence(input?.manufacturer ?? "ALL");
  }),
  getById: publicProcedure.input(z4.object({ id: z4.string() })).query(async ({ input }) => {
    return getBoxById(input.id);
  })
});
var signalSettingsRouter = router({
  get: publicProcedure.query(async () => {
    return getSignalSettings();
  }),
  update: publicProcedure.input(z4.object({ onCourt: z4.number().min(0).max(100), offCourt: z4.number().min(0).max(100), market: z4.number().min(0).max(100) })).mutation(async ({ input }) => {
    return updateSignalSettings(input);
  }),
  reset: publicProcedure.mutation(async () => {
    return resetSignalSettings();
  })
});
var multiPlatformRouter = router({
  // 多平台数据查询（卡淘 + 闲鱼 + 小红书）
  search: publicProcedure.input(z4.object({
    playerName: z4.string(),
    year: z4.number().optional(),
    brand: z4.string().optional(),
    grade: z4.string().optional(),
    pageSize: z4.number().optional()
  })).query(async ({ input }) => {
    return getMultiPlatformData(input.playerName, {
      year: input.year,
      brand: input.brand,
      grade: input.grade,
      pageSize: input.pageSize || 15
    });
  }),
  // 卡淘 Klay Thompson 专项数据
  klayKatao: publicProcedure.input(z4.object({
    status: z4.union([z4.literal(1), z4.literal(-2)]).optional(),
    page: z4.number().optional(),
    pageSize: z4.number().optional(),
    extraKeywords: z4.string().optional()
  })).query(async ({ input }) => {
    return getKataoKlayData({
      status: input.status,
      page: input.page || 1,
      pageSize: input.pageSize || 20,
      extraKeywords: input.extraKeywords
    });
  })
});
var externalMarketRouter = router({
  // eBay + 卡淘实时市场数据
  getMarketData: publicProcedure.input(z4.object({
    playerName: z4.string(),
    year: z4.number().optional(),
    brand: z4.string().optional(),
    parallel: z4.string().optional(),
    grade: z4.string().optional()
  })).query(async ({ input }) => {
    return getMarketData(input.playerName, {
      year: input.year,
      brand: input.brand,
      parallel: input.parallel,
      grade: input.grade
    });
  }),
  // AI 趋势分析
  analyzeCardTrend: publicProcedure.input(z4.object({
    playerName: z4.string(),
    sport: z4.string(),
    team: z4.string().optional(),
    year: z4.number(),
    brand: z4.string(),
    parallel: z4.string().optional(),
    grade: z4.string().optional(),
    currentPrice: z4.number(),
    avgPrice30d: z4.number().optional(),
    priceChange7d: z4.number().optional(),
    performanceScore: z4.number().optional(),
    priceHistory: z4.array(z4.object({
      date: z4.string(),
      price: z4.number(),
      source: z4.string()
    })).optional(),
    ebayListings: z4.array(z4.object({
      price: z4.number(),
      soldDate: z4.string(),
      grade: z4.string()
    })).optional(),
    kataoListings: z4.array(z4.object({
      price: z4.number(),
      soldDate: z4.string(),
      grade: z4.string(),
      currency: z4.string()
    })).optional()
  })).query(async ({ input }) => {
    return analyzeCardTrend2({
      playerName: input.playerName,
      sport: input.sport,
      team: input.team || "",
      year: input.year,
      brand: input.brand,
      parallel: input.parallel || "Base",
      grade: input.grade || "Raw",
      currentPrice: input.currentPrice,
      avgPrice30d: input.avgPrice30d || input.currentPrice,
      priceChange7d: input.priceChange7d || 0,
      performanceScore: input.performanceScore || 75,
      priceHistory: input.priceHistory || [],
      ebayListings: input.ebayListings,
      kataoListings: input.kataoListings
    });
  })
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  cards: cardsRouter,
  players: playersRouter,
  watchlist: watchlistRouter,
  notifications: notificationsRouter,
  reports: reportsRouter,
  scanner: scannerRouter,
  schedule: scheduleRouter,
  signalSettings: signalSettingsRouter,
  portfolio: portfolioRouter,
  marketData: marketDataRouter,
  boxes: boxesRouter,
  externalMarket: externalMarketRouter,
  multiPlatform: multiPlatformRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "wouter"],
          trpc: ["@trpc/client", "@trpc/react-query", "@tanstack/react-query", "superjson"],
          charts: ["recharts", "lightweight-charts"],
          motion: ["framer-motion"],
          ui: ["lucide-react", "sonner"]
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.get("/api/proxy-image", async (req, res) => {
    const url = req.query.url;
    if (!url) {
      res.status(400).send("Missing url");
      return;
    }
    const allowed = ["r2.thesportsdb.com", "www.thesportsdb.com", "a.espncdn.com", "cdn.nba.com"];
    let isAllowed = false;
    try {
      const parsed = new URL(url);
      isAllowed = allowed.some((d) => parsed.hostname === d);
    } catch {
    }
    if (!isAllowed) {
      res.status(403).send("Domain not allowed");
      return;
    }
    try {
      const https4 = await import("https");
      const http4 = await import("http");
      const protocol = url.startsWith("https") ? https4 : http4;
      protocol.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (imgRes) => {
        res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Access-Control-Allow-Origin", "*");
        imgRes.pipe(res);
      }).on("error", () => res.status(502).send("Proxy error"));
    } catch {
      res.status(500).send("Server error");
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
  setTimeout(() => {
    initCronScheduler().catch((err) => console.error("[CronScheduler] Init failed:", err));
  }, 2e3);
}
startServer().catch(console.error);
