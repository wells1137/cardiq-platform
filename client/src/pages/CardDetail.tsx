import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { BarChart3, Target, ShieldCheck, Info, TrendingUp, TrendingDown, Activity, DatabaseZap, BookmarkPlus, BriefcaseBusiness, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CardFrame } from "@/components/CardFrame";
import { LazyPriceChart } from "@/components/charts/LazyPriceChart";
import { SimpleAreaChart } from "@/components/charts/SimpleAreaChart";
import { AiTrendAnalysis } from "@/components/AiTrendAnalysis";

export function CardDetail() {
  const [match, params] = useRoute("/card/:id");
  const cardId = parseInt(params?.id || "0", 10);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const text = analysisResult?.summary || "";
    if (!text) return;
    setIsTyping(true);
    setDisplayedText("");
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [analysisResult]);

  const analyzeMutation = trpc.cards.analyzeTrend.useMutation({
    onSuccess: (res: any) => {
      const normalized = res?.summary ? res : { ...res, summary: res?.analysis || "" };
      if (normalized?.summary) setAnalysisResult(normalized);
    },
  });

  const { data: cardRaw, isLoading: cardLoading } = trpc.cards.getById.useQuery({ id: cardId }, { enabled: !!cardId });
  const card = cardRaw as any;
  const { data: history, isLoading: historyLoading } = trpc.cards.getPriceHistory.useQuery({ cardId, days: 90 }, { enabled: !!cardId });
  const marketDataQuery = trpc.marketData.lookupByCard.useQuery({ cardId }, { enabled: !!cardId });
  const intelligenceQuery = trpc.cards.getTrendIntelligence.useQuery({ cardId }, { enabled: !!cardId });
  const trendHistoryQuery = trpc.cards.getTrendHistory.useQuery({ cardId, limit: 12 }, { enabled: !!cardId });
  const utils = trpc.useUtils();

  const addWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: async () => { await utils.watchlist.get.invalidate(); toast.success("已加入关注列表"); },
  });
  const addPortfolioMutation = trpc.portfolio.add.useMutation({
    onSuccess: async () => { await utils.portfolio.get.invalidate(); toast.success("已加入资产组合"); },
  });

  if (!match) return null;
  if (cardLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-[#6B7FA3] animate-pulse">正在加载卡牌数据...</div>
    </div>
  );
  if (!card) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-[#6B7FA3]">404：未找到卡牌</div>
    </div>
  );

  const isUp = card.priceChange7d > 0;
  const isDown = card.priceChange7d < 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">

        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-xs text-[#6B7FA3] mb-5">
          <Link href="/market">
            <span className="flex items-center gap-1 hover:text-[#1D6FEB] cursor-pointer transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> 市场
            </span>
          </Link>
          <span>/</span>
          <span className="text-[#0A1628] font-medium">{card.playerName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* 左侧主内容 */}
          <div className="flex-1 space-y-5">

            {/* 卡牌标题区 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-[#EEF4FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#1D6FEB] uppercase">{card.sport}</span>
                    {card.grade && <span className="rounded-lg border border-[#D0DCE8] px-2 py-0.5 text-[10px] font-bold text-[#0A1628]">{card.grade}</span>}
                  </div>
                  <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">{card.playerName}</h1>
                  <p className="mt-1 text-sm text-[#6B7FA3]">{card.year} · {card.brand} · {card.set}</p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${isUp ? "bg-[#dcfce7] text-[#16a34a]" : isDown ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#f1f5f9] text-[#64748b]"}`}>
                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : isDown ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                  {isUp ? "看涨" : isDown ? "看跌" : "中性"}
                </div>
              </div>
            </div>

            {/* 价格走势图 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[#0A1628]">
                  <Activity className="h-4 w-4 text-[#1D6FEB]" /> 行情走势图
                </h2>
                <div className="flex gap-1 bg-[#F8F9FA] p-1 rounded-lg border border-[#D0DCE8]">
                  {["7D", "1M", "3M", "1Y"].map((range) => (
                    <button key={range} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${range === "3M" ? "bg-white text-[#0A1628] shadow-sm border border-[#D0DCE8]" : "text-[#6B7FA3] hover:text-[#0A1628]"}`}>
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[320px] w-full">
                {historyLoading ? (
                  <div className="h-full flex items-center justify-center bg-[#F8F9FA] rounded-lg animate-pulse text-sm text-[#6B7FA3]">加载图表中...</div>
                ) : history && history.length > 0 ? (
                  <LazyPriceChart history={(history as any[]) || []} className="w-full h-full" />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-[#6B7FA3]">暂无历史数据</div>
                )}
              </div>
            </div>

            {/* 指标卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <ShieldCheck className="h-3.5 w-3.5 text-[#1D6FEB]" />, label: "市场认可度", value: "A级 (High)" },
                { icon: <Activity className="h-3.5 w-3.5 text-[#1D6FEB]" />, label: "交易流动性", value: "B+ (Moderate)" },
                { icon: <BarChart3 className="h-3.5 w-3.5 text-[#1D6FEB]" />, label: "历史波动率", value: `${Math.abs(card.priceChange7d || 0).toFixed(1)}%` },
                { icon: <Info className="h-3.5 w-3.5 text-[#1D6FEB]" />, label: "风险系数", value: card.riskLevel || "Low", valueColor: card.riskLevel === "Low" ? "text-[#16a34a]" : card.riskLevel === "High" ? "text-[#dc2626]" : "text-orange-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#D0DCE8] bg-white p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6B7FA3] uppercase tracking-wider mb-2">
                    {item.icon} {item.label}
                  </div>
                  <div className={`text-base font-bold ${(item as any).valueColor || "text-[#0A1628]"}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Population Report + 规格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#D0DCE8] bg-white overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#D0DCE8] bg-[#F8F9FA]">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-[#0A1628] uppercase tracking-wider">
                    <BarChart3 className="h-3.5 w-3.5 text-[#1D6FEB]" /> Population Report
                  </h3>
                  <span className="rounded bg-[#0A1628] text-white text-[9px] font-bold px-1.5 py-0.5">PSA</span>
                </div>
                <div className="p-5 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-[#6B7FA3] font-medium mb-1">PSA 10</div>
                    <div className="text-2xl font-bold text-[#0A1628]">{card.pop10Count || 1}</div>
                  </div>
                  <div className="border-x border-[#D0DCE8]">
                    <div className="text-[10px] text-[#6B7FA3] font-medium mb-1">Total Pop</div>
                    <div className="text-2xl font-bold text-[#6B7FA3]">{card.population || 1}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7FA3] font-medium mb-1">10率</div>
                    <div className="text-2xl font-bold text-[#1D6FEB]">{Math.round((card.pop10Count || 1) / (card.population || 1) * 100)}%</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#D0DCE8] bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-[#D0DCE8] bg-[#F8F9FA]">
                  <h3 className="text-xs font-bold text-[#0A1628] uppercase tracking-wider">卡牌规格</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-y-3 text-sm">
                  {[
                    { label: "系列", value: card.set },
                    { label: "平行版本", value: card.parallel || "Base" },
                    { label: "卡号", value: "#134" },
                    { label: "印量", value: "N/A" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-[10px] text-[#6B7FA3] font-medium uppercase mb-0.5">{item.label}</div>
                      <div className="font-semibold text-[#0A1628]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI 智能走势判断 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#0A1628]">
                    <Activity className="h-4 w-4 text-[#1D6FEB]" /> 智能走势判断
                  </h3>
                  <p className="text-xs text-[#6B7FA3] mt-0.5">综合赛场表现、场外舆情与市场成交结构</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${intelligenceQuery.data?.trend === "bullish" ? "bg-[#dcfce7] text-[#16a34a]" : intelligenceQuery.data?.trend === "bearish" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#f1f5f9] text-[#64748b]"}`}>
                  {intelligenceQuery.data?.trend || "neutral"} · {intelligenceQuery.data?.confidence || "--"}%
                </span>
              </div>
              <div className="rounded-lg bg-[#F5F8FF] border border-[#D0DCE8] p-4 text-sm text-[#0A1628] mb-4">
                {intelligenceQuery.data?.summary || "正在抓取赛场与场外动态..."}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SignalPanel title="赛场信号" score={intelligenceQuery.data?.onCourt.score} trend={intelligenceQuery.data?.onCourt.trend} items={intelligenceQuery.data?.onCourt.details || []} />
                <SignalPanel title="场外信号" score={intelligenceQuery.data?.offCourt.score} trend={intelligenceQuery.data?.offCourt.trend} items={intelligenceQuery.data?.offCourt.details || []} />
                <SignalPanel title="市场信号" score={intelligenceQuery.data?.market.score} trend={intelligenceQuery.data?.market.trend} items={intelligenceQuery.data?.market.details || []} />
              </div>
            </div>

            {/* 趋势历史 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#0A1628] mb-4">
                <BarChart3 className="h-4 w-4 text-[#1D6FEB]" /> 趋势历史
              </h3>
              <div className="h-[180px] w-full">
                <SimpleAreaChart
                  data={(trendHistoryQuery.data || []).slice().reverse().map((item: any) => ({
                    label: new Date(item.createdAt).toLocaleDateString("zh-CN"),
                    value: Number(item.compositeScore || 0),
                  }))}
                  height={180}
                  showTooltip
                  valueFormatter={(value) => `${value.toFixed(0)} 分`}
                />
              </div>
            </div>

            {/* 外部行情对比 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#0A1628]">
                    <DatabaseZap className="h-4 w-4 text-[#1D6FEB]" /> 外部行情对比
                  </h3>
                  <p className="text-xs text-[#6B7FA3] mt-0.5">接入 eBay Sold 数据，AI 清洗异常成交</p>
                </div>
                <div className="text-right text-xs">
                  <div className="text-[#6B7FA3]">{marketDataQuery.data?.provider || "Market Data"}</div>
                  <div className="text-[#1D6FEB] font-semibold uppercase">{marketDataQuery.data?.mode || "mock"}</div>
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F8FF] border border-[#D0DCE8] p-4 text-sm text-[#0A1628] mb-3">
                {marketDataQuery.data?.note || "正在加载外部行情状态..."}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "质量分", value: marketDataQuery.data?.qualityScore ?? "--" },
                  { label: "原始样本", value: marketDataQuery.data?.totalFetched ?? 0 },
                  { label: "过滤异常", value: marketDataQuery.data?.filteredOutliers ?? 0 },
                ].map((item) => (
                  <span key={item.label} className="rounded-full border border-[#D0DCE8] bg-white px-3 py-1 font-medium text-[#0A1628]">
                    {item.label} <span className="font-bold">{item.value}</span>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* 右侧面板 */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">

            {/* 卡牌图 + 估价 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5 flex flex-col items-center">
              <div className="relative mb-1">
                <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#16a34a] animate-pulse" />
              </div>
              <div className="aspect-[3/4] w-48 mb-5">
                <CardFrame card={card} className="w-full h-full shadow-lg rounded-xl" imageClassName="transition-transform duration-700 hover:scale-105" />
              </div>

              <div className="w-full rounded-xl bg-[#F5F8FF] border border-[#D0DCE8] p-4 text-center mb-4">
                <div className="text-[10px] font-semibold text-[#6B7FA3] uppercase tracking-wider mb-1">实时估价</div>
                <div className="text-4xl font-bold text-[#0A1628] font-data">
                  <span className="text-xl text-[#1D6FEB] mr-0.5">$</span>
                  {card.currentPrice?.toLocaleString() || "N/A"}
                </div>
                {card.priceChange7d !== null && card.priceChange7d !== undefined && (
                  <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isUp ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isUp ? "+" : ""}{card.priceChange7d.toFixed(1)}% (7D)
                  </div>
                )}
              </div>

              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  onClick={() => addPortfolioMutation.mutate({ cardId, quantity: 1, averageCost: Number(card.currentPrice || 0), targetPrice: Number(card.currentPrice || 0) * 1.2, notes: `${card.playerName} 从详情页加入组合` })}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1D6FEB] py-2.5 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors"
                >
                  <BriefcaseBusiness className="h-4 w-4" /> 追踪资产
                </button>
                <button
                  onClick={() => addWatchlistMutation.mutate({ cardId, alertDealScoreAbove: 75, notes: `${card.playerName} 从详情页加入关注` })}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[#D0DCE8] bg-[#F8F9FA] py-2.5 text-sm font-semibold text-[#0A1628] hover:bg-[#EEF4FF] hover:text-[#1D6FEB] transition-colors"
                >
                  <BookmarkPlus className="h-4 w-4" /> 设为关注
                </button>
              </div>
            </div>

            {/* 近期成交 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <h3 className="flex items-center justify-between text-sm font-bold text-[#0A1628] mb-4">
                近期成交记录
                <span className="text-[10px] text-[#6B7FA3] font-normal">Recent Sales</span>
              </h3>
              <div className="space-y-0">
                {historyLoading ? (
                  <div className="text-sm text-[#6B7FA3] text-center py-4 animate-pulse">加载成交记录中...</div>
                ) : history && history.length > 0 ? (
                  history.slice(0, 6).map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[#D0DCE8] last:border-0">
                      <div>
                        <div className="text-sm font-bold text-[#0A1628] font-data">${Number(h.price).toLocaleString()}</div>
                        <div className="text-[10px] text-[#6B7FA3]">{format(new Date(h.saleDate), "MMM dd, yyyy")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#6B7FA3] font-medium">{h.source || "eBay"}</div>
                        <div className="text-[10px] text-[#16a34a] font-semibold">已验证</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#6B7FA3] text-center py-4">暂无成交数据</div>
                )}
              </div>
            </div>

            {/* AI 智能分析面板 - eBay + 卡淘 + Gemini */}
            <AiTrendAnalysis
              card={{
                playerName: card.playerName,
                sport: card.sport,
                team: card.team,
                year: card.year,
                brand: card.brand,
                parallel: card.parallel,
                grade: card.grade,
                currentPrice: Number(card.currentPrice || 0),
                avgPrice30d: Number(card.avgPrice30d || card.currentPrice || 0),
                priceChange7d: Number(card.priceChange7d || 0),
                performanceScore: Number(card.performanceScore || 75),
                priceHistory: (history as any[] || []).slice(0, 10).map((h: any) => ({
                  date: new Date(h.saleDate).toISOString().split("T")[0],
                  price: Number(h.price),
                  source: h.source || "eBay",
                })),
              }}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

function SignalPanel({ title, score, trend, items }: { title: string; score?: number; trend?: string; items: string[] }) {
  const isUp = trend === "bullish";
  const isDown = trend === "bearish";
  return (
    <div className="rounded-lg border border-[#D0DCE8] bg-[#F8F9FA] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#0A1628]">{title}</span>
        <span className={`text-xs font-bold ${isUp ? "text-[#16a34a]" : isDown ? "text-[#dc2626]" : "text-[#6B7FA3]"}`}>
          {score ?? "--"}
        </span>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 3).map((item, i) => (
          <li key={i} className="text-[11px] text-[#6B7FA3] flex items-start gap-1">
            <span className="mt-0.5 shrink-0">·</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
