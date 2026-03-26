import { useState } from "react";
import { Link } from "wouter";
import { BadgeDollarSign, Boxes, ExternalLink, Factory, ShieldAlert, Sparkles, Star, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

const manufacturers = ["ALL", "Panini", "Topps", "Upper Deck"] as const;

export function BoxesPage() {
  const [manufacturer, setManufacturer] = useState<(typeof manufacturers)[number]>("ALL");
  const query = trpc.boxes.getIntelligence.useQuery({ manufacturer });
  const data = query.data;

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* 页面标题 */}
        <div className="flex items-start justify-between pb-5 border-b border-[#D0DCE8]">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">厂商与盒子情报中心</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">跟踪 Panini、Topps、Upper Deck 的主流产品线，展示盒子说明、常见 hit 与买盒建议</p>
          </div>
          <div className="rounded-xl border border-[#D0DCE8] bg-white px-4 py-2.5 text-xs text-[#6B7FA3]">
            最近更新：{data?.updatedAt ? new Date(data.updatedAt).toLocaleString("zh-CN") : "加载中..."}
          </div>
        </div>

        {/* 厂商筛选 */}
        <div className="flex flex-wrap gap-2">
          {manufacturers.map((item) => (
            <button
              key={item}
              onClick={() => setManufacturer(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${manufacturer === item ? "bg-[#1D6FEB] text-white" : "border border-[#D0DCE8] bg-white text-[#6B7FA3] hover:bg-[#F8F9FA]"}`}
            >
              {item === "ALL" ? "全部厂商" : item}
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          {/* 左列：厂商概览 + 产品卡片 */}
          <div className="space-y-4">
            {(data?.manufacturers || []).map((maker: any) => (
              <div key={maker.manufacturer} className="rounded-xl border border-[#D0DCE8] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1D6FEB] mb-1.5">Manufacturer</div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#0A1628]">
                      <Factory className="h-4 w-4 text-[#1D6FEB]" /> {maker.manufacturer}
                    </h2>
                    <p className="mt-2 text-sm text-[#6B7FA3] leading-relaxed">{maker.overview}</p>
                  </div>
                  <span className="shrink-0 rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] px-3 py-1.5 text-xs text-[#6B7FA3]">{maker.products.length} 个重点产品</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoBox title="定位" items={maker.positioning} />
                  <InfoBox title="优势 / 风险" items={[...maker.strengths, ...maker.watchouts.map((item: string) => `注意：${item}`)]} />
                </div>
              </div>
            ))}

            <div className="grid gap-4 lg:grid-cols-2">
              {(data?.products || []).map((product: any) => (
                <Link key={product.id} href={`/boxes/`}>
                  <div className="rounded-xl border border-[#D0DCE8] bg-white p-4 hover:border-[#1D6FEB] hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1D6FEB] mb-1">{product.manufacturer}</div>
                        <h3 className="text-base font-bold text-[#0A1628]">{product.productLine}</h3>
                        <div className="text-xs text-[#6B7FA3] mt-0.5">{product.season} · {product.format}</div>
                      </div>
                      <BuyBadge rating={product.buyRating} />
                    </div>
                    <p className="mt-3 text-xs text-[#6B7FA3] leading-relaxed line-clamp-2">{product.description}</p>
                    <div className="mt-3 grid gap-2">
                      <InfoBox title="盒内关注点" items={product.boxHits} compact />
                      <InfoBox title="优先追什么卡" items={product.whatToChase} compact />
                    </div>
                    <div className="mt-3 rounded-xl bg-[#F8F9FA] border border-[#D0DCE8] p-3 text-xs text-[#6B7FA3]">
                      <span className="font-semibold text-[#0A1628]">适合谁：</span>{product.audience}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[10px] text-[#A8BDD4] leading-relaxed line-clamp-2 flex-1">{product.note}</p>
                      <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-1 rounded-lg border border-[#D0DCE8] bg-white px-2.5 py-1 text-[10px] font-medium text-[#6B7FA3] hover:bg-[#F8F9FA] transition-colors">
                        来源 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 右列：买盒决策 + 快速判断 */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A1628] mb-4">
                <Boxes className="h-4 w-4 text-[#1D6FEB]" /> 买盒决策
              </div>
              <div className="space-y-3">
                {(data?.buyingGuide || []).map((item: any) => (
                  <div key={item.title} className="rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] p-3">
                    <div className="text-sm font-semibold text-[#0A1628]">{item.title}</div>
                    <div className="mt-1 text-xs text-[#6B7FA3] leading-relaxed">{item.content}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A1628] mb-4">
                <TrendingUp className="h-4 w-4 text-[#1D6FEB]" /> 快速判断
              </div>
              <div className="space-y-2">
                <MetricRow label="更适合流动性" value="Prizm / Select / Chrome" icon={<BadgeDollarSign className="h-3.5 w-3.5 text-[#16a34a]" />} />
                <MetricRow label="更适合审美收藏" value="Court Kings / Sapphire" icon={<Sparkles className="h-3.5 w-3.5 text-[#1D6FEB]" />} />
                <MetricRow label="更适合数字体验" value="Upper Deck e-Pack" icon={<Star className="h-3.5 w-3.5 text-[#f59e0b]" />} />
                <MetricRow label="更要注意风险" value="高价限量 / 新品首发热" icon={<ShieldAlert className="h-3.5 w-3.5 text-[#dc2626]" />} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-[#D0DCE8] bg-[#F8F9FA] ${compact ? "p-3" : "p-4"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7FA3] mb-2">{title}</div>
      <div className="space-y-1 text-xs text-[#0A1628]">
        {items.map((item) => <div key={item} className="flex gap-1.5"><span className="text-[#1D6FEB] shrink-0">·</span>{item}</div>)}
      </div>
    </div>
  );
}

function BuyBadge({ rating }: { rating: "HIGH" | "MEDIUM" | "LOW" }) {
  const styles = rating === "HIGH" ? "bg-[#dcfce7] text-[#16a34a]" : rating === "MEDIUM" ? "bg-[#fef9c3] text-[#a16207]" : "bg-[#fee2e2] text-[#dc2626]";
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${styles}`}>{rating === "HIGH" ? "值得重点看" : rating === "MEDIUM" ? "选择性买" : "更适合观望"}</span>;
}

function MetricRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#F8F9FA] border border-[#D0DCE8] px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-[#6B7FA3]">{icon} {label}</div>
      <div className="text-xs font-semibold text-[#0A1628]">{value}</div>
    </div>
  );
}
