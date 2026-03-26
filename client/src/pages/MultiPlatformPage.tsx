import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Globe2, Search, RefreshCw, ExternalLink, TrendingUp, TrendingDown,
  ShoppingCart, CheckCircle2, AlertCircle, Info, ChevronLeft, ChevronRight,
  Filter, Star, Database
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── 平台配置 ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "katao",
    name: "卡淘",
    nameEn: "CardHobby",
    color: "#E84B3A",
    bgColor: "#FFF5F5",
    borderColor: "#FECACA",
    description: "国内最大球星卡交易平台",
    status: "live",
    note: "直连 API，实时数据",
  },
  {
    id: "xianyu",
    name: "闲鱼",
    nameEn: "Goofish",
    color: "#F5A623",
    bgColor: "#FFFBF0",
    borderColor: "#FDE68A",
    description: "阿里二手交易平台",
    status: "auth_required",
    note: "需要登录 Cookie",
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    nameEn: "Xiaohongshu",
    color: "#FF2442",
    bgColor: "#FFF5F7",
    borderColor: "#FECDD3",
    description: "球星卡晒卡 & 价格情报",
    status: "auth_required",
    note: "需要登录 Cookie",
  },
];

// ─── 状态徽章 ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a] animate-pulse" />
        实时接入
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#D97706]">
      <AlertCircle className="h-2.5 w-2.5" />
      需要授权
    </span>
  );
}

// ─── 单条商品卡片 ────────────────────────────────────────────────────────────
function ListingCard({ listing, platform }: { listing: any; platform: typeof PLATFORMS[0] }) {
  const isSold = listing.status === "sold";
  const price = listing.price || 0;
  const priceUSD = listing.priceUSD;

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:shadow-md",
      isSold ? "bg-[#F8F9FA] border-[#E2EAF4]" : "bg-white border-[#D0DCE8]"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#0A1628] leading-tight line-clamp-2">
            {listing.title}
          </div>
          {listing.grade && listing.grade !== "Raw" && (
            <span className="mt-1 inline-block rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-bold text-[#1D6FEB]">
              {listing.grade}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-[#0A1628]">
            ¥{price.toLocaleString()}
          </div>
          {priceUSD && (
            <div className="text-[10px] text-[#6B7FA3]">≈ ${priceUSD}</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: platform.bgColor, color: platform.color, border: `1px solid ${platform.borderColor}` }}
          >
            {platform.name}
          </span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isSold ? "bg-[#F3F4F6] text-[#6B7280]" : "bg-[#dcfce7] text-[#16a34a]"
          )}>
            {isSold ? "已成交" : "在售"}
          </span>
        </div>
        {listing.url && (
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#1D6FEB] hover:underline"
          >
            查看 <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 平台状态卡片 ────────────────────────────────────────────────────────────
function PlatformCard({
  platform,
  data,
  isLoading,
}: {
  platform: typeof PLATFORMS[0];
  data?: any;
  isLoading?: boolean;
}) {
  const listings = data?.listings || [];
  const total = data?.total || 0;
  const error = data?.error;

  return (
    <div className={cn(
      "rounded-2xl border p-5",
      platform.status === "live" ? "bg-white border-[#D0DCE8]" : "bg-[#FAFAFA] border-[#E2EAF4]"
    )}>
      {/* 平台头部 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
              style={{ backgroundColor: platform.color }}
            >
              {platform.name[0]}
            </div>
            <div>
              <div className="text-sm font-bold text-[#0A1628]">{platform.name}</div>
              <div className="text-[10px] text-[#6B7FA3]">{platform.nameEn}</div>
            </div>
          </div>
          <p className="text-xs text-[#6B7FA3]">{platform.description}</p>
        </div>
        <StatusBadge status={platform.status} />
      </div>

      {/* 数据状态 */}
      {platform.status === "auth_required" ? (
        <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-[#92400E] mb-1">需要登录授权</div>
              <div className="text-[11px] text-[#92400E] leading-relaxed">
                {platform.name} 需要用户登录 Cookie 才能获取数据。请在设置页面配置 Cookie，或使用手机 App 扫码授权。
              </div>
              <button className="mt-2 text-[11px] font-semibold text-[#D97706] underline">
                前往配置 →
              </button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#F4F7FB] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-[#FFF5F5] border border-[#FECACA] p-4 text-xs text-[#DC2626]">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          数据获取失败：{error}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E2EAF4] p-4 text-center text-xs text-[#6B7FA3]">
          未找到相关商品
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#6B7FA3]">共 <span className="font-bold text-[#0A1628]">{total.toLocaleString()}</span> 条记录</span>
            <span className="text-[10px] text-[#A8BDD4]">{platform.note}</span>
          </div>
          {listings.slice(0, 5).map((listing: any, i: number) => (
            <ListingCard key={listing.id || i} listing={listing} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────
export function MultiPlatformPage() {
  const [searchQuery, setSearchQuery] = useState("Klay Thompson");
  const [activeSearch, setActiveSearch] = useState("Klay Thompson");
  const [statusFilter, setStatusFilter] = useState<1 | -2>(-2);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // 卡淘 Klay 专项数据（带分页）
  const klayKataoQuery = trpc.multiPlatform.klayKatao.useQuery({
    status: statusFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  // 综合多平台搜索
  const multiSearchQuery = trpc.multiPlatform.search.useQuery({
    playerName: activeSearch,
    pageSize: 10,
  });

  const handleSearch = () => {
    setActiveSearch(searchQuery);
    setPage(1);
  };

  const kataoData = multiSearchQuery.data?.platforms?.katao;
  const xianyuData = multiSearchQuery.data?.platforms?.xianyu;
  const xhsData = multiSearchQuery.data?.platforms?.xiaohongshu;
  const summary = multiSearchQuery.data?.summary;

  // 卡淘分页数据
  const klayListings = klayKataoQuery.data?.listings || [];
  const klayTotal = klayKataoQuery.data?.total || 0;
  const totalPages = Math.ceil(klayTotal / PAGE_SIZE);

  // 价格统计
  const prices = klayListings.filter((l: any) => l.price > 1).map((l: any) => l.price);
  const avgPrice = prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* 页头 */}
      <div className="border-b border-[#E2EAF4] bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-[#0A1628]">
              <Globe2 className="h-5 w-5 text-[#1D6FEB]" />
              多平台行情监控
            </h1>
            <p className="text-sm text-[#6B7FA3] mt-0.5">
              聚合卡淘、闲鱼、小红书实时数据，AI 清洗异常价格
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B7FA3]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#16a34a] animate-pulse" />
            卡淘实时接入中
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* 搜索栏 */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8BDD4]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜索球员名称（如 Klay Thompson、LeBron James）"
              className="w-full rounded-xl border border-[#D0DCE8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0A1628] placeholder-[#A8BDD4] focus:border-[#1D6FEB] focus:outline-none focus:ring-2 focus:ring-[#1D6FEB]/20"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-xl bg-[#1D6FEB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors"
          >
            <Search className="h-4 w-4" /> 搜索
          </button>
        </div>

        {/* 汇总统计 */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "总条目", value: summary.totalListings?.toLocaleString() || "0", sub: "多平台合计" },
              { label: "均价", value: summary.avgPriceCNY ? `¥${summary.avgPriceCNY.toLocaleString()}` : "N/A", sub: "人民币" },
              { label: "在售", value: summary.activeCount?.toString() || "0", sub: "当前挂单" },
              { label: "已成交", value: summary.soldCount?.toString() || "0", sub: "近期成交" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white border border-[#D0DCE8] p-4 text-center">
                <div className="text-xl font-bold text-[#0A1628]">{stat.value}</div>
                <div className="text-xs font-semibold text-[#6B7FA3] mt-0.5">{stat.label}</div>
                <div className="text-[10px] text-[#A8BDD4]">{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* 三平台状态卡片 */}
        <div>
          <h2 className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-[#1D6FEB]" />
            平台接入状态 — {activeSearch}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlatformCard
              platform={PLATFORMS[0]}
              data={kataoData}
              isLoading={multiSearchQuery.isLoading}
            />
            <PlatformCard
              platform={PLATFORMS[1]}
              data={xianyuData}
              isLoading={multiSearchQuery.isLoading}
            />
            <PlatformCard
              platform={PLATFORMS[2]}
              data={xhsData}
              isLoading={multiSearchQuery.isLoading}
            />
          </div>
        </div>

        {/* 卡淘 Klay Thompson 专项数据（带分页） */}
        <div className="rounded-2xl bg-white border border-[#D0DCE8] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#0A1628] flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-[#E84B3A] flex items-center justify-center text-white text-xs font-black">卡</div>
                卡淘 · Klay Thompson 完整数据
              </h2>
              <p className="text-xs text-[#6B7FA3] mt-0.5">
                共 <span className="font-bold text-[#0A1628]">{klayTotal.toLocaleString()}</span> 条记录 · 直连卡淘 API
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 状态筛选 */}
              <div className="flex rounded-xl border border-[#D0DCE8] overflow-hidden">
                <button
                  onClick={() => { setStatusFilter(-2); setPage(1); }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === -2 ? "bg-[#1D6FEB] text-white" : "bg-white text-[#6B7FA3] hover:bg-[#F5F8FF]"
                  )}
                >
                  成交记录
                </button>
                <button
                  onClick={() => { setStatusFilter(1); setPage(1); }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === 1 ? "bg-[#1D6FEB] text-white" : "bg-white text-[#6B7FA3] hover:bg-[#F5F8FF]"
                  )}
                >
                  在售商品
                </button>
              </div>
              <button
                onClick={() => klayKataoQuery.refetch()}
                className="flex items-center gap-1.5 rounded-xl border border-[#D0DCE8] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B7FA3] hover:bg-[#F5F8FF] transition-colors"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", klayKataoQuery.isFetching && "animate-spin")} />
                刷新
              </button>
            </div>
          </div>

          {/* 价格统计 */}
          {prices.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "均价", value: `¥${avgPrice.toLocaleString()}`, color: "text-[#1D6FEB]" },
                { label: "最低", value: `¥${minPrice.toLocaleString()}`, color: "text-[#16a34a]" },
                { label: "最高", value: `¥${maxPrice.toLocaleString()}`, color: "text-[#DC2626]" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-[#F5F8FF] border border-[#E2EAF4] p-3 text-center">
                  <div className={cn("text-lg font-bold", stat.color)}>{stat.value}</div>
                  <div className="text-[10px] text-[#6B7FA3] font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* 商品列表 */}
          {klayKataoQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-[#F4F7FB] animate-pulse" />
              ))}
            </div>
          ) : klayListings.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#6B7FA3]">暂无数据</div>
          ) : (
            <div className="space-y-2">
              {klayListings.map((listing: any, i: number) => (
                <div
                  key={listing.id || i}
                  className="flex items-center justify-between rounded-xl border border-[#E2EAF4] bg-[#FAFAFA] px-4 py-3 hover:bg-white hover:border-[#D0DCE8] transition-all"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-sm font-medium text-[#0A1628] truncate">{listing.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {listing.grade && listing.grade !== "Raw" && (
                        <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-bold text-[#1D6FEB]">
                          {listing.grade}
                        </span>
                      )}
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        listing.status === "sold" ? "bg-[#F3F4F6] text-[#6B7280]" : "bg-[#dcfce7] text-[#16a34a]"
                      )}>
                        {listing.status === "sold" ? "已成交" : "在售"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-[#0A1628]">
                      ¥{listing.price > 0 ? listing.price.toLocaleString() : "面议"}
                    </div>
                    {listing.priceUSD && (
                      <div className="text-[10px] text-[#6B7FA3]">≈ ${listing.priceUSD}</div>
                    )}
                    {listing.url && (
                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#1D6FEB] hover:underline flex items-center gap-0.5 justify-end mt-0.5"
                      >
                        查看 <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E2EAF4]">
              <div className="text-xs text-[#6B7FA3]">
                第 <span className="font-bold text-[#0A1628]">{page}</span> / {totalPages} 页，共 {klayTotal.toLocaleString()} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-[#D0DCE8] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B7FA3] hover:bg-[#F5F8FF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> 上一页
                </button>
                {/* 页码 */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "h-7 w-7 rounded-lg text-xs font-semibold transition-colors",
                          pageNum === page
                            ? "bg-[#1D6FEB] text-white"
                            : "border border-[#D0DCE8] bg-white text-[#6B7FA3] hover:bg-[#F5F8FF]"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-[#D0DCE8] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B7FA3] hover:bg-[#F5F8FF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  下一页 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 接入说明 */}
        <div className="rounded-2xl bg-white border border-[#D0DCE8] p-6">
          <h2 className="text-sm font-bold text-[#0A1628] mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-[#1D6FEB]" />
            平台接入说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLATFORMS.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#E2EAF4] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0A1628]">{p.name}</div>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <p className="text-xs text-[#6B7FA3] leading-relaxed">
                  {p.status === "live"
                    ? `✅ 已通过公开 API 直连，无需登录，可实时获取在售商品和成交记录。`
                    : `⚠️ ${p.name} 要求用户登录后才能查看搜索结果。请在设置页面配置您的账号 Cookie，即可自动采集数据。`}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#F0F7FF] border border-[#BFDBFE] p-4 text-xs text-[#1D6FEB]">
            <strong>💡 提示：</strong>闲鱼和小红书的 Cookie 配置后，系统将每 30 分钟自动刷新一次数据，并通过 AI 模型清洗异常价格，确保数据质量。
          </div>
        </div>
      </div>
    </div>
  );
}
