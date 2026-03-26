import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Camera, BookmarkPlus, BriefcaseBusiness, ShieldCheck, TrendingUp, TrendingDown, SlidersHorizontal } from "lucide-react";
import { SimpleSparkline } from "@/components/charts/SimpleSparkline";

const sportOptions = ["all", "NBA", "NFL", "MLB", "NHL", "EPL"];
const setOptions = ["all", "Prizm", "Select", "Optic", "National Treasures", "Topps Chrome"];

const generateSparklineData = (startPrice: number, change: number) => {
  const data = [];
  let currentPrice = startPrice / (1 + change / 100 || 1);
  for (let i = 0; i < 14; i++) {
    const volatility = Math.max(currentPrice * 0.05, 1);
    currentPrice = currentPrice + (Math.random() - 0.5) * volatility;
    data.push(currentPrice);
  }
  data.push(startPrice);
  return data;
};

// 根据运动类型返回对应的渐变背景色
function getSportGradient(sport: string): string {
  switch (sport) {
    case "NBA": return "from-[#1a3a5c] via-[#1e4d8c] to-[#c8102e]";
    case "NFL": return "from-[#013369] via-[#1a4a8c] to-[#d50a0a]";
    case "MLB": return "from-[#002D72] via-[#003087] to-[#E31837]";
    case "EPL": return "from-[#3d195b] via-[#5c2d8c] to-[#00ff87]";
    default:    return "from-[#1a2a4a] via-[#1e3a6e] to-[#2563eb]";
  }
}

// 根据品牌返回标签颜色
function getBrandColor(brand: string): string {
  if (brand.includes("Prizm")) return "bg-[#c8102e] text-white";
  if (brand.includes("Chrome") || brand.includes("Topps")) return "bg-[#1a3a5c] text-white";
  if (brand.includes("Bowman")) return "bg-[#006400] text-white";
  if (brand.includes("Select")) return "bg-[#7c3aed] text-white";
  if (brand.includes("Mosaic")) return "bg-[#ea580c] text-white";
  return "bg-[#0A1628] text-white";
}

export function MarketSearch() {
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  const cardsQuery = trpc.cards.getAll.useQuery({ sport: sportFilter === "all" ? undefined : sportFilter, limit: 500 });
  const watchlistQuery = trpc.watchlist.get.useQuery();
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

  const cards = cardsQuery.data ?? [];
  const watchlistIds = new Set((watchlistQuery.data ?? []).map((item: any) => item.cardId));

  const filteredCards = useMemo(() => {
    return cards.filter((card: any) => {
      const matchesQuery = !searchQuery.trim() || [card.playerName, card.brand, card.set, card.parallel, card.grade].filter(Boolean).join(" ").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSet = setFilter === "all" || `${card.brand} ${card.set}`.toLowerCase().includes(setFilter.toLowerCase());
      const matchesGrade = gradeFilter === "all" || (card.grade || "raw").toLowerCase().replaceAll(" ", "") === gradeFilter;
      return matchesQuery && matchesSet && matchesGrade;
    });
  }, [cards, gradeFilter, searchQuery, setFilter]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">查价 / 市场</h1>
          <p className="mt-1 text-sm text-[#6B7FA3]">实时成交价聚合 · AI 清洗 · 一键加入关注与持仓</p>

          {/* 搜索栏 */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <Search className="h-4 w-4 text-[#A8BDD4]" />
              </div>
              <input
                type="text"
                className="w-full rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] py-3.5 pl-11 pr-4 text-sm text-[#0A1628] placeholder:text-[#A8BDD4] focus:border-[#1D6FEB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D6FEB]/15 transition-all"
                placeholder="搜索球员、系列、平行版本、评级..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/scanner">
              <button className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1D6FEB] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors shadow-sm shadow-blue-200">
                <Camera className="h-4 w-4" /> 拍照识卡
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6 space-y-5">

        {/* 筛选栏 - Pill 风格 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7FA3] mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> 筛选
          </div>
          {/* 运动类型 Pill */}
          <div className="flex flex-wrap gap-1.5">
            {sportOptions.map((item) => (
              <button
                key={item}
                onClick={() => setSportFilter(item)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  sportFilter === item
                    ? "bg-[#1D6FEB] text-white shadow-sm shadow-blue-200"
                    : "bg-white border border-[#E2EAF4] text-[#4A5568] hover:border-[#1D6FEB] hover:text-[#1D6FEB]"
                }`}
              >
                {item === "all" ? "全部" : item}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[#E2EAF4] mx-1" />

          {/* 评级筛选 */}
          <div className="flex flex-wrap gap-1.5">
            {[{ val: "all", label: "所有评级" }, { val: "psa10", label: "PSA 10" }, { val: "bgs9.5", label: "BGS 9.5" }, { val: "raw", label: "Raw" }].map((item) => (
              <button
                key={item.val}
                onClick={() => setGradeFilter(item.val)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  gradeFilter === item.val
                    ? "bg-[#0A1628] text-white"
                    : "bg-white border border-[#E2EAF4] text-[#4A5568] hover:border-[#0A1628] hover:text-[#0A1628]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#6B7FA3]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#16a34a]" />
            找到 <span className="font-bold text-[#0A1628]">{filteredCards.length}</span> 张卡牌
          </div>
        </div>

        {/* 卡牌网格 */}
        {cardsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse rounded-2xl bg-[#EEF1F5]" />
            ))}
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card: any) => {
              const inWatchlist = watchlistIds.has(card.id);
              const sparklineValues = generateSparklineData(Number(card.currentPrice || 0), Number(card.priceChange7d || 0));
              const isUp = Number(card.priceChange7d || 0) > 0;
              const isDown = Number(card.priceChange7d || 0) < 0;
              const color = isUp ? "#16a34a" : isDown ? "#dc2626" : "#94a3b8";
              const fill = isUp ? "rgba(22,163,74,0.08)" : isDown ? "rgba(220,38,38,0.08)" : "rgba(148,163,184,0.08)";
              const sportGradient = getSportGradient(card.sport);
              const brandColorClass = getBrandColor(card.brand);

              return (
                <div key={card.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2EAF4] bg-white hover:border-[#1D6FEB] hover:shadow-xl hover:shadow-blue-100/60 transition-all duration-300">
                  <Link href={`/card/${card.id}`}>
                    <div className="cursor-pointer">
                      {/* 卡牌图片区 - 深色渐变背景，展示真实卡面 */}
                      <div className={`relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-gradient-to-b ${sportGradient}`}>
                        
                        {/* 运动标签 */}
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-2.5 py-1 text-[10px] font-bold text-white">{card.sport}</span>
                        
                        {/* 评级标签 */}
                        {card.grade && (
                          <span className="absolute right-3 top-3 z-10 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-[10px] font-bold text-white">{card.grade}</span>
                        )}

                        {/* 真实球星卡卡面图片 */}
                        <img
                          src={card.imageUrl}
                          alt={`${card.playerName} ${card.year} ${card.brand}`}
                          className="h-[85%] w-auto max-w-[80%] object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1"
                          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}
                          onError={(e) => {
                            // 降级：显示球员头像
                            const target = e.currentTarget;
                            const parent = target.parentElement;
                            if (parent) {
                              target.style.display = "none";
                              // 创建占位符
                              const placeholder = document.createElement("div");
                              placeholder.className = "flex flex-col items-center justify-center text-white/60 gap-2";
                              placeholder.innerHTML = `<div class="text-4xl font-black opacity-30">${card.playerName.split(" ").map((n: string) => n[0]).join("")}</div><div class="text-xs opacity-50">${card.year} ${card.brand}</div>`;
                              parent.appendChild(placeholder);
                            }
                          }}
                        />

                        {/* 底部信息渐变遮罩 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-3 pt-8">
                          <p className="text-xs font-black text-white truncate tracking-wide">{card.playerName}</p>
                          <p className="text-[10px] text-white/60 truncate mt-0.5">{card.year} {card.brand}</p>
                        </div>

                        {/* 品牌标签 */}
                        <div className={`absolute bottom-3 right-3 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${brandColorClass} opacity-90`}>
                          {card.brand.includes("Prizm") ? "PRIZM" : 
                           card.brand.includes("Chrome") ? "CHROME" : 
                           card.brand.includes("Bowman") ? "BOWMAN" :
                           card.brand.includes("Select") ? "SELECT" :
                           card.brand.split(" ").pop()?.toUpperCase() || ""}
                        </div>
                      </div>

                      {/* 卡牌信息区 */}
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[11px] text-[#6B7FA3] truncate font-medium">{card.year} {card.brand} {card.set}</p>
                        <h3 className="mt-0.5 text-sm font-bold text-[#0A1628] truncate group-hover:text-[#1D6FEB] transition-colors">{card.playerName}</h3>
                        
                        {/* 平行版本标签 */}
                        {card.parallel && card.parallel !== "Base" && (
                          <span className="mt-1.5 inline-block rounded-full bg-[#EEF4FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#1D6FEB]">
                            {card.parallel}
                          </span>
                        )}

                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <div className="text-[10px] text-[#A8BDD4] mb-0.5 font-medium">市场估价</div>
                            <span className="text-xl font-bold text-[#0A1628] tracking-tight">${Number(card.currentPrice).toFixed(0)}</span>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-bold ${isUp ? "bg-green-50 text-[#16a34a]" : isDown ? "bg-red-50 text-[#dc2626]" : "bg-gray-50 text-[#94a3b8]"}`}>
                              {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : null}
                              {isUp ? "+" : ""}{Number(card.priceChange7d || 0).toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-[#A8BDD4] mt-0.5 text-right">7天</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <SimpleSparkline values={sparklineValues} color={color} fill={fill} />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* 操作按钮 */}
                  <div className="grid grid-cols-2 gap-2 border-t border-[#E2EAF4] p-3 mt-auto">
                    <button
                      onClick={() => addWatchlistMutation.mutate({ cardId: card.id, alertDealScoreAbove: 75, notes: `${card.playerName} 自动加入市场关注` })}
                      disabled={addWatchlistMutation.isPending || inWatchlist}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#4A5568] hover:bg-[#EEF4FF] hover:text-[#1D6FEB] hover:border-[#1D6FEB] transition-colors disabled:opacity-50"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" /> {inWatchlist ? "已关注" : "关注"}
                    </button>
                    <button
                      onClick={() => addPortfolioMutation.mutate({ cardId: card.id, quantity: 1, averageCost: Number(card.currentPrice || 0), targetPrice: Number(card.currentPrice || 0) * 1.2, notes: `${card.playerName} 来自市场页加入组合` })}
                      disabled={addPortfolioMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1D6FEB] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
                    >
                      <BriefcaseBusiness className="h-3.5 w-3.5" /> 建仓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D0DCE8] bg-white py-28 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1F5] mb-4">
              <Search className="h-7 w-7 text-[#A8BDD4]" />
            </div>
            <p className="text-sm font-semibold text-[#4A5568]">未找到匹配的卡牌</p>
            <p className="text-xs text-[#A8BDD4] mt-1.5">尝试调整搜索词或筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
