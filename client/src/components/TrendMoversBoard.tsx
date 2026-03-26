import { ArrowDownRight, ArrowUpRight, BookmarkPlus, BriefcaseBusiness, Minus } from "lucide-react";
import { Link } from "wouter";

export function TrendMoversBoard({ title, items, type, onWatch, onPortfolio }: { title: string; items: any[]; type: "riser" | "faller"; onWatch?: (item: any) => void; onPortfolio?: (item: any) => void; }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 text-lg font-bold text-foreground">{title}</div>
      <div className="space-y-3">
        {items.map((item) => {
          const positive = Number(item.deltaScore) >= 0;
          const severityClass = item.eventSeverity === "high"
            ? positive ? "bg-up/10 text-up" : "bg-down/10 text-down"
            : item.eventSeverity === "medium"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground";
          return (
            <div key={item.cardId} className="rounded-2xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/30">
              <Link href={`/card/${item.cardId}`}>
                <div className="cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/80">{item.sport}</div>
                      <div className="mt-1 font-semibold text-foreground">{item.playerName}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.title}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 text-sm font-black ${positive ? "text-up" : "text-down"}`}>
                        {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {positive ? "+" : ""}{item.deltaScore}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">当前 {item.compositeScore}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>前次趋势：{item.previousTrend || "无"}</span>
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${severityClass}`}>{item.eventLabel}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>前次得分：{item.previousScore ?? "无"}</span>
                    <span>{item.trend === item.previousTrend ? <Minus className="inline h-3 w-3" /> : item.trend}</span>
                  </div>
                </div>
              </Link>
              {(onWatch || onPortfolio) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => onWatch?.(item)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"><BookmarkPlus className="h-4 w-4" /> 关注</button>
                  <button onClick={() => onPortfolio?.(item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"><BriefcaseBusiness className="h-4 w-4" /> 建仓</button>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="text-sm text-muted-foreground">暂无变化样本</div>}
      </div>
    </div>
  );
}
