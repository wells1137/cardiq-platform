import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BrainCircuit, Clock3, Radar, TrendingDown, TrendingUp, Zap } from "lucide-react";

export function SignalCenterPage() {
  const [windowKey, setWindowKey] = useState<"24H" | "7D" | "30D">("24H");
  const signalBoardQuery = trpc.cards.getSignalCenterBoard.useQuery({ window: windowKey });
  const signalBoard = signalBoardQuery.data;

  const spotlightCards = useMemo(() => {
    if (!signalBoard) return [] as Array<{ key: string; tone: "buy" | "wait" | "risk"; item: any }>;
    return [
      signalBoard.spotlight.buy ? { key: "buy", tone: "buy" as const, item: signalBoard.spotlight.buy } : null,
      signalBoard.spotlight.wait ? { key: "wait", tone: "wait" as const, item: signalBoard.spotlight.wait } : null,
      signalBoard.spotlight.risk ? { key: "risk", tone: "risk" as const, item: signalBoard.spotlight.risk } : null,
    ].filter(Boolean) as Array<{ key: string; tone: "buy" | "wait" | "risk"; item: any }>;
  }, [signalBoard]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">交易信号中心</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">AI 趋势分析 · BUY / WAIT / RISK 三色清单 · 赛场 + 场外 + 市场三维信号</p>
          </div>
          {/* 时间窗口切换 */}
          <div className="flex gap-1 bg-[#F4F7FB] p-1 rounded-xl border border-[#E2EAF4]">
            {(["24H", "7D", "30D"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setWindowKey(item)}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                  windowKey === item
                    ? "bg-[#1D6FEB] text-white shadow-sm shadow-blue-200"
                    : "text-[#6B7FA3] hover:text-[#0A1628]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">

        {/* 汇总数字 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "趋势窗口", value: windowKey, icon: <Clock3 className="h-4 w-4" />, iconBg: "bg-blue-50", iconColor: "text-[#1D6FEB]" },
            { label: "强势候选", value: `${signalBoard?.summary?.risersCount ?? 0}`, icon: <TrendingUp className="h-4 w-4" />, iconBg: "bg-green-50", iconColor: "text-[#16a34a]", valueColor: "text-[#16a34a]" },
            { label: "风险候选", value: `${signalBoard?.summary?.fallersCount ?? 0}`, icon: <TrendingDown className="h-4 w-4" />, iconBg: "bg-red-50", iconColor: "text-[#dc2626]", valueColor: "text-[#dc2626]" },
            { label: "趋势反转", value: `${signalBoard?.summary?.reversalCount ?? 0}`, icon: <Radar className="h-4 w-4" />, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
          ].map((item: any) => (
            <div key={item.label} className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6B7FA3] uppercase tracking-wide">{item.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg} ${item.iconColor}`}>
                  {item.icon}
                </div>
              </div>
              <div className={`text-2xl font-bold font-data tracking-tight ${item.valueColor || "text-[#0A1628]"}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Spotlight 卡片 */}
        {spotlightCards.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-3">
            {spotlightCards.map(({ key, tone, item }) => (
              <SpotlightCard key={key} tone={tone} item={item} />
            ))}
          </div>
        )}

        {/* 信号列表 */}
        <div className="grid gap-4 xl:grid-cols-3">
          <SignalColumn title="BUY" tone="buy" subtitle="优先看强势与高置信度机会" items={signalBoard?.buy || []} />
          <SignalColumn title="WAIT" tone="wait" subtitle="走势中性，等待更多确认" items={signalBoard?.wait || []} />
          <SignalColumn title="RISK" tone="risk" subtitle="趋势走弱或短期回落明显" items={signalBoard?.risk || []} />
        </div>
      </div>
    </div>
  );
}

function SpotlightCard({ tone, item }: { tone: "buy" | "wait" | "risk"; item: any }) {
  const styles = {
    buy: {
      badge: "bg-green-50 text-[#16a34a] border-green-100",
      border: "border-green-100",
      bg: "bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5]",
      accent: "#16a34a",
      statBg: "bg-green-50",
    },
    wait: {
      badge: "bg-amber-50 text-[#92400e] border-amber-100",
      border: "border-amber-100",
      bg: "bg-gradient-to-br from-[#fffbeb] to-[#fef9c3]",
      accent: "#d97706",
      statBg: "bg-amber-50",
    },
    risk: {
      badge: "bg-red-50 text-[#dc2626] border-red-100",
      border: "border-red-100",
      bg: "bg-gradient-to-br from-[#fff5f5] to-[#fef2f2]",
      accent: "#dc2626",
      statBg: "bg-red-50",
    },
  }[tone];

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${styles.badge}`}>
            <Zap className="h-3 w-3" /> {tone.toUpperCase()} Spotlight
          </span>
          <div className="mt-2.5 text-base font-bold text-[#0A1628]">{item.playerName}</div>
          <div className="text-xs text-[#6B7FA3] mt-0.5">{item.title}</div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E2EAF4] shadow-sm">
          <BrainCircuit className="h-4 w-4 text-[#1D6FEB]" />
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "综合分", value: `${item.compositeScore}` },
          { label: "置信度", value: `${item.confidence}%` },
          { label: "空间", value: `${item.priceGapPct >= 0 ? "+" : ""}${item.priceGapPct || 0}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-[#E2EAF4] p-3 text-center shadow-sm">
            <div className="text-[10px] text-[#6B7FA3] mb-1 font-medium">{s.label}</div>
            <div className="text-sm font-bold text-[#0A1628] font-data">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 信号理由 */}
      <div className="space-y-2 mb-4">
        {item.reasons?.slice(0, 2).map((reason: string) => (
          <div key={reason} className="rounded-xl bg-white border border-[#E2EAF4] px-3 py-2.5 text-xs text-[#0A1628] leading-relaxed flex items-start gap-2">
            <span className="text-[#1D6FEB] font-bold mt-0.5">·</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {/* 三维因子 */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { label: "赛场", value: item.factors?.onCourt },
          { label: "场外", value: item.factors?.offCourt },
          { label: "市场", value: item.factors?.market },
        ].map((f) => (
          <div key={f.label} className="rounded-xl bg-white border border-[#E2EAF4] p-2.5 text-center">
            <div className="text-[10px] text-[#6B7FA3] font-medium">{f.label}</div>
            <div className="text-sm font-bold text-[#0A1628] mt-0.5">{Math.round(Number(f.value || 0))}</div>
          </div>
        ))}
      </div>

      <Link href={`/card/${item.cardId}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D6FEB] hover:underline">
        查看完整分析 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function SignalColumn({ title, subtitle, tone, items }: { title: string; subtitle: string; tone: "buy" | "wait" | "risk"; items: any[] }) {
  const styles = {
    buy: {
      badge: "bg-green-50 text-[#16a34a] border-green-100",
      header: "border-green-100",
      emptyIcon: "bg-green-50",
      emptyText: "text-[#16a34a]",
    },
    wait: {
      badge: "bg-amber-50 text-[#92400e] border-amber-100",
      header: "border-amber-100",
      emptyIcon: "bg-amber-50",
      emptyText: "text-amber-600",
    },
    risk: {
      badge: "bg-red-50 text-[#dc2626] border-red-100",
      header: "border-red-100",
      emptyIcon: "bg-red-50",
      emptyText: "text-[#dc2626]",
    },
  }[tone];

  return (
    <div className="rounded-2xl border border-[#E2EAF4] bg-white shadow-sm overflow-hidden">
      {/* 列标题 */}
      <div className={`border-b ${styles.header} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${styles.badge}`}>
            <Zap className="h-3 w-3" /> {title}
          </span>
          <span className="text-[11px] font-semibold text-[#6B7FA3]">{items.length} 个信号</span>
        </div>
        <p className="mt-2 text-xs text-[#6B7FA3]">{subtitle}</p>
      </div>

      <div className="p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.emptyIcon} mb-3`}>
              <BrainCircuit className={`h-5 w-5 ${styles.emptyText} animate-pulse`} />
            </div>
            <p className="text-sm font-semibold text-[#4A5568]">AI 分析中</p>
            <p className="text-xs text-[#A8BDD4] mt-1 max-w-[120px] leading-relaxed">正在扫描市场数据，信号将实时更新</p>
          </div>
        ) : (
          items.map((item) => (
            <Link key={`${title}-${item.cardId}`} href={`/card/${item.cardId}`}>
              <div className="rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] p-3.5 hover:border-[#1D6FEB] hover:bg-[#F0F5FF] transition-colors cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#0A1628] truncate group-hover:text-[#1D6FEB] transition-colors">{item.playerName}</div>
                    <div className="text-[11px] text-[#6B7FA3] truncate mt-0.5">{item.title}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[#0A1628] font-data">{item.compositeScore}</div>
                    <div className="text-[10px] text-[#6B7FA3]">{item.confidence}%</div>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {item.shortTermTarget && (
                    <span className="rounded-full bg-white border border-[#E2EAF4] px-2.5 py-0.5 text-[10px] font-semibold text-[#0A1628]">目标 ${Number(item.shortTermTarget).toFixed(0)}</span>
                  )}
                  {item.riskLevel && (
                    <span className="rounded-full bg-white border border-[#E2EAF4] px-2.5 py-0.5 text-[10px] font-semibold text-[#0A1628]">风险 {item.riskLevel}</span>
                  )}
                  {item.eventLabel && (
                    <span className="rounded-full bg-white border border-[#E2EAF4] px-2.5 py-0.5 text-[10px] font-semibold text-[#0A1628]">{item.eventLabel}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#6B7FA3] line-clamp-1">{item.summary || "查看详细分析"}</span>
                  <ArrowRight className="h-3 w-3 text-[#1D6FEB] shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
