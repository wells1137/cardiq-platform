import { useState } from "react";
import { Link } from "wouter";
import { Bookmark, BellRing, Pencil, Search, Trash2, TrendingUp, TrendingDown, Bell, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function WatchlistPage() {
  const utils = trpc.useUtils();
  const watchlistQuery = trpc.watchlist.get.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState({ alertPriceBelow: "", alertDealScoreAbove: "", notes: "" });

  const removeMutation = trpc.watchlist.remove.useMutation({
    onSuccess: async () => {
      await utils.watchlist.get.invalidate();
      toast.success("已移出关注列表");
    },
  });
  const updateMutation = trpc.watchlist.update.useMutation({
    onSuccess: async () => {
      await utils.watchlist.get.invalidate();
      setEditingId(null);
      toast.success("关注项已更新");
    },
  });

  const items = watchlistQuery.data ?? [];

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormState({
      alertPriceBelow: item.alertPriceBelow ? String(item.alertPriceBelow) : "",
      alertDealScoreAbove: item.alertDealScoreAbove ? String(item.alertDealScoreAbove) : "",
      notes: item.notes || "",
    });
  };

  const inputClass = "mt-1.5 w-full rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:bg-white focus:ring-2 focus:ring-[#1D6FEB]/15 transition-all";

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">关注列表</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">管理重点追踪的球员卡、提醒阈值和研究备注</p>
          </div>
          <Link href="/market">
            <button className="flex items-center gap-2 rounded-xl bg-[#1D6FEB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors shadow-sm shadow-blue-200">
              <Search className="h-4 w-4" /> 去市场添加
            </button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-6 space-y-5">

        {/* 汇总数字 */}
        <div className="grid gap-4 grid-cols-3">
          {[
            { label: "追踪项目", value: items.length, icon: <Bookmark className="h-4 w-4" />, iconBg: "bg-blue-50", iconColor: "text-[#1D6FEB]" },
            { label: "价格提醒", value: items.filter((item: any) => item.alertPriceBelow).length, icon: <Bell className="h-4 w-4" />, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
            { label: "评分提醒", value: items.filter((item: any) => item.alertDealScoreAbove).length, icon: <BellRing className="h-4 w-4" />, iconBg: "bg-green-50", iconColor: "text-green-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6B7FA3] uppercase tracking-wide">{item.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg} ${item.iconColor}`}>
                  {item.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0A1628] font-data">{item.value}</div>
            </div>
          ))}
        </div>

        {/* 列表内容 */}
        {watchlistQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-[#EEF1F5]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D0DCE8] bg-white py-24 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1F5] mb-4">
              <Bookmark className="h-7 w-7 text-[#A8BDD4]" />
            </div>
            <p className="text-sm font-semibold text-[#4A5568]">还没有关注卡片</p>
            <p className="text-xs text-[#A8BDD4] mt-1.5">先去市场页挑选重点卡片，再回到这里统一追踪</p>
            <Link href="/market">
              <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1D6FEB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors shadow-sm shadow-blue-200">
                <Search className="h-4 w-4" /> 去市场添加
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item: any) => {
              const card = item.card;
              const editing = editingId === item.id;
              const change = Number(card?.priceChange7d ?? 0);
              const isUp = change > 0;
              const isDown = change < 0;

              return (
                <div key={item.id} className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#1D6FEB]/40 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF] border border-[#D8E8FF]">
                        <span className="text-sm font-black text-[#1D6FEB]">{(card?.playerName || "?")[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#1D6FEB] bg-[#EEF4FF] rounded-full px-2 py-0.5 uppercase">{card?.sport || "Card"}</span>
                        <h3 className="mt-1.5 text-base font-bold text-[#0A1628] truncate">{card?.playerName || `球员 ${item.playerId ?? "未绑定"}`}</h3>
                        <p className="text-xs text-[#6B7FA3] truncate">{card ? `${card.year} ${card.brand} ${card.set}` : "仅追踪球员"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {card && (
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${isUp ? "bg-green-50 text-[#16a34a]" : isDown ? "bg-red-50 text-[#dc2626]" : "bg-slate-50 text-[#6B7FA3]"}`}>
                          {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : null}
                          {isUp ? "+" : ""}{change.toFixed(1)}%
                        </span>
                      )}
                      <button onClick={() => (editing ? setEditingId(null) : startEdit(item))} className="rounded-xl border border-[#E2EAF4] p-1.5 text-[#6B7FA3] hover:text-[#1D6FEB] hover:border-[#1D6FEB] hover:bg-[#F0F5FF] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeMutation.mutate({ id: item.id })} disabled={removeMutation.isPending} className="rounded-xl border border-[#E2EAF4] p-1.5 text-[#6B7FA3] hover:text-[#dc2626] hover:border-[#dc2626] hover:bg-red-50 transition-colors disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {editing ? (
                    <div className="mt-4 pt-4 border-t border-[#E2EAF4] space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider">价格阈值 ($)</span>
                          <input value={formState.alertPriceBelow} onChange={(e) => setFormState((p) => ({ ...p, alertPriceBelow: e.target.value }))} className={inputClass} placeholder="如 120" />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider">评分阈值</span>
                          <input value={formState.alertDealScoreAbove} onChange={(e) => setFormState((p) => ({ ...p, alertDealScoreAbove: e.target.value }))} className={inputClass} placeholder="如 80" />
                        </label>
                      </div>
                      <textarea rows={3} value={formState.notes} onChange={(e) => setFormState((p) => ({ ...p, notes: e.target.value }))} className={inputClass} placeholder="买入逻辑、目标价和退出条件..." />
                      <button
                        onClick={() => updateMutation.mutate({ id: item.id, alertPriceBelow: formState.alertPriceBelow ? Number(formState.alertPriceBelow) : undefined, alertDealScoreAbove: formState.alertDealScoreAbove ? Number(formState.alertDealScoreAbove) : undefined, notes: formState.notes })}
                        disabled={updateMutation.isPending}
                        className="w-full rounded-xl bg-[#1D6FEB] py-2.5 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
                      >
                        保存关注设置
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 pt-4 border-t border-[#E2EAF4] grid gap-2.5 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#F8FAFC] border border-[#E2EAF4] p-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-1.5">
                            <BellRing className="h-3 w-3" /> 价格阈值
                          </div>
                          <div className="text-sm font-bold text-[#0A1628]">
                            {item.alertPriceBelow ? `$${item.alertPriceBelow}` : <span className="text-[#A8BDD4] font-medium">未设置</span>}
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#F8FAFC] border border-[#E2EAF4] p-3">
                          <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-1.5">评分阈值</div>
                          <div className="text-sm font-bold text-[#0A1628]">
                            {item.alertDealScoreAbove ? `${item.alertDealScoreAbove} / 100` : <span className="text-[#A8BDD4] font-medium">未设置</span>}
                          </div>
                        </div>
                      </div>
                      {item.notes?.trim() && (
                        <p className="mt-3 text-xs text-[#6B7FA3] leading-relaxed line-clamp-2 italic">{item.notes}</p>
                      )}
                    </>
                  )}

                  {card && !editing && (
                    <Link href={`/card/${card.id}`}>
                      <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] py-2.5 text-xs font-bold text-[#0A1628] hover:bg-[#EEF4FF] hover:text-[#1D6FEB] hover:border-[#1D6FEB] transition-colors">
                        查看卡片行情 <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
