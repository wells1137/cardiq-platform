import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  getDealOpportunities,
  getAllCards,
  getCardById,
  getCardsByPlayer,
  getPriceHistory,
  getTrendHistory,
  getLatestTrendSnapshot,
  getTopPlayers,
  searchPlayers,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  createNotification,
  saveInvestmentReport,
  getUserReports,
  getReportById,
  createScanJob,
  updateScanJob,
  getLatestScanJob,
  getScanJobHistory,
  getPlayerByExternalId,
  upsertPlayer,
  upsertCard,
  insertPriceHistory,
  getScanSchedule,
  upsertScanSchedule,
  getAllWatchlistItems,
  getUserPortfolio,
  insertTrendSnapshot,
} from "./db";
import { seedDatabase, generateCardData } from "./sportsDataService";
import { calcNextRunAt, startScheduledScan, registerScanRunner } from "./cronScheduler";
import { portfolioRouter } from "./portfolioRouter";
import { marketDataRouter } from "./marketDataRouter";
import { analyzeCardTrend } from "./cardAnalysisService";
import { getCardTrendIntelligence } from "./signalIntelligenceService";
import { buildDailyTrendSummary, buildMarketIntelligenceBoard, buildTrendMoversBoard, resolveHistoryOffset } from "./marketIntelligenceService";
import { getSignalSettings, resetSignalSettings, updateSignalSettings } from "./signalConfigService";
import { getBoxById, getBoxIntelligence } from "./boxIntelligenceService";
import { buildSignalCenterBoard } from "./signalCenterService";
import { chatWithCardAdvisor } from "./cardChatService";
import { getMarketData } from "./externalDataService";
import { analyzeCardTrend as analyzeCardTrendAI } from "./aiAnalysisService";
import { getMultiPlatformData, getKataoKlayData } from "./multiPlatformService";

// ─── Cards Router ─────────────────────────────────────────────────────────────

const cardsRouter = router({
  getDealOpportunities: publicProcedure
    .input(z.object({ sport: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getDealOpportunities(input.sport, input.limit ?? 30);
    }),

  getAll: publicProcedure
    .input(z.object({ sport: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getAllCards(input.sport, input.limit ?? 500);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCardById(input.id);
    }),

  getByPlayer: publicProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      return getCardsByPlayer(input.playerId);
    }),

  getPriceHistory: publicProcedure
    .input(z.object({ cardId: z.number(), days: z.number().optional() }))
    .query(async ({ input }) => {
      return getPriceHistory(input.cardId, input.days ?? 90);
    }),


  getTrendIntelligence: publicProcedure
    .input(z.object({ cardId: z.number() }))
    .query(async ({ input }) => {
      return getCardTrendIntelligence(input.cardId);
    }),

  // AI 趋势分析功能
  getTrendHistory: publicProcedure
    .input(z.object({ cardId: z.number(), limit: z.number().min(1).max(60).optional() }))
    .query(async ({ input }) => {
      return getTrendHistory(input.cardId, input.limit ?? 20);
    }),

  getDailyTrendSummary: publicProcedure
    .input(z.object({ limit: z.number().min(6).max(60).optional(), window: z.enum(["24H", "7D", "30D"]).optional() }).optional())
    .query(async ({ input }) => {
      return buildDailyTrendSummary(input?.limit ?? 20, input?.window ?? "24H");
    }),

  getTrendMovers: publicProcedure
    .input(z.object({ limit: z.number().min(6).max(60).optional(), window: z.enum(["24H", "7D", "30D"]).optional() }).optional())
    .query(async ({ input }) => {
      return buildTrendMoversBoard(input?.limit ?? 20, resolveHistoryOffset(input?.window ?? "24H"));
    }),

  getTrendBoard: publicProcedure
    .input(z.object({ limit: z.number().min(6).max(60).optional() }).optional())
    .query(async ({ input }) => {
      return buildMarketIntelligenceBoard(input?.limit ?? 18);
    }),

  getSignalCenterBoard: publicProcedure
    .input(z.object({ window: z.enum(["24H", "7D", "30D"]).optional() }).optional())
    .query(async ({ input }) => {
      return buildSignalCenterBoard(input?.window ?? "24H");
    }),

  analyzeTrend: publicProcedure
    .input(z.object({ cardId: z.number() }))
    .mutation(async ({ input }) => {
      const cardRaw = await getCardById(input.cardId);
      if (!cardRaw) throw new Error("Card not found");
      const history = await getPriceHistory(input.cardId, 30);
      const intelligence = await getCardTrendIntelligence(input.cardId);
      return analyzeCardTrend({ card: cardRaw as any, history, intelligence });
    }),

  chatAdvisor: publicProcedure
    .input(z.object({
      message: z.string().min(1),
      cardId: z.number().optional(),
      compareCardId: z.number().optional(),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) })).optional(),
    }))
    .mutation(async ({ input }) => {
      return chatWithCardAdvisor(input);
    }),
});

// ─── Players Router ───────────────────────────────────────────────────────────

const playersRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string(), sport: z.string().optional() }))
    .query(async ({ input }) => {
      return searchPlayers(input.query, input.sport);
    }),

  getTop: publicProcedure
    .input(z.object({ sport: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getTopPlayers(input.sport, input.limit ?? 20);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getPlayerByExternalId, searchPlayers } = await import("./db");
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) {
         const { MOCK_PLAYERS } = await import("./mockDb");
         return MOCK_PLAYERS.find(p => p.id === input.id);
      }
      const { players } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const result = await db.select().from(players).where(eq(players.id, input.id)).limit(1);
      return result[0];
    }),
});

// ─── Watchlist Router ─────────────────────────────────────────────────────────

const watchlistRouter = router({
  get: publicProcedure.query(async () => {
    const items = await getUserWatchlist(1);
    // 附加卡片和球员信息
    const enriched = await Promise.all(
      items.map(async (item) => {
        const card = item.cardId ? await getCardById(item.cardId) : null;
        return { ...item, card };
      })
    );
    return enriched;
  }),

  add: publicProcedure
    .input(
      z.object({
        cardId: z.number().optional(),
        playerId: z.number().optional(),
        alertPriceBelow: z.number().optional(),
        alertDealScoreAbove: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await addToWatchlist({ userId: 1, ...input });
      return { success: true };
    }),

  remove: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await removeFromWatchlist(input.id, 1);
      return { success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        alertPriceBelow: z.number().optional(),
        alertDealScoreAbove: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateWatchlistItem(id, 1, data);
      return { success: true };
    }),
});

// ─── Notifications Router ─────────────────────────────────────────────────────

const notificationsRouter = router({
  get: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getUserNotifications(1, input.limit ?? 50);
    }),

  unreadCount: publicProcedure.query(async () => {
    return getUnreadNotificationCount(1);
  }),

  markRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id, 1);
      return { success: true };
    }),

  markAllRead: publicProcedure.mutation(async () => {
    await markAllNotificationsRead(1);
    return { success: true };
  }),
});

// ─── Reports Router ───────────────────────────────────────────────────────────

const reportsRouter = router({
  generate: publicProcedure
    .input(z.object({ sport: z.string().optional(), focus: z.string().optional() }))
    .mutation(async ({ input }) => {
      // 获取当前投资机会
      const deals = await getDealOpportunities(input.sport, 10);
      const topPlayers = await getTopPlayers(input.sport, 5);

      const dealsText = deals
        .slice(0, 8)
        .map(
          (c) =>
            `- ${c.playerName} ${c.year} ${c.brand} ${c.parallel} (${c.grade}): 当前价 $${c.currentPrice}, 30天均价 $${c.avgPrice30d}, 价值评分 ${c.dealScore}/100, 价格变动 ${c.priceChange7d}%`
        )
        .join("\n");

      const playersText = topPlayers
        .map((p) => `- ${p.name} (${p.team}): 表现评分 ${p.performanceScore}/100`)
        .join("\n");

      const sportLabel = input.sport && input.sport !== "ALL" ? input.sport : "多运动";
      const focusNote = input.focus ? `\n特别关注：${input.focus}` : "";

      const prompt = `你是一位专业的球星卡投资分析师。请根据以下市场数据，生成一份详细的${sportLabel}球星卡投资建议报告。${focusNote}

## 当前投资机会（按评分排序）
${dealsText || "暂无高分投资机会"}

## 表现最佳球员
${playersText}

请提供：
1. **市场概况**：当前${sportLabel}球星卡市场整体走势分析
2. **重点推荐**：详细分析前3张最具投资价值的卡片，包括买入理由、目标价位和风险提示
3. **球员动态**：分析表现最佳球员的卡片投资价值
4. **风险提示**：当前市场主要风险因素（伤病、赛程、市场情绪等）
5. **操作建议**：具体的买入/持有/卖出建议，包括价格区间

请用专业但易懂的语言，结合具体数据，给出有实际操作价值的投资建议。`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "你是专业的球星卡投资分析师，擅长结合球员表现数据和市场价格分析投资机会。请用中文回答，格式清晰，数据准确。" },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "报告生成失败，请重试。";
      const title = `${sportLabel}球星卡投资报告 - ${new Date().toLocaleDateString("zh-CN")}`;

      const reportId = await saveInvestmentReport({
        userId: 1,
        title,
        sport: input.sport,
        content,
        topDeals: deals.slice(0, 5).map((c) => c.id),
      });

      // 创建通知
      await createNotification({
        userId: 1,
        type: "report_ready",
        title: "投资报告已生成",
        content: `您的${sportLabel}球星卡投资分析报告已准备好，发现 ${deals.length} 个投资机会。`,
      });

      return { reportId, title, content };
    }),

  getAll: publicProcedure.query(async () => {
    return getUserReports(1);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getReportById(input.id, 1);
    }),
});

// ─── Scanner Router ───────────────────────────────────────────────────────────

const scannerRouter = router({
  runScan: publicProcedure
    .input(z.object({ triggeredBy: z.enum(["manual", "auto"]).optional() }).optional())
    .mutation(async ({ input }) => {
      const triggeredBy = input?.triggeredBy ?? "manual";
      const jobId = await createScanJob(triggeredBy);
      await updateScanJob(jobId, { status: "running" });

      try {
        // 初始化种子数据（如果还没有）
        const { playersSeeded, cardsSeeded } = await seedDatabase();

        // 重新计算所有卡片的价值评分
        const allCards = await getAllCards(undefined, 200);
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
            notes: item.summary,
          });

          const isReversalToBearish = previous && previous.trend !== "bearish" && item.trend === "bearish";
          const watched = allWatchlistItems.some((entry) => entry.userId === 1 && entry.cardId === item.cardId);
          const held = portfolioCardIds.has(item.cardId);
          if (isReversalToBearish && (watched || held)) {
            await createNotification({
              userId: 1,
              type: "price_drop",
              title: `趋势反转预警：${item.playerName}`,
              content: `${item.title} 已从 ${previous.trend} 转为 bearish，综合分 ${item.compositeScore}，建议重新评估仓位与关注条件。`,
              cardId: item.cardId,
            });
          }
        }
        let dealsFound = 0;
        const dealCards: typeof allCards = [];

        for (const card of allCards) {
          if (card.isDealOpportunity) {
            dealsFound++;
            dealCards.push(card);
          }
        }

        // ─── 监控列表个性化通知 ───
        // 按用户分组
        const watchlistByUser = new Map<number, typeof allWatchlistItems>();
        for (const item of allWatchlistItems) {
          if (!watchlistByUser.has(item.userId)) watchlistByUser.set(item.userId, []);
          watchlistByUser.get(item.userId)!.push(item);
        }

        let watchlistHits = 0;
        // 对每个用户检查其监控列表是否有命中
        for (const [userId, items] of Array.from(watchlistByUser.entries())) {
          const hitCards: string[] = [];
          for (const item of items) {
            // 检查卡片 ID 匹配
            if (item.cardId) {
              const matchCard = dealCards.find(c => c.id === item.cardId);
              if (matchCard) {
                // 检查价格阈值
                const priceOk = !item.alertPriceBelow || (matchCard.currentPrice ?? 0) <= item.alertPriceBelow;
                // 检查评分阈值
                const scoreOk = !item.alertDealScoreAbove || (matchCard.dealScore ?? 0) >= item.alertDealScoreAbove;
                if (priceOk && scoreOk) {
                  hitCards.push(`${matchCard.playerName} ${matchCard.year ?? ""} ${matchCard.set ?? ""} (${matchCard.parallel ?? "Base"}) - 评分 ${Math.round(matchCard.dealScore ?? 0)}`);
                  watchlistHits++;
                }
              }
            }
            // 检查球员 ID 匹配
            if (item.playerId && !item.cardId) {
              const playerDeals = dealCards.filter(c => c.playerId === item.playerId);
              for (const matchCard of playerDeals) {
                const priceOk = !item.alertPriceBelow || (matchCard.currentPrice ?? 0) <= item.alertPriceBelow;
                const scoreOk = !item.alertDealScoreAbove || (matchCard.dealScore ?? 0) >= item.alertDealScoreAbove;
                if (priceOk && scoreOk) {
                  hitCards.push(`${matchCard.playerName} ${matchCard.year ?? ""} ${matchCard.set ?? ""} (${matchCard.parallel ?? "Base"}) - 评分 ${Math.round(matchCard.dealScore ?? 0)}`);
                  watchlistHits++;
                }
              }
            }
          }
          // 如果该用户有命中卡片，发送个性化通知
          if (hitCards.length > 0) {
            await createNotification({
              userId,
              type: "deal_alert",
              title: `监控列表命中 ${hitCards.length} 张卡片！`,
              content: `以下球星卡已达到你的投资条件：\n${hitCards.slice(0, 5).join("\n")}${hitCards.length > 5 ? `\n还有 ${hitCards.length - 5} 张更多...` : ""}`,
            });
          }
        }

        await updateScanJob(jobId, {
          status: "completed",
          dealsFound,
          cardsScanned: allCards.length,
          watchlistHits,
        });

        // 全局扫描完成通知（发给触发用户）
        if (dealsFound > 0) {
          await createNotification({
            userId: 1,
            type: "scan_complete",
            title: `市场扫描完成${triggeredBy === "auto" ? "（自动）" : ""}`,
            content: `本次扫描发现 ${dealsFound} 个投资机会，共扫描 ${allCards.length} 张球星卡。看涨趋势 ${trendBoard.bullish.length} 张，风险预警 ${trendBoard.bearish.length} 张。${dailyTrendSummary.summary}${watchlistHits > 0 ? `监控列表命中 ${watchlistHits} 张。` : ""}${playersSeeded > 0 ? `新增 ${playersSeeded} 位球员数据。` : ""}`,
          });

          // 通知 Owner
          await notifyOwner({
            title: `球星卡市场扫描完成${triggeredBy === "auto" ? "（自动）" : ""}`,
            content: `发现 ${dealsFound} 个投资机会，共扫描 ${allCards.length} 张球星卡。看涨趋势 ${trendBoard.bullish.length} 张，风险预警 ${trendBoard.bearish.length} 张。${dailyTrendSummary.summary}${watchlistHits > 0 ? `监控列表命中 ${watchlistHits} 张。` : ""}`,
          });
        }

        return { jobId, dealsFound, cardsScanned: allCards.length, watchlistHits, playersSeeded, cardsSeeded, trendBoard };
      } catch (err: any) {
        await updateScanJob(jobId, { status: "failed", errorMessage: err.message });
        throw err;
      }
    }),

  getLatestJob: publicProcedure.query(async () => {
    return getLatestScanJob();
  }),

  // 获取扫描历史记录（最近 10 次）
  getTrendHistory: publicProcedure
    .input(z.object({ cardId: z.number(), limit: z.number().min(1).max(60).optional() }))
    .query(async ({ input }) => {
      return getTrendHistory(input.cardId, input.limit ?? 20);
    }),

  getDailyTrendSummary: publicProcedure
    .input(z.object({ limit: z.number().min(6).max(60).optional(), window: z.enum(["24H", "7D", "30D"]).optional() }).optional())
    .query(async ({ input }) => {
      return buildDailyTrendSummary(input?.limit ?? 20, input?.window ?? "24H");
    }),

  getTrendMovers: publicProcedure
    .input(z.object({ limit: z.number().min(6).max(60).optional(), window: z.enum(["24H", "7D", "30D"]).optional() }).optional())
    .query(async ({ input }) => {
      return buildTrendMoversBoard(input?.limit ?? 20, resolveHistoryOffset(input?.window ?? "24H"));
    }),

  getTrendBoard: publicProcedure
    .input(z.object({ limit: z.number().min(6).max(60).optional() }).optional())
    .query(async ({ input }) => {
      return buildMarketIntelligenceBoard(input?.limit ?? 18);
    }),

  getHistory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }))
    .query(async ({ input }) => {
      return getScanJobHistory(input.limit ?? 10);
    }),

  // 清除旧数据并重新塞入真实演示数据（临时工具）
  reseedAll: publicProcedure.mutation(async () => {
    const { getDb } = await import("./db");
    const { priceHistory, cards, players } = await import("../drizzle/schema");
    const db = await getDb();
    if (db) {
       await db.delete(priceHistory);
       await db.delete(cards);
       await db.delete(players);
       
       const rawRes = await db.insert(players).values({ name: "Debug Insert", externalId: "debug-1" });
       return { rawRes };
    }
    return { error: "no db" };
  }),

  // 初始化种子数据（公开接口，首次使用时调用）
  initSeedData: publicProcedure.mutation(async () => {
    const result = await seedDatabase();
    return result;
  }),
});

// ─── Schedule Router ────────────────────────────────────────────────────────

// 在路由层注册扫描执行函数（避免循环依赖）
registerScanRunner(async () => {
  const jobId = await createScanJob();
  await updateScanJob(jobId, { status: "running" });
  try {
    const allCards = await getAllCards(undefined, 200);
    let dealsFound = 0;
    for (const card of allCards) {
      if (card.isDealOpportunity) dealsFound++;
    }
    await updateScanJob(jobId, { status: "completed", dealsFound, cardsScanned: allCards.length });
    return { dealsFound, cardsScanned: allCards.length };
  } catch (err: any) {
    await updateScanJob(jobId, { status: "failed", errorMessage: err.message });
    throw err;
  }
});

const scheduleRouter = router({
  // 获取当前定时配置
  get: publicProcedure.query(async () => {
    return getScanSchedule();
  }),

  // 保存定时配置（创建或更新）
  upsert: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        hour: z.number().min(0).max(23),
        minute: z.number().min(0).max(59),
        timezone: z.string().optional(),
        dealScoreThreshold: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const nextRunAt = input.enabled ? calcNextRunAt(input.hour, input.minute) : undefined;
      await upsertScanSchedule({
        enabled: input.enabled,
        hour: input.hour,
        minute: input.minute,
        timezone: input.timezone ?? "Asia/Shanghai",
        dealScoreThreshold: input.dealScoreThreshold ?? 70,
        nextRunAt,
      });
      // 重新加载 cron 任务
      await startScheduledScan();
      return { success: true, nextRunAt };
    }),

  // 快速开关定时扫描
  toggle: publicProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const current = await getScanSchedule();
      const hour = current?.hour ?? 8;
      const minute = current?.minute ?? 0;
      const nextRunAt = input.enabled ? calcNextRunAt(hour, minute) : undefined;
      await upsertScanSchedule({
        enabled: input.enabled,
        hour,
        minute,
        timezone: current?.timezone ?? "Asia/Shanghai",
        dealScoreThreshold: current?.dealScoreThreshold ?? 70,
        nextRunAt,
      });
      await startScheduledScan();
      return { success: true, enabled: input.enabled, nextRunAt };
    }),
});

const boxesRouter = router({
  getIntelligence: publicProcedure
    .input(z.object({ manufacturer: z.enum(["ALL", "Panini", "Topps", "Upper Deck"]).optional() }).optional())
    .query(async ({ input }) => {
      return getBoxIntelligence(input?.manufacturer ?? "ALL");
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return getBoxById(input.id);
    }),
});

const signalSettingsRouter = router({
  get: publicProcedure.query(async () => {
    return getSignalSettings();
  }),

  update: publicProcedure
    .input(z.object({ onCourt: z.number().min(0).max(100), offCourt: z.number().min(0).max(100), market: z.number().min(0).max(100) }))
    .mutation(async ({ input }) => {
      return updateSignalSettings(input);
    }),

  reset: publicProcedure.mutation(async () => {
    return resetSignalSettings();
  }),
});

// ─── Multi-Platform Data Router ──────────────────────────────────────────────
const multiPlatformRouter = router({
  // 多平台数据查询（卡淘 + 闲鱼 + 小红书）
  search: publicProcedure
    .input(z.object({
      playerName: z.string(),
      year: z.number().optional(),
      brand: z.string().optional(),
      grade: z.string().optional(),
      pageSize: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return getMultiPlatformData(input.playerName, {
        year: input.year,
        brand: input.brand,
        grade: input.grade,
        pageSize: input.pageSize || 15,
      });
    }),
  // 卡淘 Klay Thompson 专项数据
  klayKatao: publicProcedure
    .input(z.object({
      status: z.union([z.literal(1), z.literal(-2)]).optional(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
      extraKeywords: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getKataoKlayData({
        status: input.status,
        page: input.page || 1,
        pageSize: input.pageSize || 20,
        extraKeywords: input.extraKeywords,
      });
    }),
});
// ─── External Market Data Router ───────────────────────────────────────────

const externalMarketRouter = router({
  // eBay + 卡淘实时市场数据
  getMarketData: publicProcedure
    .input(z.object({
      playerName: z.string(),
      year: z.number().optional(),
      brand: z.string().optional(),
      parallel: z.string().optional(),
      grade: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getMarketData(input.playerName, {
        year: input.year,
        brand: input.brand,
        parallel: input.parallel,
        grade: input.grade,
      });
    }),

  // AI 趋势分析
  analyzeCardTrend: publicProcedure
    .input(z.object({
      playerName: z.string(),
      sport: z.string(),
      team: z.string().optional(),
      year: z.number(),
      brand: z.string(),
      parallel: z.string().optional(),
      grade: z.string().optional(),
      currentPrice: z.number(),
      avgPrice30d: z.number().optional(),
      priceChange7d: z.number().optional(),
      performanceScore: z.number().optional(),
      priceHistory: z.array(z.object({
        date: z.string(),
        price: z.number(),
        source: z.string(),
      })).optional(),
      ebayListings: z.array(z.object({
        price: z.number(),
        soldDate: z.string(),
        grade: z.string(),
      })).optional(),
      kataoListings: z.array(z.object({
        price: z.number(),
        soldDate: z.string(),
        grade: z.string(),
        currency: z.string(),
      })).optional(),
    }))
    .query(async ({ input }) => {
      return analyzeCardTrendAI({
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
        kataoListings: input.kataoListings,
      });
    }),
});

// ─── Main Router ──────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
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
  multiPlatform: multiPlatformRouter,
});

export type AppRouter = typeof appRouter;
