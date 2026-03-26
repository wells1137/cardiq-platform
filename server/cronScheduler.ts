import * as cron from "node-cron";
import { getDb } from "./db";
import { scanSchedule } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// 动态导入以避免循环依赖
let _runScanFn: (() => Promise<{ dealsFound: number; cardsScanned: number }>) | null = null;

export function registerScanRunner(fn: () => Promise<{ dealsFound: number; cardsScanned: number }>) {
  _runScanFn = fn;
}

// 当前活跃的 cron 任务
let _currentTask: cron.ScheduledTask | null = null;

/**
 * 计算下次执行时间（UTC+8 时区）
 */
export function calcNextRunAt(hour: number, minute: number): Date {
  const now = new Date();
  // 转换为 UTC+8
  const utc8Offset = 8 * 60 * 60 * 1000;
  const nowUtc8 = new Date(now.getTime() + utc8Offset);

  const next = new Date(nowUtc8);
  next.setUTCHours(hour, minute, 0, 0);

  // 如果今天的时间已过，则推到明天
  if (next <= nowUtc8) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  // 转回 UTC 存储
  return new Date(next.getTime() - utc8Offset);
}

/**
 * 停止当前 cron 任务
 */
export function stopCurrentTask() {
  if (_currentTask) {
    _currentTask.stop();
    _currentTask = null;
    console.log("[CronScheduler] Stopped existing cron task");
  }
}

/**
 * 根据数据库配置启动 cron 任务
 */
export async function startScheduledScan() {
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

  // node-cron 使用 UTC 时间，需要将 UTC+8 转换为 UTC
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

      // 更新上次运行时间和下次运行时间
      const db2 = await getDb();
      if (db2) {
        await db2.update(scanSchedule).set({
          lastRunAt: new Date(),
          nextRunAt: calcNextRunAt(hour, minute),
        }).where(eq(scanSchedule.id, config.id));
      }
    } catch (err) {
      console.error("[CronScheduler] Scheduled scan failed:", err);
    }
  });

  // 更新下次执行时间
  await db.update(scanSchedule).set({
    nextRunAt: calcNextRunAt(hour, minute),
  }).where(eq(scanSchedule.id, config.id));

  console.log(`[CronScheduler] Next run at: ${calcNextRunAt(hour, minute).toISOString()}`);
}

/**
 * 初始化调度器（服务启动时调用）
 */
export async function initCronScheduler() {
  console.log("[CronScheduler] Initializing...");
  await startScheduledScan();
}
