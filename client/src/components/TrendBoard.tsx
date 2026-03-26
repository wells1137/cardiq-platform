import { AlertTriangle, ArrowUpRight, BookmarkPlus, BriefcaseBusiness, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export function TrendBoard({
  title,
  items,
  tone,
  onWatch,
  onPortfolio,
}: {
  title: string;
  items: any[];
  tone: "bullish" | "bearish" | "neutral";
  onWatch?: (item: any) => void;
  onPortfolio?: (item: any) => void;
}) {
  const Icon = tone === "bullish" ? TrendingUp : tone === "bearish" ? TrendingDown : Minus;
  const badgeClass = tone === "bullish" ? "bg-up/10 text-up" : tone === "bearish" ? "bg-down/10 text-down" : "bg-muted text-white/55";

  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Icon className={`h-5 w-5 ${tone === "bullish" ? "text-up" : tone === "bearish" ? "text-down" : "text-white/55"}`} />
          {title}
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${badgeClass}`}>{tone}</div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.cardId} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-primary/30 hover:bg-white/6">
            <Link href={`/card/${item.cardId}`}>
              <div className="cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary/80">{item.sport}</div>
                    <div className="mt-1 font-semibold text-white">{item.playerName}</div>
                    <div className="mt-1 text-sm text-white/55">{item.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{item.compositeScore}</div>
                    <div className="text-xs text-white/55">{item.confidence}%</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <div className="line-clamp-2 text-white/55">{item.summary}</div>
                  <div className="flex shrink-0 items-center gap-1 font-medium text-primary">详情 <ArrowUpRight className="h-4 w-4" /></div>
                </div>
              </div>
            </Link>
            {(onWatch || onPortfolio) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => onWatch?.(item)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-white transition hover:bg-muted"><BookmarkPlus className="h-4 w-4" /> 关注</button>
                <button onClick={() => onPortfolio?.(item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"><BriefcaseBusiness className="h-4 w-4" /> 建仓</button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-white/55">
            <AlertTriangle className="h-4 w-4" /> 暂无足够样本
          </div>
        )}
      </div>
    </div>
  );
}
