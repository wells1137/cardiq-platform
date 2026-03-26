import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 球员表（缓存 BallDontLie API 数据）
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique(), // BallDontLie player ID
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

// 球星卡表
export const cards = mysqlTable("cards", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 128 }).notNull(),
  sport: mysqlEnum("sport", ["NBA", "NFL", "MLB", "NHL", "EPL"]).notNull().default("NBA"),
  year: int("year"),
  brand: varchar("brand", { length: 64 }), // Panini, Topps, Upper Deck 等
  set: varchar("set", { length: 128 }), // Prizm, Select, Mosaic 等
  cardNumber: varchar("cardNumber", { length: 32 }),
  parallel: varchar("parallel", { length: 64 }), // Base, Silver, Gold, PSA 10 等
  grade: varchar("grade", { length: 32 }), // PSA 10, BGS 9.5 等
  population: int("population"), // PSA 人口报告
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

// 价格历史记录表
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  price: float("price").notNull(),
  source: mysqlEnum("source", ["ebay", "cardhedge", "pwcc", "manual"]).default("ebay"),
  saleDate: timestamp("saleDate").notNull(),
  condition: varchar("condition", { length: 32 }),
  listingUrl: text("listingUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

// 用户监控列表
export const watchlist = mysqlTable("watchlist", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = typeof watchlist.$inferInsert;

// 应用内通知表
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deal_alert", "price_drop", "scan_complete", "report_ready"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  cardId: int("cardId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// AI 投资报告表
export const investmentReports = mysqlTable("investment_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  sport: varchar("sport", { length: 32 }),
  content: text("content").notNull(), // LLM 生成的 Markdown 报告
  topDeals: json("topDeals"), // 报告中推荐的卡片 ID 列表
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestmentReport = typeof investmentReports.$inferSelect;
export type InsertInvestmentReport = typeof investmentReports.$inferInsert;

// 资产组合持仓表
export const portfolioPositions = mysqlTable("portfolio_positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: int("cardId").notNull(),
  quantity: float("quantity").default(1).notNull(),
  averageCost: float("averageCost").notNull(),
  targetPrice: float("targetPrice"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type InsertPortfolioPosition = typeof portfolioPositions.$inferInsert;

// 趋势快照表
export const trendSnapshots = mysqlTable("trend_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  trend: mysqlEnum("trend", ["bullish", "neutral", "bearish"]).notNull(),
  confidence: int("confidence").notNull(),
  compositeScore: int("compositeScore").notNull(),
  source: mysqlEnum("source", ["scan", "detail", "manual"]).default("scan").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrendSnapshot = typeof trendSnapshots.$inferSelect;
export type InsertTrendSnapshot = typeof trendSnapshots.$inferInsert;

// 市场扫描任务记录
export const scanJobs = mysqlTable("scan_jobs", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
  triggeredBy: mysqlEnum("triggeredBy", ["manual", "auto"]).default("manual").notNull(),
  dealsFound: int("dealsFound").default(0),
  cardsScanned: int("cardsScanned").default(0),
  watchlistHits: int("watchlistHits").default(0), // 命中监控列表的数量
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScanJob = typeof scanJobs.$inferSelect;
export type InsertScanJob = typeof scanJobs.$inferInsert;

// 定时扫描配置表（全局单条记录，每次 upsert）
export const scanSchedule = mysqlTable("scan_schedule", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScanSchedule = typeof scanSchedule.$inferSelect;
export type InsertScanSchedule = typeof scanSchedule.$inferInsert;
