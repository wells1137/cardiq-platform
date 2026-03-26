import { useEffect, useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Bookmark, CalendarRange, Download, Filter, History, Save, Search, ShieldAlert, TrendingDown, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TrendBoard } from "@/components/TrendBoard";
import { SimpleAreaChart } from "@/components/charts/SimpleAreaChart";
import { TrendMoversBoard } from "@/components/TrendMoversBoard";

const sportOptions = ["ALL", "NBA", "NFL", "MLB", "NHL", "EPL"];
const scopeOptions = ["ALL", "WATCHLIST", "PORTFOLIO"] as const;
const windowOptions = ["24H", "7D", "30D"] as const;
const presetStorageKey = "cardiq-trend-presets";

type ScopeOption = (typeof scopeOptions)[number];
type WindowOption = (typeof windowOptions)[number];

type TrendPreset = {
  id: string;
  name: string;
  search: string;
  sport: string;
  scope: ScopeOption;
  windowKey: WindowOption;
};

function readPresets(): TrendPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(presetStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writePresets(presets: TrendPreset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(presetStorageKey, JSON.stringify(presets));
}
function escapeCsv(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length || typeof window === "undefined") return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(","))].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

export function TrendHistoryPage() {
  const utils = trpc.useUtils();
  const cardsQuery = trpc.cards.getAll.useQuery({ limit: 50 });
  const boardQuery = trpc.cards.getTrendBoard.useQuery({ limit: 18 });
  const watchlistQuery = trpc.watchlist.get.useQuery();
  const portfolioQuery = trpc.portfolio.get.useQuery();
  const [selectedCardId, setSelectedCardId] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("ALL");
  const [scope, setScope] = useState<ScopeOption>("ALL");
  const [windowKey, setWindowKey] = useState<WindowOption>("24H");
  const [savedPresets, setSavedPresets] = useState<TrendPreset[]>([]);
  const moversQuery = trpc.cards.getTrendMovers.useQuery({ limit: 20, window: windowKey });

  useEffect(() => { setSavedPresets(readPresets()); }, []);

  const addWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: async () => { await utils.watchlist.get.invalidate(); toast.success("已加入关注列表"); },
  });
  const addPortfolioMutation = trpc.portfolio.add.useMutation({
    onSuccess: async () => { await utils.portfolio.get.invalidate(); toast.success("已加入资产组合"); },
  });

  const watchlistCardIds = useMemo(() => new Set((watchlistQuery.data || []).map((item: any) => item.cardId).filter(Boolean)), [watchlistQuery.data]);
  const portfolioCardIds = useMemo(() => new Set((portfolioQuery.data?.positions || []).map((item: any) => item.cardId)), [portfolioQuery.data]);
  const cardMap = useMemo(() => new Map((cardsQuery.data || []).map((card: any) => [card.id, card])), [cardsQuery.data]);

  const filteredCards = useMemo(() => {
    return (cardsQuery.data || []).filter((card: any) => {
      const matchesSport = sport === "ALL" || card.sport === sport;
      const haystack = [card.playerName, card.brand, card.set, card.parallel, card.year].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase());
      const matchesScope = scope === "ALL" || (scope === "WATCHLIST" ? watchlistCardIds.has(card.id) : portfolioCardIds.has(card.id));
      return matchesSport && matchesSearch && matchesScope;
    });
  }, [cardsQuery.data, search, sport, scope, watchlistCardIds, portfolioCardIds]);

  useEffect(() => {
    if (filteredCards.length === 0) return;
    const stillExists = filteredCards.some((card: any) => card.id === selectedCardId);
    if (!selectedCardId || !stillExists) setSelectedCardId(filteredCards[0].id);
  }, [filteredCards, selectedCardId]);

  const historyQuery = trpc.cards.getTrendHistory.useQuery({ cardId: selectedCardId, limit: 20 }, { enabled: !!selectedCardId });
  const selectedCard = useMemo(() => filteredCards.find((item: any) => item.id === selectedCardId), [filteredCards, selectedCardId]);
  const chartData = (historyQuery.data || []).slice().reverse().map((item: any) => ({ label: new Date(item.createdAt).toLocaleDateString("zh-CN"), value: Number(item.compositeScore || 0) }));

  const inScope = (item: any) => {
    const sportOk = sport === "ALL" || item.sport === sport;
    const scopeOk = scope === "ALL" || (scope === "WATCHLIST" ? watchlistCardIds.has(item.cardId) : portfolioCardIds.has(item.cardId));
    const searchOk = !search.trim() || `${item.playerName} ${item.title}`.toLowerCase().includes(search.toLowerCase());
    return sportOk && scopeOk && searchOk;
  };

  const bullishItems = useMemo(() => (boardQuery.data?.bullish || []).filter(inScope), [boardQuery.data, sport, scope, search, watchlistCardIds, portfolioCardIds]);
  const bearishItems = useMemo(() => (boardQuery.data?.bearish || []).filter(inScope), [boardQuery.data, sport, scope, search, watchlistCardIds, portfolioCardIds]);
  const risers = useMemo(() => (moversQuery.data?.risers || []).filter(inScope), [moversQuery.data, sport, scope, search, watchlistCardIds, portfolioCardIds]);
  const fallers = useMemo(() => (moversQuery.data?.fallers || []).filter(inScope), [moversQuery.data, sport, scope, search, watchlistCardIds, portfolioCardIds]);

  const stats = useMemo(() => {
    const neutralItems = (boardQuery.data?.neutral || []).filter(inScope);
    const all = [...bullishItems, ...neutralItems, ...bearishItems];
    return { total: all.length, bullish: bullishItems.length, bearish: bearishItems.length };
  }, [boardQuery.data, bullishItems, bearishItems, sport, scope, search, watchlistCardIds, portfolioCardIds]);

  const timelineEvents = useMemo(() => {
    const items = historyQuery.data || [];
    return items.map((item: any, index: number) => {
      const previous = items[index + 1];
      const delta = previous ? Number(item.compositeScore || 0) - Number(previous.compositeScore || 0) : 0;
      let label = `趋势维持 ${item.trend}`;
      if (previous && previous.trend !== item.trend) label = `趋势从 ${previous.trend} 切换为 ${item.trend}`;
      else if (delta >= 12) label = `综合分强势拉升 +${delta}`;
      else if (delta <= -12) label = `综合分明显回落 ${delta}`;
      return { id: item.id, label, createdAt: item.createdAt, score: item.compositeScore, trend: item.trend, confidence: item.confidence };
    });
  }, [historyQuery.data]);

  const savePreset = () => {
    const nextPreset: TrendPreset = { id: `${Date.now()}`, name: `${scope === "ALL" ? "全市场" : scope === "WATCHLIST" ? "关注列表" : "持仓组合"} · ${sport} · ${windowKey}`, search, sport, scope, windowKey };
    const nextPresets = [nextPreset, ...savedPresets].slice(0, 8);
    setSavedPresets(nextPresets); writePresets(nextPresets); toast.success("已保存当前筛选预设");
  };
  const applyPreset = (preset: TrendPreset) => {
    setSearch(preset.search); setSport(preset.sport); setScope(preset.scope); setWindowKey(preset.windowKey);
    toast.success(`已应用预设：${preset.name}`);
  };
  const removePreset = (id: string) => {
    const nextPresets = savedPresets.filter((item) => item.id !== id);
    setSavedPresets(nextPresets); writePresets(nextPresets); toast.success("已删除预设");
  };
  const exportTrendCsv = () => {
    const rows = [
      ...bullishItems.map((item: any) => ({ 板块: "持续强势榜", 球员: item.playerName, 项目: item.sport, 卡片: item.title, 趋势: item.trend, 综合分: item.compositeScore, 置信度: item.confidence, 当前价: item.currentPrice, 摘要: item.summary })),
      ...bearishItems.map((item: any) => ({ 板块: "风险预警榜", 球员: item.playerName, 项目: item.sport, 卡片: item.title, 趋势: item.trend, 综合分: item.compositeScore, 置信度: item.confidence, 当前价: item.currentPrice, 摘要: item.summary })),
      ...risers.map((item: any) => ({ 板块: `趋势上升榜-${windowKey}`, 球员: item.playerName, 项目: item.sport, 卡片: item.title, 趋势: item.trend, 综合分: item.compositeScore, 变化分: item.deltaScore, 事件: item.eventLabel, 当前价: item.currentPrice })),
      ...fallers.map((item: any) => ({ 板块: `趋势下降榜-${windowKey}`, 球员: item.playerName, 项目: item.sport, 卡片: item.title, 趋势: item.trend, 综合分: item.compositeScore, 变化分: item.deltaScore, 事件: item.eventLabel, 当前价: item.currentPrice })),
      ...(historyQuery.data || []).map((item: any) => ({ 板块: `单卡轨迹-${selectedCard?.playerName || "未选择"}`, 球员: selectedCard?.playerName || "", 趋势: item.trend, 综合分: item.compositeScore, 置信度: item.confidence, 时间: new Date(item.createdAt).toLocaleString("zh-CN") })),
    ];
    if (!rows.length) { toast.error("暂无可导出的趋势数据"); return; }
    downloadCsv(`trend-history-${windowKey}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success("趋势数据已导出 CSV");
  };
  const handleWatch = (item: any) => addWatchlistMutation.mutate({ cardId: item.cardId, alertDealScoreAbove: 75, notes: `${item.playerName} 从趋势页加入关注` });
  const handlePortfolio = (item: any) => {
    const card = cardMap.get(item.cardId);
    addPortfolioMutation.mutate({ cardId: item.cardId, quantity: 1, averageCost: Number(card?.currentPrice ?? item.currentPrice ?? 0), targetPrice: Number(card?.currentPrice ?? item.currentPrice ?? 0) * 1.2, notes: `${item.playerName} 从趋势页加入组合` });
  };

  const selectClass = "rounded-xl border border-[#D0DCE8] bg-white px-3 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:ring-2 focus:ring-[#1D6FEB]/20 transition-all";

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* 页面标题 */}
        <div className="pb-5 border-b border-[#D0DCE8]">
          <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">趋势历史</h1>
          <p className="mt-1 text-sm text-[#6B7FA3]">全市场强弱榜 · 变动榜 · 单卡趋势反转时间线</p>
        </div>

        {/* 汇总数字 */}
        <div className="grid gap-3 grid-cols-3">
          {[
            { label: "当前样本", value: stats.total, icon: <Filter className="h-3.5 w-3.5 text-[#1D6FEB]" /> },
            { label: "强势趋势", value: stats.bullish, icon: <TrendingUp className="h-3.5 w-3.5 text-[#16a34a]" /> },
            { label: "风险预警", value: stats.bearish, icon: <TrendingDown className="h-3.5 w-3.5 text-[#dc2626]" /> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#D0DCE8] bg-white p-4">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7FA3] mb-1.5">{item.icon} {item.label}</div>
              <div className="text-2xl font-bold text-[#0A1628] font-data">{item.value}</div>
            </div>
          ))}
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7FA3]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索球员、品牌、系列" className="w-full rounded-xl border border-[#D0DCE8] bg-white py-2.5 pl-9 pr-4 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:ring-2 focus:ring-[#1D6FEB]/20 transition-all" />
          </div>
          <select value={sport} onChange={(e) => setSport(e.target.value)} className={selectClass}>{sportOptions.map((item) => <option key={item} value={item}>{item === "ALL" ? "全部项目" : item}</option>)}</select>
          <select value={scope} onChange={(e) => setScope(e.target.value as ScopeOption)} className={selectClass}><option value="ALL">全部范围</option><option value="WATCHLIST">只看关注</option><option value="PORTFOLIO">只看持仓</option></select>
          <select value={windowKey} onChange={(e) => setWindowKey(e.target.value as WindowOption)} className={selectClass}>{windowOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button onClick={savePreset} className="flex items-center gap-1.5 rounded-xl border border-[#D0DCE8] bg-white px-3 py-2.5 text-sm text-[#0A1628] hover:bg-[#F8F9FA] transition-colors"><Save className="h-4 w-4 text-[#6B7FA3]" /> 保存预设</button>
          <button onClick={exportTrendCsv} className="flex items-center gap-1.5 rounded-xl bg-[#1D6FEB] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors"><Download className="h-4 w-4" /> 导出 CSV</button>
        </div>

        {/* 时间窗口提示 */}
        <div className="flex items-center gap-2 rounded-xl border border-[#D0DCE8] bg-[#F5F8FF] px-4 py-3 text-xs text-[#6B7FA3]">
          <CalendarRange className="h-4 w-4 text-[#1D6FEB] shrink-0" />
          当前变动窗口：<span className="font-semibold text-[#0A1628]">{windowKey}</span>。上升榜和下降榜将按所选窗口对比最近一次历史快照。
        </div>

        {/* 筛选预设 */}
        {savedPresets.length > 0 && (
          <div className="rounded-xl border border-[#D0DCE8] bg-white p-4">
            <div className="text-xs font-semibold text-[#0A1628] mb-2.5">筛选预设</div>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="inline-flex items-center gap-1 rounded-full border border-[#D0DCE8] bg-[#F8F9FA] px-3 py-1.5 text-xs">
                  <button onClick={() => applyPreset(preset)} className="font-medium text-[#0A1628] hover:text-[#1D6FEB] transition-colors">{preset.name}</button>
                  <button onClick={() => removePreset(preset.id)} className="rounded-full p-0.5 text-[#6B7FA3] hover:text-[#dc2626] transition-colors"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 强弱榜 */}
        <div className="grid gap-4 xl:grid-cols-2">
          <TrendBoard title="持续强势榜" items={bullishItems} tone="bullish" onWatch={handleWatch} onPortfolio={handlePortfolio} />
          <TrendBoard title="风险预警榜" items={bearishItems} tone="bearish" onWatch={handleWatch} onPortfolio={handlePortfolio} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <TrendMoversBoard title={`趋势上升榜 · ${windowKey}`} items={risers} type="riser" onWatch={handleWatch} onPortfolio={handlePortfolio} />
          <TrendMoversBoard title={`趋势下降榜 · ${windowKey}`} items={fallers} type="faller" onWatch={handleWatch} onPortfolio={handlePortfolio} />
        </div>

        {/* 单卡趋势轨迹 */}
        <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-[#0A1628]"><History className="h-4 w-4 text-[#1D6FEB]" /> 单卡趋势轨迹</div>
              <p className="mt-0.5 text-xs text-[#6B7FA3]">根据每次扫描保存的趋势快照，还原综合分和方向变化</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] px-3 py-2 text-xs text-[#6B7FA3]">
                {scope === "WATCHLIST" ? <Bookmark className="h-3.5 w-3.5 text-[#1D6FEB]" /> : scope === "PORTFOLIO" ? <BriefcaseBusiness className="h-3.5 w-3.5 text-[#1D6FEB]" /> : <Filter className="h-3.5 w-3.5 text-[#1D6FEB]" />}
                {scope === "ALL" ? "全部" : scope === "WATCHLIST" ? "关注列表" : "持仓组合"}
              </div>
              <select value={selectedCardId} onChange={(e) => setSelectedCardId(Number(e.target.value))} className={`${selectClass} min-w-[200px]`}>
                {filteredCards.map((card: any) => <option key={card.id} value={card.id}>{card.playerName} · {card.year} {card.brand} {card.set}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              {/* 综合分走势图 */}
              <div className="rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7FA3] mb-3"><Activity className="h-3.5 w-3.5 text-[#1D6FEB]" /> 综合分走势</div>
                <div className="h-[240px] w-full">
                  <SimpleAreaChart data={chartData} height={240} showTooltip valueFormatter={(value) => `${value.toFixed(0)} 分`} />
                </div>
              </div>

              {/* 反转时间线 */}
              <div className="rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7FA3] mb-4"><ShieldAlert className="h-3.5 w-3.5 text-[#1D6FEB]" /> 反转时间线</div>
                <div className="space-y-3">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${event.trend === "bullish" ? "bg-[#16a34a]" : event.trend === "bearish" ? "bg-[#dc2626]" : "bg-[#D0DCE8]"}`} />
                        <div className="mt-1 w-px flex-1 bg-[#D0DCE8]" />
                      </div>
                      <div className="flex-1 rounded-xl border border-[#D0DCE8] bg-white p-3 mb-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[#0A1628]">{event.label}</div>
                            <div className="text-xs text-[#6B7FA3] mt-0.5">{new Date(event.createdAt).toLocaleString("zh-CN")}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base font-bold text-[#0A1628] font-data">{event.score}</div>
                            <div className="text-[10px] text-[#6B7FA3]">{event.confidence}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {timelineEvents.length === 0 && <div className="text-xs text-[#A8BDD4] py-4 text-center">暂无趋势事件</div>}
                </div>
              </div>
            </div>

            {/* 右侧信息面板 */}
            <div className="space-y-3">
              <div className="rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] p-4">
                <div className="text-[10px] font-semibold text-[#6B7FA3] uppercase tracking-wider mb-2">当前查看</div>
                <div className="text-base font-bold text-[#0A1628]">{selectedCard?.playerName || "未选择卡片"}</div>
                <div className="text-xs text-[#6B7FA3] mt-0.5">{selectedCard ? `${selectedCard.year} ${selectedCard.brand} ${selectedCard.set}` : ""}</div>
              </div>

              <div className="rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6B7FA3] uppercase tracking-wider mb-3"><TrendingUp className="h-3.5 w-3.5 text-[#1D6FEB]" /> 最新趋势</div>
                {historyQuery.data?.[0] ? (
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${historyQuery.data[0].trend === "bullish" ? "bg-[#dcfce7] text-[#16a34a]" : historyQuery.data[0].trend === "bearish" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#F8F9FA] text-[#6B7FA3]"}`}>{historyQuery.data[0].trend}</span>
                    <div className="text-3xl font-bold text-[#0A1628] font-data">{historyQuery.data[0].compositeScore}</div>
                    <div className="text-xs text-[#6B7FA3]">置信度 {historyQuery.data[0].confidence}%</div>
                  </div>
                ) : <div className="text-xs text-[#A8BDD4]">暂无趋势快照</div>}
              </div>

              <div className="rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6B7FA3] uppercase tracking-wider mb-3"><ShieldAlert className="h-3.5 w-3.5 text-[#1D6FEB]" /> 最近快照</div>
                <div className="space-y-2">
                  {(historyQuery.data || []).slice(0, 6).map((item: any) => (
                    <div key={item.id} className="rounded-lg border border-[#D0DCE8] bg-white p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.trend === "bullish" ? "bg-[#dcfce7] text-[#16a34a]" : item.trend === "bearish" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#F8F9FA] text-[#6B7FA3]"}`}>{item.trend}</span>
                        <span className="text-sm font-bold text-[#0A1628] font-data">{item.compositeScore}</span>
                      </div>
                      <div className="text-[10px] text-[#6B7FA3] mt-1">{new Date(item.createdAt).toLocaleString("zh-CN")}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
