import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Card,
  InsertCard,
  InsertNotification,
  InsertPlayer,
  InsertPortfolioPosition,
  InsertPriceHistory,
  InsertTrendSnapshot,
  InsertWatchlist,
  Notification,
  Player,
  PortfolioPosition,
  PriceHistory,
  TrendSnapshot,
  Watchlist,
  cards,
  investmentReports,
  notifications,
  players,
  portfolioPositions,
  priceHistory,
  trendSnapshots,
  scanJobs,
  scanSchedule,
  users,
  watchlist,
  InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { MOCK_PLAYERS, MOCK_CARDS, MOCK_NOTIFICATIONS, MOCK_PORTFOLIO_POSITIONS, MOCK_PRICE_HISTORY, MOCK_REPORTS, MOCK_TREND_SNAPSHOTS, MOCK_WATCHLIST } from "./mockDb";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Players ───────────────────────────────────────────────────────────────

export async function upsertPlayer(player: InsertPlayer): Promise<void> {
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
      updatedAt: new Date(),
    },
  });
}

export async function getPlayerByExternalId(externalId: string): Promise<Player | undefined> {
  const db = await getDb();
  if (!db) return MOCK_PLAYERS.find(p => p.externalId === externalId) as any;
  const result = await db.select().from(players).where(eq(players.externalId, externalId)).limit(1);
  return result[0];
}

export async function searchPlayers(query: string, sport?: string): Promise<Player[]> {
  const db = await getDb();
  if (!db) {
     return MOCK_PLAYERS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) && (!sport || sport === "ALL" || p.sport === sport)).slice(0, 20) as any;
  }
  const conditions = [sql`${players.name} LIKE ${`%${query}%`}`];
  if (sport && sport !== "ALL") {
    conditions.push(eq(players.sport, sport as Player["sport"]));
  }
  return db.select().from(players).where(and(...conditions)).limit(20);
}

export async function getPlayerById(id: number): Promise<Player | undefined> {
  const db = await getDb();
  if (!db) return MOCK_PLAYERS.find((player) => player.id === id) as any;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result[0];
}

export async function getTopPlayers(sport?: string, limit = 20): Promise<Player[]> {
  const db = await getDb();
  if (!db) {
     return MOCK_PLAYERS.filter(p => !sport || sport === "ALL" || p.sport === sport).sort((a,b) => b.performanceScore - a.performanceScore).slice(0, limit) as any;
  }
  const conditions = sport && sport !== "ALL" ? [eq(players.sport, sport as Player["sport"])] : [];
  return db
    .select()
    .from(players)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(players.performanceScore))
    .limit(limit);
}

// ─── Cards ─────────────────────────────────────────────────────────────────

export async function upsertCard(card: InsertCard): Promise<number> {
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
      updatedAt: new Date(),
    },
  });
  return (result[0] as any).insertId ?? 0;
}

export async function getCardById(id: number): Promise<Card | undefined> {
  const db = await getDb();
  if (!db) return MOCK_CARDS.find(c => c.id === id);
  const result = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return result[0];
}

export async function getCardsByPlayer(playerId: number): Promise<Card[]> {
  const db = await getDb();
  if (!db) return MOCK_CARDS.filter(c => c.playerId === playerId).sort((a,b) => b.dealScore - a.dealScore);
  return db.select().from(cards).where(eq(cards.playerId, playerId)).orderBy(desc(cards.dealScore));
}

export async function getDealOpportunities(sport?: string, limit = 30): Promise<Card[]> {
  const db = await getDb();
  if (!db) {
     return MOCK_CARDS.filter(c => c.isDealOpportunity && (!sport || sport === "ALL" || c.sport === sport)).sort((a,b) => b.dealScore - a.dealScore).slice(0, limit);
  }
  const conditions = [eq(cards.isDealOpportunity, true)];
  if (sport && sport !== "ALL") {
    conditions.push(eq(cards.sport, sport as Card["sport"]));
  }
  return db
    .select()
    .from(cards)
    .where(and(...conditions))
    .orderBy(desc(cards.dealScore))
    .limit(limit);
}

export async function getAllCards(sport?: string, limit = 200): Promise<Card[]> {
  const db = await getDb();
  if (!db) {
     return MOCK_CARDS.filter(c => !sport || sport === "ALL" || c.sport === sport).sort((a,b) => b.dealScore - a.dealScore).slice(0, limit);
  }
  const conditions = sport && sport !== "ALL" ? [eq(cards.sport, sport as Card["sport"])] : [];
  return db
    .select()
    .from(cards)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(cards.dealScore))
    .limit(limit);
}

// ─── Price History ──────────────────────────────────────────────────────────

export async function insertPriceHistory(record: InsertPriceHistory): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(priceHistory).values(record);
}

export async function getPriceHistory(cardId: number, days = 90): Promise<PriceHistory[]> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  if (!db) {
     return MOCK_PRICE_HISTORY.filter(ph => ph.cardId === cardId && ph.saleDate >= since).sort((a,b) => a.saleDate.getTime() - b.saleDate.getTime()) as any;
  }
  return db
    .select()
    .from(priceHistory)
    .where(and(eq(priceHistory.cardId, cardId), gte(priceHistory.saleDate, since)))
    .orderBy(priceHistory.saleDate);
}

// ─── Watchlist ──────────────────────────────────────────────────────────────

export async function getUserWatchlist(userId: number): Promise<Watchlist[]> {
  const db = await getDb();
  if (!db) return MOCK_WATCHLIST.filter((item) => item.userId === userId).sort((a, b) => b.id - a.id) as any;
  return db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(desc(watchlist.createdAt));
}

export async function addToWatchlist(item: InsertWatchlist): Promise<void> {
  const db = await getDb();
  if (!db) {
    const exists = MOCK_WATCHLIST.find((entry) => entry.userId === item.userId && ((item.cardId && entry.cardId === item.cardId) || (item.playerId && entry.playerId === item.playerId)));
    if (exists) return;
    const nextId = (MOCK_WATCHLIST[0]?.id ?? 0) + 1;
    MOCK_WATCHLIST.unshift({ id: nextId, createdAt: new Date(), updatedAt: new Date(), ...item });
    return;
  }
  const conditions = [eq(watchlist.userId, item.userId)];
  if (item.cardId) conditions.push(eq(watchlist.cardId, item.cardId));
  if (item.playerId) conditions.push(eq(watchlist.playerId, item.playerId));
  const existing = await db.select().from(watchlist).where(and(...conditions)).limit(1);
  if (existing[0]) return;
  await db.insert(watchlist).values(item);
}

export async function removeFromWatchlist(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const index = MOCK_WATCHLIST.findIndex((item) => item.id === id && item.userId === userId);
    if (index >= 0) MOCK_WATCHLIST.splice(index, 1);
    return;
  }
  await db.delete(watchlist).where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));
}

export async function updateWatchlistItem(
  id: number,
  userId: number,
  data: Partial<InsertWatchlist>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_WATCHLIST.find((item) => item.id === id && item.userId === userId);
    if (existing) Object.assign(existing, data, { updatedAt: new Date() });
    return;
  }
  await db
    .update(watchlist)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));
}

// 获取所有用户的监控列表（扫描时使用）
export async function getAllWatchlistItems(): Promise<Watchlist[]> {
  const db = await getDb();
  if (!db) return MOCK_WATCHLIST as any;
  return db.select().from(watchlist);
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function createNotification(notif: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) {
    const nextId = (MOCK_NOTIFICATIONS[0]?.id ?? 0) + 1;
    MOCK_NOTIFICATIONS.unshift({ id: nextId, isRead: false, createdAt: new Date(), ...notif });
    return;
  }
  await db.insert(notifications).values(notif);
}

export async function getUserNotifications(userId: number, limit = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return MOCK_NOTIFICATIONS.filter((item) => item.userId === userId).slice(0, limit) as any;
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_NOTIFICATIONS.find((item) => item.id === id && item.userId === userId);
    if (existing) existing.isRead = true;
    return;
  }
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    MOCK_NOTIFICATIONS.filter((item) => item.userId === userId).forEach((item) => item.isRead = true);
    return;
  }
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return MOCK_NOTIFICATIONS.filter((item) => item.userId === userId && !item.isRead).length;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Investment Reports ──────────────────────────────────────────────────────

export async function saveInvestmentReport(data: {
  userId: number;
  title: string;
  sport?: string;
  content: string;
  topDeals?: number[];
}): Promise<number> {
  const db = await getDb();
  if (!db) {
    const nextId = (MOCK_REPORTS[0]?.id ?? 0) + 1;
    MOCK_REPORTS.unshift({ id: nextId, createdAt: new Date(), ...data });
    return nextId;
  }
  const result = await db.insert(investmentReports).values({
    userId: data.userId,
    title: data.title,
    sport: data.sport,
    content: data.content,
    topDeals: data.topDeals ?? [],
  });
  return (result[0] as any).insertId ?? 0;
}

export async function getUserReports(userId: number) {
  const db = await getDb();
  if (!db) return MOCK_REPORTS.filter((item) => item.userId === userId) as any;
  return db
    .select()
    .from(investmentReports)
    .where(eq(investmentReports.userId, userId))
    .orderBy(desc(investmentReports.createdAt))
    .limit(20);
}

export async function getReportById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return MOCK_REPORTS.find((item) => item.id === id && item.userId === userId) as any;
  const result = await db
    .select()
    .from(investmentReports)
    .where(and(eq(investmentReports.id, id), eq(investmentReports.userId, userId)))
    .limit(1);
  return result[0];
}

// ─── Scan Jobs ──────────────────────────────────────────────────────────────

export async function createScanJob(triggeredBy: "manual" | "auto" = "manual"): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(scanJobs).values({ status: "pending", triggeredBy });
  return (result as any).insertId ?? 0;
}

export async function updateScanJob(
  id: number,
  data: { status?: "running" | "completed" | "failed"; dealsFound?: number; cardsScanned?: number; watchlistHits?: number; errorMessage?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "running") updateData.startedAt = new Date();
  if (data.status === "completed" || data.status === "failed") updateData.completedAt = new Date();
  await db.update(scanJobs).set(updateData).where(eq(scanJobs.id, id));
}

export async function getLatestScanJob() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scanJobs).orderBy(desc(scanJobs.createdAt)).limit(1);
  return result[0];
}

export async function getScanJobHistory(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scanJobs).orderBy(desc(scanJobs.createdAt)).limit(limit);
}

// ─── Scan Schedule ──────────────────────────────────────────────────────────
export async function getScanSchedule() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scanSchedule).limit(1);
  return result[0];
}

export async function upsertScanSchedule(data: {
  enabled: boolean;
  hour: number;
  minute: number;
  timezone?: string;
  dealScoreThreshold?: number;
  nextRunAt?: Date;
}) {
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
      nextRunAt: data.nextRunAt,
    }).where(eq(scanSchedule.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(scanSchedule).values({
      enabled: data.enabled,
      hour: data.hour,
      minute: data.minute,
      timezone: data.timezone ?? "Asia/Shanghai",
      dealScoreThreshold: data.dealScoreThreshold ?? 70,
      nextRunAt: data.nextRunAt,
    });
    return (result as any).insertId ?? 0;
  }
}

export async function updateScheduleLastRun(id: number, lastRunAt: Date, nextRunAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(scanSchedule).set({ lastRunAt, nextRunAt }).where(eq(scanSchedule.id, id));
}


// ─── Portfolio ──────────────────────────────────────────────────────────────

let mockPortfolioIdCounter = MOCK_PORTFOLIO_POSITIONS.length + 1;

export async function getUserPortfolio(userId: number): Promise<PortfolioPosition[]> {
  const db = await getDb();
  if (!db) {
    return MOCK_PORTFOLIO_POSITIONS.filter((item) => item.userId === userId).sort((a, b) => b.id - a.id) as any;
  }
  return db.select().from(portfolioPositions).where(eq(portfolioPositions.userId, userId)).orderBy(desc(portfolioPositions.createdAt));
}

export async function addPortfolioPosition(item: InsertPortfolioPosition): Promise<void> {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_PORTFOLIO_POSITIONS.find((position) => position.userId === item.userId && position.cardId === item.cardId);
    if (existing) {
      const totalQuantity = Number(existing.quantity) + Number(item.quantity ?? 1);
      const totalCost = Number(existing.averageCost) * Number(existing.quantity) + Number(item.averageCost) * Number(item.quantity ?? 1);
      existing.quantity = totalQuantity;
      existing.averageCost = totalCost / totalQuantity;
      existing.targetPrice = item.targetPrice ?? existing.targetPrice;
      existing.notes = item.notes ?? existing.notes;
      existing.updatedAt = new Date();
      return;
    }
    MOCK_PORTFOLIO_POSITIONS.unshift({
      id: mockPortfolioIdCounter++,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...item,
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
      updatedAt: new Date(),
    }).where(eq(portfolioPositions.id, existing[0].id));
    return;
  }

  await db.insert(portfolioPositions).values(item);
}

export async function updatePortfolioPosition(id: number, userId: number, data: Partial<InsertPortfolioPosition>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const existing = MOCK_PORTFOLIO_POSITIONS.find((position) => position.id === id && position.userId === userId);
    if (!existing) return;
    Object.assign(existing, data, { updatedAt: new Date() });
    return;
  }
  await db.update(portfolioPositions).set({ ...data, updatedAt: new Date() }).where(and(eq(portfolioPositions.id, id), eq(portfolioPositions.userId, userId)));
}

export async function removePortfolioPosition(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const idx = MOCK_PORTFOLIO_POSITIONS.findIndex((position) => position.id === id && position.userId === userId);
    if (idx >= 0) MOCK_PORTFOLIO_POSITIONS.splice(idx, 1);
    return;
  }
  await db.delete(portfolioPositions).where(and(eq(portfolioPositions.id, id), eq(portfolioPositions.userId, userId)));
}

export async function getPortfolioSummary(userId: number) {
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
    unrealizedPnLPercent: costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0,
  };
}


// ─── Trend Snapshots ───────────────────────────────────────────────────────

let mockTrendSnapshotIdCounter = MOCK_TREND_SNAPSHOTS.length + 1;

export async function insertTrendSnapshot(item: InsertTrendSnapshot): Promise<void> {
  const db = await getDb();
  if (!db) {
    MOCK_TREND_SNAPSHOTS.unshift({ id: mockTrendSnapshotIdCounter++, createdAt: new Date(), ...item });
    return;
  }
  await db.insert(trendSnapshots).values(item);
}

export async function getTrendHistory(cardId: number, limit = 20): Promise<TrendSnapshot[]> {
  const db = await getDb();
  if (!db) {
    return MOCK_TREND_SNAPSHOTS.filter((item) => item.cardId === cardId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit) as any;
  }
  return db.select().from(trendSnapshots).where(eq(trendSnapshots.cardId, cardId)).orderBy(desc(trendSnapshots.createdAt)).limit(limit);
}

export async function getLatestTrendSnapshot(cardId: number): Promise<TrendSnapshot | undefined> {
  const history = await getTrendHistory(cardId, 1);
  return history[0];
}
