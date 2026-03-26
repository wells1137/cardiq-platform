import { useMemo, useState } from "react";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const sports = ["ALL", "NBA", "NFL", "MLB", "NHL", "EPL"] as const;

export function ReportsPage() {
  const utils = trpc.useUtils();
  const [sport, setSport] = useState<(typeof sports)[number]>("ALL");
  const [focus, setFocus] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const reportsQuery = trpc.reports.getAll.useQuery();
  const selectedReportQuery = trpc.reports.getById.useQuery(
    { id: selectedReportId ?? 0 },
    { enabled: selectedReportId !== null }
  );
  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: async (data) => {
      await utils.reports.getAll.invalidate();
      setSelectedReportId(data.reportId || null);
    },
  });

  const reports = reportsQuery.data ?? [];
  const selectedReport = useMemo(() => {
    if (selectedReportQuery.data) return selectedReportQuery.data;
    if (!selectedReportId && reports.length > 0) return reports[0];
    return reports.find((report: any) => report.id === selectedReportId) ?? null;
  }, [reports, selectedReportId, selectedReportQuery.data]);

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[320px_1fr]">

        {/* 左侧：生成面板 + 历史列表 */}
        <div className="space-y-4">
          {/* 标题 */}
          <div className="pb-4 border-b border-[#D0DCE8]">
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">AI 投资报告</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">基于当前价值机会与球员表现，一键生成中文研究报告</p>
          </div>

          {/* 生成表单 */}
          <div className="rounded-xl border border-[#D0DCE8] bg-white p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#0A1628]">运动项目</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value as (typeof sports)[number])}
                className="mt-1.5 w-full rounded-xl border border-[#D0DCE8] bg-white px-3 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:ring-2 focus:ring-[#1D6FEB]/20 transition-all"
              >
                {sports.map((item) => (
                  <option key={item} value={item}>{item === "ALL" ? "全部项目" : item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0A1628]">关注点</label>
              <textarea
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                rows={4}
                placeholder="例如：关注东契奇高端卡、世界杯相关足球卡、PSA 10 流动性"
                className="mt-1.5 w-full rounded-xl border border-[#D0DCE8] bg-white px-3 py-2.5 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:ring-2 focus:ring-[#1D6FEB]/20 transition-all resize-none"
              />
            </div>
            <button
              onClick={() => generateMutation.mutate({ sport, focus })}
              disabled={generateMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D6FEB] py-2.5 text-sm font-semibold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-60"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成新报告
            </button>
          </div>

          {/* 历史报告列表 */}
          <div className="rounded-xl border border-[#D0DCE8] bg-white p-4">
            <div className="text-xs font-semibold text-[#0A1628] mb-3">历史报告</div>
            <div className="space-y-2">
              {reports.map((report: any) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${selectedReport?.id === report.id ? "border-[#1D6FEB]/40 bg-[#F5F8FF]" : "border-[#D0DCE8] hover:bg-[#F8F9FA]"}`}
                >
                  <div className="text-sm font-semibold text-[#0A1628] line-clamp-1">{report.title}</div>
                  <div className="mt-0.5 text-[10px] text-[#6B7FA3]">{report.sport || "多运动"}</div>
                </button>
              ))}
              {reports.length === 0 && (
                <p className="text-xs text-[#A8BDD4] py-2">暂无历史报告，先生成第一份。</p>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：报告内容 */}
        <div className="rounded-xl border border-[#D0DCE8] bg-white p-6 min-h-[600px]">
          {generateMutation.data?.content && !selectedReport ? (
            <article className="prose prose-sm max-w-none text-[#0A1628] whitespace-pre-wrap leading-7">
              {generateMutation.data.content}
            </article>
          ) : selectedReport ? (
            <>
              <div className="pb-4 border-b border-[#D0DCE8]">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#1D6FEB] uppercase tracking-wider mb-2">
                  <FileText className="h-3.5 w-3.5" /> 已生成报告
                </div>
                <h2 className="text-xl font-bold text-[#0A1628]">{selectedReport.title}</h2>
                <p className="mt-1 text-xs text-[#6B7FA3]">项目：{selectedReport.sport || "多运动"}</p>
              </div>
              <article className="mt-5 text-sm leading-7 text-[#0A1628] whitespace-pre-wrap">
                {selectedReport.content}
              </article>
            </>
          ) : (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
              <div className="rounded-2xl bg-[#EEF4FF] p-5 mb-4">
                <Sparkles className="h-10 w-10 text-[#1D6FEB]" />
              </div>
              <h2 className="text-lg font-bold text-[#0A1628]">开始生成第一份 AI 报告</h2>
              <p className="mt-2 max-w-sm text-sm text-[#6B7FA3] leading-relaxed">
                选择运动项目和关注点后，系统会基于现有的机会卡与球员表现生成可读性更强的研究摘要。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
