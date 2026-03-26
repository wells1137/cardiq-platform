# 球星卡投资抄底平台 TODO

## 数据库 & 后端
- [x] 设计数据库 Schema（players, cards, price_history, watchlist, scan_jobs, notifications）
- [x] 执行数据库迁移
- [x] BallDontLie API 集成（NBA/NFL/MLB/EPL 球员数据）
- [x] 球星卡市价数据层（模拟 eBay 历史成交 + CardHedge 数据）
- [x] 球员表现评分算法（近期比赛数据综合评分）
- [x] AI 抄底评分引擎（性价比计算 + 低估标记）
- [x] tRPC 路由：球员搜索、卡片列表、价格历史、抄底机会
- [x] tRPC 路由：用户监控列表 CRUD
- [x] LLM 投资建议报告生成接口
- [x] 市场扫描任务系统（手动触发 + 应用内通知）
- [x] 通知系统（应用内通知 + Owner 通知）

## 前端页面
- [x] 全局样式设计（深色金融风格，色彩体系）
- [x] DashboardLayout 侧边栏导航
- [x] 首页 / 抄底机会面板（热门机会列表 + 筛选器）
- [x] 球星卡市场页（按运动类型浏览所有卡片）
- [x] 球星卡详情页（价格走势图 + 球员数据 + AI 评分 + 成交记录）
- [x] 球员搜索页（跨运动搜索 + 表现数据展示）
- [x] 用户监控列表页（关注球员/卡片管理）
- [x] LLM 投资报告页（生成 + 展示自然语言建议）
- [x] 通知中心页（历史通知列表）
- [x] 价格走势 Recharts 图表组件
- [x] 球星卡卡片组件（封面 + 评分 + 价格）
- [x] 抄底机会评分徽章组件

## 测试
- [x] 球员评分算法单元测试（5 个用例）
- [x] auth.logout 集成测试
- [ ] AI 抄底评分逻辑测试（待补充）

## 待优化
- [ ] 接入真实 eBay 已售数据 API
- [ ] 定时自动扫描（每日）
- [ ] 价格提醒邮件通知

## 每日自动扫描 Cron 功能
- [x] 数据库新增 scheduledScans 配置表（hour, minute, enabled, timezone）
- [x] 后端 Cron 调度引擎（node-cron，服务启动时自动加载配置）
- [x] tRPC 路由：getSchedule / upsertSchedule / toggleSchedule
- [x] Scanner 页面：定时器配置 UI（时间选择器、开关、下次执行时间）
- [x] 自动扫描触发后推送应用内通知
- [x] 定时任务测试

## 新一轮优化功能
- [~] eBay Finding API 服务层（框架已预留，等待 API Key）
- [~] eBay API Key 配置（用户暂无 Key，待后续接入）
- [~] 卡片详情页接入 eBay 真实成交数据（框架已预留，等待 Key）
- [~] 扫描时自动拉取 eBay 最新成交价（等待 Key）
- [x] Scanner 页面扫描历史记录列表（最近 10 次）
- [x] scan_jobs 表增加 triggeredBy 字段（manual/auto）
- [x] 监控列表个性化扫描：扫描时检查 watchlist 匹配并推送专属通知
- [x] 通知内容区分：普通通知 vs 监控列表命中通知

## 去掉登录限制
- [x] 后端所有 protectedProcedure 改为 publicProcedure（watchlist、reports、notifications、schedule 等）
- [x] 前端 DashboardLayout 去掉登录拦截页面，直接显示内容
- [x] 前端各页面去掉 isAuthenticated 跳转逻辑
- [x] 去掉 Scanner 页面中的登录检查

## 文字优化：替换"抄底"术语
- [x] 前端所有页面将"抄底"替换为专业投资术语
- [x] 后端路由/数据库字段注释同步更新
- [x] 侧边栏导航菜单文字更新

## 视觉大改版（2K 游戏风格）
- [x] 全局样式：深色背景、蓝色/橙色光效、多层次卡片、大字体
- [x] Dashboard 首页：英雄展示区 + 数据卡片叠层
- [x] Players 页面：球员大图居中 + 球衣号码背景 + 数据叠层卡片
- [x] CardDetail 页面：卡片大图展示 + 多层次数据
- [x] 其他页面卡片组件风格统一（Market、DashboardLayout 侧边栏）
