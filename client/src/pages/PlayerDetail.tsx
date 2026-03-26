import { useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Activity, ChevronRight, Layers3, TrendingDown, TrendingUp, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { CardFrame } from "@/components/CardFrame";
import { SimpleSparkline } from "@/components/charts/SimpleSparkline";

// 运动项目颜色
const SPORT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  NBA: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  NFL: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  MLB: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  NHL: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  EPL: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

const SPORT_AVATAR_COLORS: Record<string, string> = {
  NBA: "1D6FEB", NFL: "16A34A", MLB: "0369A1", NHL: "0EA5E9", EPL: "7C3AED",
};

export function PlayerDetail() {
  const [match, params] = useRoute("/players/:id");
  const playerId = parseInt(params?.id || "0", 10);
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedSeries, setSelectedSeries] = useState<string>("ALL");

  const { data: cards, isLoading: cardsLoading } = trpc.cards.getByPlayer.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  const { data: player, isLoading: playerLoading } = trpc.players.getById.useQuery(
    { id: playerId },
    { enabled: !!playerId }
  );

  const playerName = player?.name || "未知球员";
  const sport = player?.sport || "N/A";
  const performanceScore = player?.performanceScore || 88;
  const safeCards = cards || [];
  const sportStyle = SPORT_COLORS[sport] || SPORT_COLORS.NBA;

  const brandGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const card of safeCards) {
      const key = card.brand || "未标注品牌";
      const current = map.get(key) || [];
      current.push(card);
      map.set(key, current);
    }
    return Array.from(map.entries())
      .map(([brand, brandCards]) => {
        const seriesMap = new Map<string, any[]>();
        for (const card of brandCards) {
          const key = card.set || "未标注系列";
          const current = seriesMap.get(key) || [];
          current.push(card);
          seriesMap.set(key, current);
        }
        const series = Array.from(seriesMap.entries())
          .map(([set, setCards]) => buildSeriesStats(brand, set, setCards))
          .sort((a, b) => b.avgDealScore - a.avgDealScore || b.totalCards - a.totalCards);
        return buildBrandStats(brand, brandCards, series);
      })
      .sort((a, b) => b.totalCards - a.totalCards || b.avgDealScore - a.avgDealScore);
  }, [safeCards]);

  const visibleBrands = selectedBrand === "ALL" ? brandGroups : brandGroups.filter((item) => item.brand === selectedBrand);
  const seriesOptions = useMemo(() => {
    if (selectedBrand === "ALL") return brandGroups.flatMap((item) => item.series.map((series: any) => `${item.brand}__${series.set}`));
    const brand = brandGroups.find((item) => item.brand === selectedBrand);
    return (brand?.series || []).map((series: any) => `${selectedBrand}__${series.set}`);
  }, [brandGroups, selectedBrand]);

  const filteredCards = useMemo(() => {
    return safeCards.filter((card: any) => {
      const matchesBrand = selectedBrand === "ALL" || (card.brand || "未标注品牌") === selectedBrand;
      const seriesKey = `${card.brand || "未标注品牌"}__${card.set || "未标注系列"}`;
      const matchesSeries = selectedSeries === "ALL" || seriesKey === selectedSeries;
      return matchesBrand && matchesSeries;
    });
  }, [safeCards, selectedBrand, selectedSeries]);

  const marketOverview = useMemo(() => {
    const values = filteredCards.map((card: any) => Number(card.currentPrice || 0));
    const avgPrice = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const avgTrend = filteredCards.length > 0 ? filteredCards.reduce((sum: number, card: any) => sum + Number(card.priceChange7d || 0), 0) / filteredCards.length : 0;
    const topDeal = [...filteredCards].sort((a: any, b: any) => Number(b.dealScore || 0) - Number(a.dealScore || 0))[0];
    return { avgPrice, avgTrend, topDeal };
  }, [filteredCards]);

  if (!match) return null;
  if (playerLoading) return (
    <div className="flex-1 overflow-y-auto bg-[#F5F8FF] p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#E2EAF4]" />)}
      </div>
    </div>
  );

  const avatarUrl = player?.imageUrl && !player.imageUrl.includes('ui-avatars')
    ? player.imageUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=${SPORT_AVATAR_COLORS[sport] || '1D6FEB'}&color=ffffff&size=400&bold=true`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F8FF] p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 面包屑 */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7FA3]">
          <Link href="/players" className="hover:text-[#1D6FEB] transition-colors">球员数据库</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#0A1628]">{playerName}</span>
        </div>

        {/* 球员 Hero 区域 */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-[#E2EAF4] bg-white shadow-sm"
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#EEF4FF] via-white to-[#F0F5FF]" />
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#EEF4FF] to-transparent" />

          <div className="relative grid gap-6 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:p-8">
            {/* 球员头像 */}
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-2 border-[#D8E8FF] bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF] shadow-lg">
              <img
                src={avatarUrl}
                alt={playerName}
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  const initials = playerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  const bg = SPORT_AVATAR_COLORS[sport] || '1D6FEB';
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=ffffff&size=400&bold=true&font-size=0.38`;
                }}
              />
            </div>

            {/* 球员信息 */}
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2.5 py-1 ${sportStyle.bg} ${sportStyle.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sportStyle.dot}`} />
                {sport}
              </span>
              <h1 className="mt-2 text-3xl font-black text-[#0A1628] tracking-tight">{playerName}</h1>
              <p className="mt-1 text-sm text-[#6B7FA3]">{player?.team || "—"} · {player?.position || "—"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${marketOverview.avgTrend >= 0 ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {marketOverview.avgTrend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  均价 7D {marketOverview.avgTrend >= 0 ? "+" : ""}{marketOverview.avgTrend.toFixed(1)}%
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8E8FF] bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#1D6FEB]">
                  <Layers3 className="h-3.5 w-3.5" /> {brandGroups.length} 品牌 / {brandGroups.reduce((sum, item) => sum + item.series.length, 0)} 系列
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8E8FF] bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#1D6FEB]">
                  <BarChart2 className="h-3.5 w-3.5" /> {safeCards.length} 张卡片
                </span>
              </div>
            </div>

            {/* 评分卡 */}
            <div className="shrink-0 rounded-2xl border border-[#D8E8FF] bg-[#EEF4FF] p-5 text-center min-w-[140px]">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7FA3]">综合评分</div>
              <div className="mt-2 text-5xl font-black text-[#1D6FEB]">{performanceScore}</div>
              <div className="mt-1 text-xs text-[#A8BDD4]">/100</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#D8E8FF]">
                <div className="h-full rounded-full bg-[#1D6FEB]" style={{ width: `${performanceScore}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/70 px-2 py-1.5">
                  <div className="text-[9px] text-[#A8BDD4]">均价</div>
                  <div className="font-bold text-[#0A1628]">${marketOverview.avgPrice.toFixed(0)}</div>
                </div>
                <div className="rounded-xl bg-white/70 px-2 py-1.5">
                  <div className="text-[9px] text-[#A8BDD4]">最佳品牌</div>
                  <div className="font-bold text-[#0A1628] truncate">{brandGroups[0]?.brand?.split(' ')[0] || "--"}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 筛选栏 */}
        <div className="grid gap-3 md:grid-cols-[1fr_220px_260px]">
          <div className="rounded-2xl border border-[#E2EAF4] bg-white p-4 shadow-sm">
            <div className="text-xs font-bold text-[#6B7FA3] uppercase tracking-wider">球员卡矩阵</div>
            <div className="mt-1 text-sm text-[#4A5568]">按品牌、系列、平行版本和评级展开，追踪价格与价值关系</div>
          </div>
          <select
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setSelectedSeries("ALL"); }}
            className="rounded-2xl border border-[#E2EAF4] bg-white px-4 py-3 text-sm text-[#0A1628] outline-none shadow-sm focus:border-[#1D6FEB]"
          >
            <option value="ALL">全部品牌</option>
            {brandGroups.map((item) => <option key={item.brand} value={item.brand}>{item.brand}</option>)}
          </select>
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="rounded-2xl border border-[#E2EAF4] bg-white px-4 py-3 text-sm text-[#0A1628] outline-none shadow-sm focus:border-[#1D6FEB]"
          >
            <option value="ALL">全部系列</option>
            {seriesOptions.map((item) => {
              const [brand, set] = item.split("__");
              return <option key={item} value={item}>{brand} · {set}</option>;
            })}
          </select>
        </div>

        {/* 主内容区 */}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* 左侧：品牌/系列矩阵 */}
          <div className="space-y-5">
            {visibleBrands.map((brand) => (
              <div key={brand.brand} className="rounded-3xl border border-[#E2EAF4] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1D6FEB]">品牌层</div>
                    <h2 className="mt-2 text-2xl font-black text-[#0A1628]">{brand.brand}</h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Pill>{brand.totalCards} 张卡</Pill>
                      <Pill>均价 ${brand.avgPrice.toFixed(0)}</Pill>
                      <Pill>均值分 {brand.avgDealScore.toFixed(0)}</Pill>
                      <Pill tone={brand.avgTrend >= 0 ? "up" : "down"}>7D {brand.avgTrend >= 0 ? "+" : ""}{brand.avgTrend.toFixed(1)}%</Pill>
                    </div>
                  </div>
                  <div className="min-w-[220px] rounded-2xl border border-[#E2EAF4] bg-[#F8FAFC] p-4">
                    <div className="text-xs font-semibold text-[#6B7FA3]">品牌价格脉冲</div>
                    <div className="mt-2 h-10"><SimpleSparkline values={brand.sparkline} color="#1D6FEB" fill="rgba(29,111,235,0.08)" /></div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {brand.series.filter((series: any) => selectedSeries === "ALL" || `${brand.brand}__${series.set}` === selectedSeries).map((series: any) => (
                    <div key={`${brand.brand}-${series.set}`} className="rounded-2xl border border-[#E2EAF4] bg-[#F8FAFC] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A8BDD4]">系列层</div>
                          <div className="mt-1 text-lg font-bold text-[#0A1628]">{series.set}</div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${series.avgTrend >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{series.avgTrend >= 0 ? "+" : ""}{series.avgTrend.toFixed(1)}%</span>
                      </div>
                      <div className="mt-3 h-10"><SimpleSparkline values={series.sparkline} color={series.avgTrend >= 0 ? "#16a34a" : "#dc2626"} fill={series.avgTrend >= 0 ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)"} /></div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <MetricMini label="卡量" value={`${series.totalCards}`} />
                        <MetricMini label="均价" value={`$${series.avgPrice.toFixed(0)}`} />
                        <MetricMini label="价值分" value={`${series.avgDealScore.toFixed(0)}`} />
                        <MetricMini label="最高价" value={`$${series.maxPrice.toFixed(0)}`} />
                      </div>
                      <div className="mt-4 space-y-2">
                        {series.cards.slice(0, 3).map((card: any) => (
                          <Link key={card.id} href={`/card/${card.id}`}>
                            <div className="cursor-pointer rounded-xl border border-[#E2EAF4] bg-white px-3 py-2 transition hover:border-[#1D6FEB] hover:shadow-sm">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-[#0A1628]">{card.parallel || "Base"} {card.grade || "RAW"}</div>
                                  <div className="text-xs text-[#6B7FA3]">{card.year} · 价值分 {Number(card.dealScore || 0).toFixed(0)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-[#0A1628]">${Number(card.currentPrice || 0).toFixed(0)}</div>
                                  <div className={`text-xs font-semibold ${Number(card.priceChange7d || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{Number(card.priceChange7d || 0) >= 0 ? "+" : ""}{Number(card.priceChange7d || 0).toFixed(1)}%</div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 右侧：汇总 + 单卡清单 */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#E2EAF4] bg-white p-6 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1D6FEB]">关系汇总</div>
              <div className="mt-4 space-y-2">
                <MetricRow label="收录卡片" value={`${safeCards.length} 张`} />
                <MetricRow label="覆盖品牌" value={`${brandGroups.length} 个`} />
                <MetricRow label="覆盖系列" value={`${brandGroups.reduce((sum, item) => sum + item.series.length, 0)} 个`} />
                <MetricRow label="最高价值品牌" value={brandGroups[0]?.brand || "--"} />
                <MetricRow label="当前筛选" value={selectedSeries !== "ALL" ? selectedSeries.split("__").join(" · ") : selectedBrand !== "ALL" ? selectedBrand : "全部"} />
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2EAF4] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-base font-bold text-[#0A1628]">
                <Activity className="h-4 w-4 text-[#1D6FEB]" /> 单卡清单
              </div>
              {cardsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-[#EEF1F5]" />)}</div>
              ) : filteredCards.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCards.slice(0, 8).map((card: any, index: number) => (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                      <Link href={`/card/${card.id}`}>
                        <div className="group grid cursor-pointer grid-cols-[80px_1fr] gap-3 rounded-2xl border border-[#E2EAF4] bg-[#F8FAFC] p-3 transition hover:border-[#1D6FEB] hover:shadow-md hover:shadow-blue-50">
                          <CardFrame card={card} className="aspect-[3/4] rounded-xl" imageClassName="group-hover:scale-105 transition-transform duration-500" />
                          <div className="min-w-0">
                            <div className="text-sm font-black text-[#0A1628]">{card.brand} · {card.set}</div>
                            <div className="mt-0.5 text-xs text-[#6B7FA3]">{card.parallel || "Base"} · {card.grade || "RAW"}</div>
                            <div className="mt-3 grid grid-cols-3 gap-1.5 text-xs">
                              <MetricMini label="价格" value={`$${Number(card.currentPrice || 0).toFixed(0)}`} />
                              <MetricMini label="7D" value={`${Number(card.priceChange7d || 0) >= 0 ? "+" : ""}${Number(card.priceChange7d || 0).toFixed(1)}%`} />
                              <MetricMini label="价值分" value={`${Number(card.dealScore || 0).toFixed(0)}`} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D0DCE8] p-8 text-center text-sm text-[#A8BDD4]">当前筛选下暂无卡片</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildBrandStats(brand: string, cards: any[], series: any[]) {
  const prices = cards.map((card) => Number(card.currentPrice || 0));
  const avgPrice = average(prices);
  const avgDealScore = average(cards.map((card) => Number(card.dealScore || 0)));
  const avgTrend = average(cards.map((card) => Number(card.priceChange7d || 0)));
  return { brand, totalCards: cards.length, avgPrice, avgDealScore, avgTrend, sparkline: prices.length > 1 ? prices : [avgPrice, avgPrice], series };
}

function buildSeriesStats(brand: string, set: string, cards: any[]) {
  const prices = cards.map((card) => Number(card.currentPrice || 0));
  return {
    brand, set, totalCards: cards.length,
    avgPrice: average(prices), maxPrice: Math.max(...prices, 0),
    avgDealScore: average(cards.map((card) => Number(card.dealScore || 0))),
    avgTrend: average(cards.map((card) => Number(card.priceChange7d || 0))),
    sparkline: prices.length > 1 ? prices : [prices[0] || 0, prices[0] || 0],
    cards: [...cards].sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0)),
  };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "up" | "down" }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === "up" ? "bg-green-50 text-green-700" : tone === "down" ? "bg-red-50 text-red-700" : "bg-[#EEF4FF] text-[#1D6FEB]"}`}>{children}</span>;
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white border border-[#E2EAF4] px-2.5 py-2"><div className="text-[9px] text-[#A8BDD4]">{label}</div><div className="mt-0.5 text-xs font-semibold text-[#0A1628]">{value}</div></div>;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#E2EAF4] px-4 py-2.5 text-sm"><span className="text-[#6B7FA3]">{label}</span><span className="font-semibold text-[#0A1628]">{value}</span></div>;
}
