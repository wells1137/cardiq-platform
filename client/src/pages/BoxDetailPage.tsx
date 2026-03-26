import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ExternalLink, Layers3, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CardFrame } from "@/components/CardFrame";
import { SimpleSparkline } from "@/components/charts/SimpleSparkline";

export function BoxDetailPage() {
  const [match, params] = useRoute("/boxes/:id");
  const id = params?.id || "";
  const boxQuery = trpc.boxes.getById.useQuery({ id }, { enabled: !!id });
  const cardsQuery = trpc.cards.getAll.useQuery({ limit: 120 });

  const relatedCards = useMemo(() => {
    const box = boxQuery.data;
    if (!box) return [] as any[];
    return (cardsQuery.data || []).filter((card: any) => {
      const brandText = `${card.brand || ""}`.toLowerCase();
      const setText = `${card.set || ""}`.toLowerCase();
      const brandMatch = (box.brandKeywords || []).some((item: string) => brandText.includes(item.toLowerCase()));
      const setMatch = (box.setKeywords || []).some((item: string) => setText.includes(item.toLowerCase()));
      return brandMatch || setMatch;
    });
  }, [boxQuery.data, cardsQuery.data]);

  const groupedPlayers = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const card of relatedCards) {
      const key = card.playerName || "Unknown";
      const current = map.get(key) || [];
      current.push(card);
      map.set(key, current);
    }
    return Array.from(map.entries()).map(([playerName, cards]) => ({
      playerName,
      cards,
      avgPrice: average(cards.map((card) => Number(card.currentPrice || 0))),
      avgTrend: average(cards.map((card) => Number(card.priceChange7d || 0))),
      topDeal: [...cards].sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0))[0],
      sparkline: cards.map((card) => Number(card.currentPrice || 0)).slice(0, 6),
    })).sort((a, b) => Number(b.topDeal?.dealScore || 0) - Number(a.topDeal?.dealScore || 0));
  }, [relatedCards]);

  const setLeaders = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const card of relatedCards) {
      const key = card.set || "未标注系列";
      const current = map.get(key) || [];
      current.push(card);
      map.set(key, current);
    }
    return Array.from(map.entries()).map(([setName, cards]) => ({
      setName,
      cards,
      count: cards.length,
      avgTrend: average(cards.map((card) => Number(card.priceChange7d || 0))),
      avgDealScore: average(cards.map((card) => Number(card.dealScore || 0))),
      topCard: [...cards].sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0))[0],
    })).sort((a, b) => b.avgDealScore - a.avgDealScore).slice(0, 5);
  }, [relatedCards]);

  const intelligence = useMemo(() => {
    const avgTrend = average(relatedCards.map((card: any) => Number(card.priceChange7d || 0)));
    const avgDealScore = average(relatedCards.map((card: any) => Number(card.dealScore || 0)));
    const premiumCount = relatedCards.filter((card: any) => Number(card.dealScore || 0) >= 80).length;
    const risingPlayers = groupedPlayers.filter((player) => player.avgTrend > 0).length;
    const momentum = avgTrend >= 6 ? "强" : avgTrend >= 1 ? "中" : "弱";
    const verdict = boxQuery.data?.buyRating === "HIGH" && avgDealScore >= 72
      ? "值得重点关注"
      : boxQuery.data?.buyRating === "LOW" || avgTrend < -2
        ? "更适合谨慎观望"
        : "适合择机买入";
    const reasons = [
      `关联卡 7 日均涨跌为 ${avgTrend >= 0 ? "+" : ""}${avgTrend.toFixed(1)}%，当前热度 ${momentum}。`,
      `共匹配 ${relatedCards.length} 张相关卡，其中 ${premiumCount} 张价值分达到 80+。`,
      `相关球员里有 ${risingPlayers} 位处在正趋势区间，说明拆盒命中后更容易有交易弹性。`,
      setLeaders[0] ? `当前最值得盯的系列是 ${setLeaders[0].setName}，均值评分 ${setLeaders[0].avgDealScore.toFixed(0)}。` : "当前缺少足够的系列样本，需要继续补数据。",
    ];
    return { avgTrend, avgDealScore, premiumCount, risingPlayers, verdict, reasons };
  }, [boxQuery.data?.buyRating, groupedPlayers, relatedCards, setLeaders]);

  if (!match) return null;
  if (boxQuery.isLoading) return <div className="flex-1 p-8 text-center text-muted-foreground">盒子情报加载中...</div>;
  if (!boxQuery.data) return <div className="flex-1 p-8 text-center text-muted-foreground">未找到该盒子</div>;

  const box = boxQuery.data;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1020] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Link href="/boxes" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> 返回盒子情报</Link>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(29,111,235,0.28),transparent_30%),linear-gradient(135deg,#151c33_0%,#0b1020_45%,#111827_100%)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Box Deep Dive</div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{box.productLine}</h1>
              <div className="mt-3 text-sm text-white/55">{box.manufacturer} · {box.season} · {box.format}</div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72">{box.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Pill>{box.buyRating === "HIGH" ? "值得重点看" : box.buyRating === "MEDIUM" ? "选择性买" : "更适合观望"}</Pill>
                <Pill>{relatedCards.length} 张相关卡</Pill>
                <Pill>{groupedPlayers.length} 位相关球员</Pill>
              </div>
            </div>
            <a href={box.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10">来源 <ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <MetricMini label="关联卡样本" value={`${relatedCards.length}`} />
          <MetricMini label="均值趋势" value={`${intelligence.avgTrend >= 0 ? "+" : ""}${intelligence.avgTrend.toFixed(1)}%`} />
          <MetricMini label="高价值样本" value={`${intelligence.premiumCount}`} />
          <MetricMini label="相关球员" value={`${groupedPlayers.length}`} />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary"><ShieldCheck className="h-3.5 w-3.5" /> AI 拆盒结论</div>
              <div className="mt-3 text-2xl font-black text-white">{intelligence.verdict}</div>
              <div className="mt-2 text-sm text-white/55">结合平台内相关卡走势、价值分和球员热度自动给出的拆盒判断。</div>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/65">{box.buyRating} Rating</div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {intelligence.reasons.map((reason) => (
                <div key={reason} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/72">{reason}</div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-white"><Target className="h-4 w-4 text-primary" /> 最值得追的系列</div>
              <div className="mt-4 space-y-3">
                {setLeaders.slice(0, 3).map((set) => (
                  <div key={set.setName} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{set.setName}</div>
                        <div className="mt-1 text-xs text-white/45">{set.count} 张卡 · 均值分 {set.avgDealScore.toFixed(0)}</div>
                      </div>
                      <div className={`text-xs font-bold ${set.avgTrend >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{set.avgTrend >= 0 ? "+" : ""}{set.avgTrend.toFixed(1)}%</div>
                    </div>
                    {set.topCard ? <Link href={`/card/${set.topCard.id}`} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">查看代表卡</Link> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <SectionCard title="拆盒策略" items={box.strategy} />
            <SectionCard title="优先追什么卡" items={box.whatToChase} />
            <SectionCard title="盒内关注点" items={box.boxHits} />
          </div>
          <div className="space-y-6">
            <SectionCard title="优点" items={box.strengths} />
            <SectionCard title="风险" items={box.risks} />
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">适合人群</div>
              <div className="mt-3 text-sm leading-6 text-white/72">{box.audience}</div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">{box.note}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-2 text-lg font-bold text-white"><Layers3 className="h-5 w-5 text-primary" /> 相关球员与走势</div>
          {groupedPlayers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groupedPlayers.slice(0, 9).map((player) => (
                <div key={player.playerName} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">{player.playerName}</div>
                      <div className="mt-1 text-xs text-white/45">{player.cards.length} 张相关卡</div>
                    </div>
                    <div className={`text-xs font-bold ${player.avgTrend >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{player.avgTrend >= 0 ? <TrendingUp className="inline h-3.5 w-3.5" /> : <TrendingDown className="inline h-3.5 w-3.5" />} {player.avgTrend >= 0 ? "+" : ""}{player.avgTrend.toFixed(1)}%</div>
                  </div>
                  <div className="mt-3 h-10"><SimpleSparkline values={player.sparkline.length > 1 ? player.sparkline : [player.avgPrice, player.avgPrice]} color="#4cc9f0" fill="rgba(76,201,240,0.12)" /></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <MetricMini label="均价" value={`$${player.avgPrice.toFixed(0)}`} />
                    <MetricMini label="最佳分" value={`${Number(player.topDeal?.dealScore || 0).toFixed(0)}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/45">当前数据库中暂无与该盒子关键词直接映射的卡片。</div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-2 text-lg font-bold text-white"><Sparkles className="h-5 w-5 text-primary" /> 相关卡片</div>
          {relatedCards.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedCards.slice(0, 12).map((card: any) => (
                <Link key={card.id} href={`/card/${card.id}`}>
                  <div className="group cursor-pointer rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:border-primary/40 hover:bg-black/30">
                    <CardFrame card={card} className="aspect-[3/4] rounded-2xl" imageClassName="group-hover:scale-105 transition-transform duration-500" />
                    <div className="mt-4">
                      <div className="text-sm font-bold text-white">{card.playerName}</div>
                      <div className="mt-1 text-xs text-white/45">{card.year} {card.brand} {card.set}</div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-semibold text-white">${Number(card.currentPrice || 0).toFixed(0)}</span>
                        <span className={`font-semibold ${Number(card.priceChange7d || 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{Number(card.priceChange7d || 0) >= 0 ? "+" : ""}{Number(card.priceChange7d || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/45">暂无可展示的相关卡片。</div>
          )}
        </div>
      </div>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/5 px-3 py-1 font-semibold text-white/75">{children}</span>;
}

function SectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{title}</div>
      <div className="mt-4 space-y-2 text-sm text-white/72">
        {items.map((item) => <div key={item}>- {item}</div>)}
      </div>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"><div className="text-[10px] text-white/35">{label}</div><div className="mt-1 font-semibold text-white">{value}</div></div>;
}
