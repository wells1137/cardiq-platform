# CardAgent — 本地开发指南

## 快速启动

```bash
# 1. 解压后进入项目目录
cd sports-card-agent

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
# 在项目根目录创建 .env 文件，填入以下变量（见下方说明）

# 4. 启动开发服务器
pnpm dev
# 访问 http://localhost:3000
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 图表 | Recharts |
| 路由 | Wouter |
| API 层 | tRPC 11（端到端类型安全） |
| 后端框架 | Express 4 |
| 数据库 ORM | Drizzle ORM |
| 数据库 | MySQL / TiDB |
| 定时任务 | node-cron |
| LLM | 内置 LLM Helper（兼容 OpenAI 格式） |
| 测试 | Vitest |

## 关键文件说明

```
drizzle/schema.ts            ← 数据库表结构（修改后需运行迁移）
server/db.ts                 ← 数据库查询辅助函数
server/routers.ts            ← 所有 tRPC API 路由
server/sportsDataService.ts  ← 球员数据 + 球星卡价格逻辑（含模拟数据）
server/cronScheduler.ts      ← 每日自动扫描 Cron 调度器
client/src/pages/            ← 所有页面组件
client/src/index.css         ← 全局样式（2K 游戏风格主题变量）
```

## 所需环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库连接（必填）
DATABASE_URL=mysql://user:password@host:3306/dbname

# JWT 签名密钥（必填，随机字符串即可）
JWT_SECRET=your-random-jwt-secret-here

# LLM API（必填，用于生成投资报告）
BUILT_IN_FORGE_API_KEY=your-openai-compatible-api-key
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1

# Manus OAuth（可选，已去掉登录，可不填）
VITE_APP_ID=
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# 前端 LLM（可选）
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=

# eBay API（P0 优先级，有 Key 后填入）
EBAY_APP_ID=
EBAY_CERT_ID=
```

## 数据库迁移流程

```bash
# 1. 修改 drizzle/schema.ts
# 2. 生成迁移 SQL
pnpm drizzle-kit generate
# 3. 查看生成的 SQL 文件（drizzle/ 目录下）
# 4. 在数据库中执行 SQL（可用 MySQL Workbench 或命令行）
mysql -u user -p dbname < drizzle/xxxx_migration.sql
```

## 运行测试

```bash
pnpm test
```

当前测试覆盖：
- `server/auth.logout.test.ts` — OAuth 登出流程
- `server/sportsData.test.ts` — 球员评分算法
- `server/cronScheduler.test.ts` — Cron 调度器

## 下一步开发优先级（详见 gap-analysis.md）

### P0 — 立即开始（MVP 核心）

**1. 接入 eBay 真实成交数据**
- 推荐方案：Apify eBay Sold Listings API（`https://apify.com/caffein.dev/ebay-sold-listings`）
- 修改文件：`server/sportsDataService.ts` 中的 `generateMockPriceHistory()` 函数
- 替换为真实 API 调用，结果写入 `price_history` 表

**2. K线图替换折线图**
```bash
pnpm add lightweight-charts
```
- 修改文件：`client/src/pages/CardDetail.tsx`
- 后端在 `server/routers.ts` 的 `cardsRouter` 中新增 OHLC 聚合接口

### P1 — 核心产品

**3. Portfolio 资产管理**
```typescript
// drizzle/schema.ts 新增
export const portfolio = mysqlTable("portfolio", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: int("cardId").notNull(),
  quantity: int("quantity").default(1),
  buyPrice: float("buyPrice").notNull(),
  buyDate: timestamp("buyDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```
- 新增 `portfolioRouter` 到 `server/routers.ts`
- 新建 `client/src/pages/Portfolio.tsx`

**4. Pro 会员订阅**
```bash
pnpm add stripe
```
- 扩展 `users` 表：添加 `subscriptionTier`（free/pro）、`subscriptionExpiry` 字段
- 新建 `server/stripeWebhook.ts` 处理支付回调

### P2 — 生态扩展

**5. AI 拍照识卡**
- 前端调用 `getUserMedia` API 拍照
- 上传图片到 S3，调用 Gemini Vision API 识别卡牌信息
- 识别结果自动填入搜索框

**6. 卡淘数据爬虫**
- 遵守 Robots 协议，仅采集公开成交信息
- 建议使用 Playwright 或 Puppeteer 实现
- 注意控制抓取频率，避免对目标服务器造成压力

## 页面路由结构

```
/                  → Dashboard（价值发现面板）
/market            → 卡片市场
/players           → 球员数据
/card/:id          → 球星卡详情
/watchlist         → 我的监控
/reports           → 投资报告
/scanner           → 市场扫描
/notifications     → 通知中心
```
