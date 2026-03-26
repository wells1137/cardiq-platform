import { useState, useMemo } from "react";
import { BriefcaseBusiness, Pencil, Plus, Trash2, TrendingDown, TrendingUp, DollarSign, BarChart2, Target } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function PortfolioPage() {
  const utils = trpc.useUtils();
  const cardsQuery = trpc.cards.getAll.useQuery({ limit: 50 });
  const portfolioQuery = trpc.portfolio.get.useQuery();

  const [cardId, setCardId] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [averageCost, setAverageCost] = useState(100);
  const [targetPrice, setTargetPrice] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ quantity: "", averageCost: "", targetPrice: "", notes: "" });

  const addMutation = trpc.portfolio.add.useMutation({
    onSuccess: async () => {
      await utils.portfolio.get.invalidate();
      setNotes("");
      setTargetPrice("");
      toast.success("已加入资产组合");
    },
  });
  const updateMutation = trpc.portfolio.update.useMutation({
    onSuccess: async () => {
      await utils.portfolio.get.invalidate();
      setEditingId(null);
      toast.success("持仓已更新");
    },
  });
  const removeMutation = trpc.portfolio.remove.useMutation({
    onSuccess: async () => {
      await utils.portfolio.get.invalidate();
      toast.success("持仓已移除");
    },
  });

  const cards = cardsQuery.data ?? [];
  const positions = portfolioQuery.data?.positions ?? [];
  const summary = portfolioQuery.data?.summary;
  const selectedCard = useMemo(() => cards.find((item: any) => item.id === Number(cardId)), [cards, cardId]);

  const startEdit = (position: any) => {
    setEditingId(position.id);
    setEditForm({
      quantity: String(position.quantity ?? ""),
      averageCost: String(position.averageCost ?? ""),
      targetPrice: position.targetPrice ? String(position.targetPrice) : "",
      notes: position.notes || "",
    });
  };

  const inputClass = "mt-1.5 w-full rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:bg-white focus:ring-2 focus:ring-[#1D6FEB]/15 transition-all";
  const selectClass = "mt-1.5 w-full appearance-none rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7FA3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center] px-4 py-2.5 pr-10 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:bg-white focus:ring-2 focus:ring-[#1D6FEB]/15 transition-all cursor-pointer";
  const labelClass = "block text-xs font-bold text-[#6B7FA3] uppercase tracking-wider";

  const pnlValue = Number(summary?.unrealizedPnL ?? 0);
  const pnlIsUp = pnlValue >= 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">Portfolio 资产组合</h1>
          <p className="mt-1 text-sm text-[#6B7FA3]">记录持仓、成本、目标价，自动计算组合净值与浮盈亏</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">

        {/* 汇总数字 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <SummaryCard
            label="持仓数"
            value={summary?.positions ?? 0}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            iconBg="bg-blue-50"
            iconColor="text-[#1D6FEB]"
            unit="张"
          />
          <SummaryCard
            label="总成本"
            value={`$${Number(summary?.costBasis ?? 0).toFixed(0)}`}
            icon={<DollarSign className="h-4 w-4" />}
            iconBg="bg-slate-50"
            iconColor="text-[#4A5568]"
          />
          <SummaryCard
            label="当前市值"
            value={`$${Number(summary?.marketValue ?? 0).toFixed(0)}`}
            icon={<BarChart2 className="h-4 w-4" />}
            iconBg="bg-blue-50"
            iconColor="text-[#1D6FEB]"
          />
          <SummaryCard
            label="浮盈亏"
            value={`${pnlIsUp ? "+" : ""}$${pnlValue.toFixed(0)}`}
            icon={pnlIsUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            iconBg={pnlIsUp ? "bg-green-50" : "bg-red-50"}
            iconColor={pnlIsUp ? "text-[#16a34a]" : "text-[#dc2626]"}
            accent={pnlIsUp ? "up" : "down"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">

          {/* 添加持仓表单 */}
          <div className="rounded-2xl border border-[#E2EAF4] bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-[#0A1628] mb-5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Plus className="h-4 w-4 text-[#1D6FEB]" />
              </div>
              添加持仓
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>选择卡片</span>
                <select
                  value={cardId}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setCardId(next);
                    const card = cards.find((item: any) => item.id === next);
                    if (card?.currentPrice) setAverageCost(Number(card.currentPrice));
                  }}
                  className={selectClass}
                >
                  <option value={0}>请选择卡片</option>
                  {cards.map((card: any) => (
                    <option key={card.id} value={card.id}>{card.playerName} · {card.year} {card.brand}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>数量</span>
                  <input type="number" min={0.1} step={0.1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>平均成本 ($)</span>
                  <input type="number" min={0.01} step={0.01} value={averageCost} onChange={(e) => setAverageCost(Number(e.target.value))} className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>目标价 ($)</span>
                <input type="number" min={0.01} step={0.01} value={targetPrice} onChange={(e) => setTargetPrice(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
              </label>
              <label className="block">
                <span className={labelClass}>备注</span>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="建仓逻辑、退出计划或事件驱动..." />
              </label>

              {selectedCard && (
                <div className="rounded-xl bg-[#F0F5FF] border border-[#D8E8FF] p-3.5 text-xs text-[#6B7FA3]">
                  <div className="flex items-center justify-between">
                    <span>当前估值</span>
                    <span className="font-bold text-[#0A1628] text-sm">${Number(selectedCard.currentPrice ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span>7日变化</span>
                    <span className={`font-bold text-sm ${Number(selectedCard.priceChange7d ?? 0) >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                      {Number(selectedCard.priceChange7d ?? 0) >= 0 ? "+" : ""}{Number(selectedCard.priceChange7d ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => addMutation.mutate({ cardId: Number(cardId), quantity, averageCost, targetPrice: targetPrice === "" ? undefined : Number(targetPrice), notes })}
                disabled={addMutation.isPending || !cardId}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D6FEB] py-3 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
              >
                <Plus className="h-4 w-4" /> 添加到组合
              </button>
            </div>
          </div>

          {/* 持仓列表 */}
          <div className="space-y-3">
            {positions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D0DCE8] bg-white py-24 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1F5] mb-4">
                  <BriefcaseBusiness className="h-7 w-7 text-[#A8BDD4]" />
                </div>
                <p className="text-sm font-semibold text-[#4A5568]">还没有持仓</p>
                <p className="text-xs text-[#A8BDD4] mt-1.5">从左侧选择卡片加入你的组合</p>
              </div>
            ) : (
              positions.map((position: any) => {
                const currentPrice = Number(position.card?.currentPrice ?? 0);
                const qty = Number(position.quantity ?? 0);
                const marketValue = currentPrice * qty;
                const costBasis = Number(position.averageCost ?? 0) * qty;
                const pnl = marketValue - costBasis;
                const isUp = pnl >= 0;
                const editing = editingId === position.id;

                return (
                  <div key={position.id} className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF]">
                          <span className="text-xs font-bold text-[#1D6FEB]">{(position.card?.playerName || "?")[0]}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#1D6FEB] bg-[#EEF4FF] rounded-full px-2 py-0.5 uppercase">{position.card?.sport || "Card"}</span>
                          <h3 className="mt-1.5 text-base font-bold text-[#0A1628]">{position.card?.playerName || `Card #${position.cardId}`}</h3>
                          <p className="text-xs text-[#6B7FA3] mt-0.5">{position.card ? `${position.card.year} ${position.card.brand} ${position.card.set}` : "卡片信息加载中"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => (editing ? setEditingId(null) : startEdit(position))} className="rounded-xl border border-[#E2EAF4] p-2 text-[#6B7FA3] hover:text-[#1D6FEB] hover:border-[#1D6FEB] hover:bg-[#F0F5FF] transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeMutation.mutate({ id: position.id })} className="rounded-xl border border-[#E2EAF4] p-2 text-[#6B7FA3] hover:text-[#dc2626] hover:border-[#dc2626] hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {editing ? (
                      <div className="mt-4 space-y-3 pt-4 border-t border-[#E2EAF4]">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <input value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))} className={inputClass} placeholder="数量" />
                          <input value={editForm.averageCost} onChange={(e) => setEditForm((p) => ({ ...p, averageCost: e.target.value }))} className={inputClass} placeholder="平均成本" />
                          <input value={editForm.targetPrice} onChange={(e) => setEditForm((p) => ({ ...p, targetPrice: e.target.value }))} className={inputClass} placeholder="目标价" />
                        </div>
                        <textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} className={inputClass} placeholder="更新持仓备注" />
                        <button
                          onClick={() => updateMutation.mutate({ id: position.id, quantity: Number(editForm.quantity), averageCost: Number(editForm.averageCost), targetPrice: editForm.targetPrice ? Number(editForm.targetPrice) : undefined, notes: editForm.notes })}
                          className="w-full rounded-xl bg-[#1D6FEB] py-2.5 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors shadow-sm shadow-blue-200"
                        >
                          保存持仓
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 pt-4 border-t border-[#E2EAF4] grid gap-3 grid-cols-2 sm:grid-cols-4">
                          <MiniStat label="数量" value={qty.toString()} />
                          <MiniStat label="总成本" value={`$${costBasis.toFixed(0)}`} />
                          <MiniStat label="当前市值" value={`$${marketValue.toFixed(0)}`} />
                          <MiniStat label="浮盈亏" value={`${isUp ? "+" : ""}$${pnl.toFixed(0)}`} accent={isUp ? "up" : "down"} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {position.targetPrice && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] border border-[#D8E8FF] px-3 py-1 text-xs font-semibold text-[#1D6FEB]">
                              <Target className="h-3 w-3" /> 目标价 ${Number(position.targetPrice).toFixed(0)}
                            </span>
                          )}
                          {position.notes && (
                            <span className="inline-flex items-center rounded-full bg-[#F8FAFC] border border-[#E2EAF4] px-3 py-1 text-xs text-[#6B7FA3]">
                              {position.notes.length > 40 ? position.notes.slice(0, 40) + "..." : position.notes}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, iconBg, iconColor, accent = "default", unit }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accent?: "default" | "up" | "down";
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#6B7FA3] uppercase tracking-wide">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold font-data tracking-tight ${accent === "up" ? "text-[#16a34a]" : accent === "down" ? "text-[#dc2626]" : "text-[#0A1628]"}`}>
        {value}
        {unit && <span className="text-sm font-medium text-[#6B7FA3] ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = "default" }: { label: string; value: string; accent?: "default" | "up" | "down" }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2EAF4] p-3">
      <div className="text-[10px] font-semibold text-[#6B7FA3] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-bold font-data ${accent === "up" ? "text-[#16a34a]" : accent === "down" ? "text-[#dc2626]" : "text-[#0A1628]"}`}>{value}</div>
    </div>
  );
}
