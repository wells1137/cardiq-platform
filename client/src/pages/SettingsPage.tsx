import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Clock3, DatabaseZap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function SettingsPage() {
  const utils = trpc.useUtils();
  const scheduleQuery = trpc.schedule.get.useQuery();
  const signalSettingsQuery = trpc.signalSettings.get.useQuery();
  const marketStatusQuery = trpc.marketData.status.useQuery();
  const seedMutation = trpc.scanner.initSeedData.useMutation();

  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [threshold, setThreshold] = useState(70);
  const [onCourtWeight, setOnCourtWeight] = useState(42);
  const [offCourtWeight, setOffCourtWeight] = useState(18);
  const [marketWeight, setMarketWeight] = useState(40);

  useEffect(() => {
    if (!scheduleQuery.data) return;
    setEnabled(scheduleQuery.data.enabled);
    setHour(scheduleQuery.data.hour);
    setMinute(scheduleQuery.data.minute);
    setThreshold(Math.round(scheduleQuery.data.dealScoreThreshold ?? 70));
  }, [scheduleQuery.data]);

  useEffect(() => {
    if (!signalSettingsQuery.data) return;
    setOnCourtWeight(Math.round(signalSettingsQuery.data.weights.onCourt));
    setOffCourtWeight(Math.round(signalSettingsQuery.data.weights.offCourt));
    setMarketWeight(Math.round(signalSettingsQuery.data.weights.market));
  }, [signalSettingsQuery.data]);

  const saveMutation = trpc.schedule.upsert.useMutation({
    onSuccess: async () => { await utils.schedule.get.invalidate(); toast.success("扫描设置已保存"); },
  });
  const toggleMutation = trpc.schedule.toggle.useMutation({
    onSuccess: async () => { await utils.schedule.get.invalidate(); toast.success("自动扫描状态已更新"); },
  });
  const saveSignalSettingsMutation = trpc.signalSettings.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.signalSettings.get.invalidate(), utils.cards.getTrendBoard.invalidate(), utils.cards.getTrendMovers.invalidate(), utils.cards.getDailyTrendSummary.invalidate(), utils.scanner.getTrendBoard.invalidate(), utils.notifications.get.invalidate()]);
      toast.success("AI 信号权重已更新");
    },
  });
  const resetSignalSettingsMutation = trpc.signalSettings.reset.useMutation({
    onSuccess: async (data) => {
      setOnCourtWeight(Math.round(data.weights.onCourt));
      setOffCourtWeight(Math.round(data.weights.offCourt));
      setMarketWeight(Math.round(data.weights.market));
      await Promise.all([utils.signalSettings.get.invalidate(), utils.cards.getTrendBoard.invalidate(), utils.cards.getTrendMovers.invalidate(), utils.cards.getDailyTrendSummary.invalidate(), utils.scanner.getTrendBoard.invalidate()]);
      toast.success("AI 权重已恢复默认");
    },
  });

  const normalizedPreview = useMemo(() => {
    const total = onCourtWeight + offCourtWeight + marketWeight;
    if (total <= 0) return { onCourt: 42, offCourt: 18, market: 40 };
    return {
      onCourt: Number(((onCourtWeight / total) * 100).toFixed(1)),
      offCourt: Number(((offCourtWeight / total) * 100).toFixed(1)),
      market: Number(((marketWeight / total) * 100).toFixed(1)),
    };
  }, [onCourtWeight, offCourtWeight, marketWeight]);

  const inputClass = "w-full rounded-xl border border-[#D0DCE8] bg-white px-3 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:ring-2 focus:ring-[#1D6FEB]/20 transition-all";
  const statusRowClass = "flex items-center justify-between rounded-xl bg-[#F8F9FA] border border-[#D0DCE8] px-4 py-2.5";

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* 页面标题 */}
        <div className="pb-5 border-b border-[#D0DCE8]">
          <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">平台设置</h1>
          <p className="mt-1 text-sm text-[#6B7FA3]">配置自动扫描策略、AI 趋势权重与开发数据</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* 左列 */}
          <div className="space-y-4">
            {/* 自动扫描策略 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628] mb-4">
                <Clock3 className="h-4 w-4 text-[#1D6FEB]" /> 自动扫描策略
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[#0A1628]">小时</span>
                  <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} className={inputClass} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[#0A1628]">分钟</span>
                  <input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className={inputClass} />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0A1628]">机会评分阈值</span>
                    <span className="text-xs text-[#6B7FA3]">{threshold} / 100</span>
                  </div>
                  <input type="range" min={0} max={100} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-[#1D6FEB]" />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => saveMutation.mutate({ enabled, hour, minute, dealScoreThreshold: threshold, timezone: "Asia/Shanghai" })} disabled={saveMutation.isPending} className="rounded-xl bg-[#1D6FEB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50">保存扫描设置</button>
                <button onClick={() => toggleMutation.mutate({ enabled: !enabled })} disabled={toggleMutation.isPending} className="rounded-xl border border-[#D0DCE8] bg-white px-4 py-2 text-sm font-medium text-[#0A1628] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50">{enabled ? "关闭自动扫描" : "启用自动扫描"}</button>
              </div>
            </div>

            {/* AI 信号权重 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628] mb-1.5">
                <BrainCircuit className="h-4 w-4 text-[#1D6FEB]" /> AI 信号权重
              </div>
              <p className="text-xs text-[#6B7FA3] mb-4 leading-relaxed">调整赛场、场外与市场信号在综合分中的占比，影响趋势判断、涨跌榜排序和日报摘要。</p>
              <div className="space-y-4">
                <WeightSlider label="赛场信号" value={onCourtWeight} onChange={setOnCourtWeight} preview={normalizedPreview.onCourt} />
                <WeightSlider label="场外信号" value={offCourtWeight} onChange={setOffCourtWeight} preview={normalizedPreview.offCourt} />
                <WeightSlider label="市场信号" value={marketWeight} onChange={setMarketWeight} preview={normalizedPreview.market} />
              </div>
              <div className="mt-4 rounded-xl bg-[#F5F8FF] border border-[#D0DCE8] px-4 py-3 text-xs text-[#6B7FA3]">
                {signalSettingsQuery.data?.summary || `当前 AI 分析权重：赛场 ${normalizedPreview.onCourt}% / 场外 ${normalizedPreview.offCourt}% / 市场 ${normalizedPreview.market}%`}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => saveSignalSettingsMutation.mutate({ onCourt: onCourtWeight, offCourt: offCourtWeight, market: marketWeight })} disabled={saveSignalSettingsMutation.isPending} className="rounded-xl bg-[#1D6FEB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50">保存 AI 权重</button>
                <button onClick={() => resetSignalSettingsMutation.mutate()} disabled={resetSignalSettingsMutation.isPending} className="rounded-xl border border-[#D0DCE8] bg-white px-4 py-2 text-sm font-medium text-[#0A1628] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50">恢复默认权重</button>
              </div>
            </div>
          </div>

          {/* 右列 */}
          <div className="space-y-4">
            {/* 当前状态 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628] mb-4">
                <RefreshCw className="h-4 w-4 text-[#1D6FEB]" /> 当前状态
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: "自动扫描", value: scheduleQuery.data?.enabled ? "已开启" : "未开启" },
                  { label: "时区", value: scheduleQuery.data?.timezone ?? "Asia/Shanghai" },
                  { label: "下次执行", value: scheduleQuery.data?.nextRunAt ? new Date(scheduleQuery.data.nextRunAt).toLocaleString("zh-CN") : "待设置" },
                  { label: "AI 主权重", value: normalizedPreview.onCourt >= normalizedPreview.market && normalizedPreview.onCourt >= normalizedPreview.offCourt ? "赛场" : normalizedPreview.market >= normalizedPreview.offCourt ? "市场" : "场外" },
                ].map((item) => (
                  <div key={item.label} className={statusRowClass}>
                    <span className="text-xs text-[#6B7FA3]">{item.label}</span>
                    <span className="text-xs font-semibold text-[#0A1628]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 外部行情连接 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628] mb-4">
                <DatabaseZap className="h-4 w-4 text-[#1D6FEB]" /> 外部行情连接
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: "模式", value: marketStatusQuery.data?.mode ?? "mock" },
                  { label: "提供方", value: marketStatusQuery.data?.providerLabel ?? "Mock History" },
                  { label: "已配来源", value: marketStatusQuery.data?.configuredSources?.join(", ") || "mock" },
                ].map((item) => (
                  <div key={item.label} className={statusRowClass}>
                    <span className="text-xs text-[#6B7FA3]">{item.label}</span>
                    <span className="text-xs font-semibold text-[#0A1628]">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#6B7FA3] leading-relaxed">{marketStatusQuery.data?.note ?? "可配置 MARKET_DATA_MODE、MARKET_DATA_ENDPOINT、APIFY_TOKEN 等环境变量。"}</p>
              {(marketStatusQuery.data?.supportedSources?.length || 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {marketStatusQuery.data?.supportedSources.map((item: string) => (
                    <span key={item} className="rounded-full border border-[#D0DCE8] bg-[#F8F9FA] px-2.5 py-0.5 text-[10px] font-semibold text-[#0A1628]">{item}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 开发数据 */}
            <div className="rounded-xl border border-[#D0DCE8] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628] mb-1.5">
                <DatabaseZap className="h-4 w-4 text-[#1D6FEB]" /> 开发数据
              </div>
              <p className="text-xs text-[#6B7FA3] mb-4 leading-relaxed">在本地开发环境中重新初始化球员和球星卡演示数据，便于校验前台页面与路由流程。</p>
              <button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="rounded-xl border border-[#D0DCE8] bg-white px-4 py-2 text-sm font-medium text-[#0A1628] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50">
                {seedMutation.isPending ? "初始化中..." : "初始化种子数据"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightSlider({ label, value, onChange, preview }: { label: string; value: number; onChange: (value: number) => void; preview: number }) {
  return (
    <label className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#0A1628]">{label}</span>
        <span className="text-[10px] text-[#6B7FA3]">输入 {value} · 生效 {preview}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#1D6FEB]" />
    </label>
  );
}
