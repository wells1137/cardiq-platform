# CardAgent — 球星卡价格数据与投资分析平台

> 对标美国 Card Ladder，专为中国玩家设计的独立第三方球星卡价格数据库与资产管理平台。

---

## 文档导航

| 文件 | 说明 |
|------|------|
| [`README-DEV.md`](./README-DEV.md) | **本地开发指南**：快速启动、环境变量配置、数据库迁移、测试运行 |
| [`GAP-ANALYSIS.md`](./GAP-ANALYSIS.md) | **需求差距分析**：创业方案 vs 现有代码的完整对比，含优先级路线图 |
| [`todo.md`](./todo.md) | **功能待办列表**：所有已完成和待开发功能的追踪记录 |

---

## 快速启动

```bash
pnpm install
pnpm dev
# 访问 http://localhost:3000
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| 图表 | Recharts（待升级为 lightweight-charts K线图） |
| API | tRPC 11（端到端类型安全） |
| 后端 | Express 4 + Drizzle ORM |
| 数据库 | MySQL / TiDB |
| 定时任务 | node-cron |
| LLM | OpenAI 兼容接口（投资报告生成） |
| 测试 | Vitest |

---

## 当前功能模块

```
/                  → 价值发现面板（Dashboard）
/market            → 卡片市场（按运动/价格/评分筛选）
/players           → 球员数据（BallDontLie API 实时数据）
/card/:id          → 球星卡详情（价格走势图 + AI 评分）
/watchlist         → 我的监控列表
/reports           → LLM 投资建议报告
/scanner           → 市场扫描（含每日 Cron 定时器）
/notifications     → 通知中心
```

---

## 下一步开发优先级

详见 [`GAP-ANALYSIS.md`](./GAP-ANALYSIS.md)，核心路线图：

**第1-2个月（MVP验证）**
- 接入 Apify eBay Sold Listings API（真实价格数据）
- K线图替换折线图（`pnpm add lightweight-charts`）
- PSA 人口报告展示
- 汇率换算（USD → CNY）

**第3-4个月（核心产品）**
- Portfolio 资产管理模块
- 卡淘数据爬虫（合规）
- Pro 会员订阅系统（Stripe）

**第5-6个月（生态扩展）**
- AI 拍照识卡（Gemini Vision）
- 市场指数编制
- B端卡店库存管理 SaaS

---

## 本轮已补齐的前端工作台

- `/players`：球员数据库页，支持热门球员榜与搜索
- `/watchlist`：关注列表页，支持查看和移除追踪项
- `/reports`：AI 报告页，支持生成和查看历史报告
- `/notifications`：通知中心页，支持单条/批量已读
- `/settings`：平台设置页，支持自动扫描配置与种子数据初始化
- 侧边栏导航已同步更新，平台主流程现在可以完整串起来

## 新增模块

- `/portfolio`：资产组合，记录持仓数量、平均成本、目标价和浮盈亏
- 市场页支持一键加入 `watchlist` 和 `portfolio`
- 卡片详情页新增外部行情对比区
- 设置页新增外部行情连接状态展示

## 外部行情接入配置

支持三种模式：

- `mock`：默认模式，直接使用平台历史成交作为演示数据
- `manual`：调用自定义桥接接口，适合接卡淘、闲鱼或内部聚合服务
- `apify`：调用 Apify Actor，适合接 eBay sold listings 类 Actor

可用环境变量：

```bash
MARKET_DATA_MODE=mock|manual|apify
MARKET_DATA_ENDPOINT=https://your-market-bridge.example.com/query
MARKET_DATA_TOKEN=your_token
APIFY_TOKEN=your_apify_token
APIFY_EBAY_SOLD_ACTOR_ID=your_actor_id
```

如果未配置外部提供方，系统会自动回退到本地历史成交数据，前端仍可完整演示。

## 智能走势判断配置

平台现在支持三类智能信号：

- 赛场信号：基于比赛数据和近期表现波动
- 场外信号：基于新闻标题或自定义资讯桥接接口
- 市场信号：基于平台成交历史与外部行情对比

可选环境变量：

```bash
NEWS_SIGNAL_ENDPOINT=https://your-news-bridge.example.com/query
NEWS_SIGNAL_TOKEN=your_token
NEWS_SIGNAL_RSS_TEMPLATE=https://news.google.com/rss/search?q={query}
```

说明：

- 优先使用 `NEWS_SIGNAL_ENDPOINT` 读取结构化资讯数据
- 若未配置，可选用 `NEWS_SIGNAL_RSS_TEMPLATE` 读取 RSS 标题流
- 未配置场外数据源时，系统仍会基于赛场 + 市场信号给出趋势判断

## 趋势历史与自动提醒

- 每次智能扫描会为卡片写入一条趋势快照（综合分、置信度、趋势方向）
- 若关注列表或持仓中的卡片从非 `bearish` 反转为 `bearish`，会自动生成趋势反转提醒
- 卡片详情页可查看最近趋势历史变化

## 本轮新增

- `/trends`：独立趋势历史页，查看强弱榜和单卡历史趋势轨迹
- 新增趋势引擎与市场智能榜单的单元测试，便于后续持续迭代

## 趋势页高级能力

- 支持 `24H / 7D / 30D` 多时间窗口查看趋势变动榜
- 支持只看 `关注列表` 或 `持仓组合`
- 每次智能扫描完成后，通知中会附带一条趋势摘要
