import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { TrendingUp, Activity, DollarSign, ArrowRight, CalendarRange, TrendingDown, RefreshCw, Search, Zap, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { SimpleAreaChart } from "@/components/charts/SimpleAreaChart";
import { TrendBoard } from "@/components/TrendBoard";

const mockIndexData = Array.from({ length: 30 }).map((_, i) => ({
  label: `Day ${i + 1}`,
  value: 12000 + Math.sin(i * 0.3) * 500 + i * 20 + Math.random() * 200,
}));

export function Dashboard() {
  const utils = trpc.useUtils();
  const { data: cards, isLoading } = trpc.cards.getAll.useQuery({ limit: 8 }, { enabled: true });
  const trendBoardQuery = trpc.cards.getTrendBoard.useQuery({ limit: 18 });
  const dailySummaryQuery = trpc.cards.getDailyTrendSummary.useQuery({ limit: 24, window: "24H" });

  const addWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: async () => {
      await utils.watchlist.get.invalidate();
      toast.success("已加入关注列表");
    },
  });

  const addPortfolioMutation = trpc.portfolio.add.useMutation({
    onSuccess: async () => {
      await utils.portfolio.get.invalidate();
      toast.success("已加入资产组合");
    },
  });

  const handleWatch = (item: any) => {
    addWatchlistMutation.mutate({ cardId: item.cardId, alertDealScoreAbove: 75, notes: `${item.playerName} 从首页趋势榜加入关注` });
  };

  const handlePortfolio = (item: any) => {
    addPortfolioMutation.mutate({ cardId: item.cardId, quantity: 1, averageCost: Number(item.currentPrice || 0), targetPrice: Number(item.currentPrice || 0) * 1.2, notes: `${item.playerName} 从首页趋势榜加入组合` });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">趋势概览</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">实时追踪球星卡市场动态与 AI 交易信号</p>
          </div>
          <div className="flex gap-2.5">
            <Link href="/market">
              <button className="inline-flex items-center gap-2 rounded-xl bg-[#1D6FEB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors shadow-sm shadow-blue-200">
                <Search className="h-4 w-4" /> 查价 / 市场
              </button>
            </Link>
            <Link href="/signals">
              <button className="inline-flex items-center gap-2 rounded-xl border border-[#D0DCE8] bg-white px-5 py-2.5 text-sm font-semibold text-[#0A1628] hover:bg-[#F0F5FF] hover:border-[#1D6FEB] transition-colors">
                <Zap className="h-4 w-4 text-[#1D6FEB]" /> 交易信号
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">

        {/* 顶部 KPI 卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            label="今日反转"
            value={`${dailySummaryQuery.data?.reversalCount ?? 0}`}
            unit="张"
            icon={<RefreshCw className="h-4 w-4" />}
            iconBg="bg-blue-50"
            iconColor="text-[#1D6FEB]"
          />
          <KpiCard
            label="最强上升"
            value={dailySummaryQuery.data?.topRiser?.playerName || "--"}
            icon={<TrendingUp className="h-4 w-4" />}
            iconBg="bg-green-50"
            iconColor="text-[#16a34a]"
            valueColor="text-[#16a34a]"
          />
          <KpiCard
            label="最大回落"
            value={dailySummaryQuery.data?.topFaller?.playerName || "--"}
            icon={<TrendingDown className="h-4 w-4" />}
            iconBg="bg-red-50"
            iconColor="text-[#dc2626]"
            valueColor="text-[#dc2626]"
          />
          <KpiCard
            label="24h 成交额"
            value="$1.42M"
            unit="+12.5% vs 昨日"
            icon={<DollarSign className="h-4 w-4" />}
            iconBg="bg-blue-50"
            iconColor="text-[#1D6FEB]"
            unitColor="text-[#16a34a]"
          />
        </div>

        {/* 今日日报 Banner */}
        <div className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1">
                  <CalendarRange className="h-3.5 w-3.5 text-[#1D6FEB]" />
                  <span className="text-xs font-bold text-[#1D6FEB] uppercase tracking-wider">今日趋势日报</span>
                </div>
              </div>
              <p className="text-sm font-medium text-[#0A1628] leading-relaxed">
                {dailySummaryQuery.data?.summary || "正在生成趋势摘要..."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dailySummaryQuery.data?.topRiser && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-semibold text-[#16a34a]">
                    <TrendingUp className="h-3 w-3" /> {dailySummaryQuery.data.topRiser.playerName}
                  </span>
                )}
                {dailySummaryQuery.data?.topFaller && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-semibold text-[#dc2626]">
                    <TrendingDown className="h-3 w-3" /> {dailySummaryQuery.data.topFaller.playerName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs font-semibold text-[#64748b]">
                  <RefreshCw className="h-3 w-3" /> 反转 {dailySummaryQuery.data?.reversalCount ?? 0} 张
                </span>
              </div>
            </div>
            <Link href="/trends">
              <button className="shrink-0 rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] px-4 py-2 text-xs font-semibold text-[#4A5568] hover:bg-[#EEF4FF] hover:text-[#1D6FEB] hover:border-[#1D6FEB] transition-colors">
                查看趋势中心 →
              </button>
            </Link>
          </div>
        </div>

        {/* 市场大盘 + 分类涨跌 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2 rounded-2xl border border-[#E2EAF4] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Activity className="h-4 w-4 text-[#1D6FEB]" />
                </div>
                <h2 className="text-sm font-bold text-[#0A1628]">市场大盘指数</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="h-3 w-3" /> +2.4% (30天)
              </span>
            </div>
            <div className="h-[200px] w-full">
              <SimpleAreaChart data={mockIndexData} height={200} showTooltip valueFormatter={(value) => `$${value.toFixed(0)}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2EAF4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <BarChart3 className="h-4 w-4 text-[#1D6FEB]" />
              </div>
              <h3 className="text-sm font-bold text-[#0A1628]">分类表现</h3>
            </div>
            <div className="space-y-5">
              {[
                { label: "篮球 NBA", pct: 65, change: "+4.2%", up: true },
                { label: "足球 EPL", pct: 35, change: "+1.8%", up: true },
                { label: "棒球 MLB", pct: 20, change: "-0.5%", up: false },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-semibold text-[#0A1628]">{item.label}</span>
                    <span className={`font-bold ${item.up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>{item.change}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF1F5]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.up ? "bg-[#1D6FEB]" : "bg-[#dc2626]"}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-[#E2EAF4]">
              <div className="text-xs text-[#6B7FA3] mb-1.5 font-medium">市场总成交额 (24h)</div>
              <div className="text-3xl font-bold text-[#0A1628] font-data tracking-tight">$1.42M</div>
              <div className="text-xs text-[#16a34a] font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12.5% vs 昨日
              </div>
            </div>
          </div>
        </div>

        {/* 热门卡牌 + 趋势榜 */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0A1628]">热门卡牌</h2>
              <Link href="/market">
                <span className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#1D6FEB] hover:underline">
                  查看全部 <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#EEF1F5]" />
                  ))
                : cards?.map((card: any, index: number) => (
                    <Link key={card.id} href={`/card/${card.id}`}>
                      <div className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-[#E2EAF4] bg-white p-4 hover:border-[#1D6FEB] hover:shadow-md hover:shadow-blue-50 transition-all duration-200">
                        <div className="relative flex h-16 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF] overflow-hidden">
                          <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1D6FEB] text-[10px] font-bold text-white shadow-sm">
                            {index + 1}
                          </div>
                          <img
                            src={card.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.playerName)}&background=EEF4FF&color=1D6FEB&size=100&bold=true`}
                            alt="card"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-bold text-[#0A1628] group-hover:text-[#1D6FEB] transition-colors">{card.playerName}</h4>
                          <p className="truncate text-[10px] text-[#6B7FA3] mt-0.5">{card.year} {card.brand}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-[#0A1628] font-data">${Number(card.currentPrice).toFixed(0)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.priceChange7d > 0 ? "bg-green-50 text-[#16a34a]" : card.priceChange7d < 0 ? "bg-red-50 text-[#dc2626]" : "bg-gray-50 text-[#64748b]"}`}>
                              {card.priceChange7d > 0 ? "+" : ""}{(card.priceChange7d || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </div>

          <div className="space-y-4">
            <TrendBoard title="强势趋势榜" items={trendBoardQuery.data?.bullish || []} tone="bullish" onWatch={handleWatch} onPortfolio={handlePortfolio} />
            <TrendBoard title="风险预警榜" items={trendBoardQuery.data?.bearish || []} tone="bearish" onWatch={handleWatch} onPortfolio={handlePortfolio} />
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({
  label, value, unit, icon, iconBg, iconColor,
  valueColor = "text-[#0A1628]",
  unitColor = "text-[#6B7FA3]"
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  unitColor?: string;
}) {
  const isEmpty = value === "--" || value === "" || value === "0";
  return (
    <div className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#6B7FA3] uppercase tracking-wide">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg || "bg-blue-50"} ${iconColor || "text-[#1D6FEB]"}`}>
          {icon}
        </div>
      </div>
      {isEmpty ? (
        <div className="space-y-1.5">
          <div className="h-6 w-3/4 rounded-lg bg-[#EEF1F5] animate-pulse" />
          <div className="h-3 w-1/2 rounded-md bg-[#F4F7FB] animate-pulse" />
        </div>
      ) : (
        <>
          <div className={`text-2xl font-bold font-data tracking-tight ${valueColor} truncate`}>{value}</div>
          {unit && <div className={`text-xs font-semibold mt-1 ${unitColor}`}>{unit}</div>}
        </>
      )}
    </div>
  );
}
