import { Bell, CheckCheck, CalendarRange, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function NotificationsPage() {
  const utils = trpc.useUtils();
  const notificationsQuery = trpc.notifications.get.useQuery({ limit: 50 });
  const unreadCountQuery = trpc.notifications.unreadCount.useQuery();
  const dailySummaryQuery = trpc.cards.getDailyTrendSummary.useQuery({ limit: 24, window: "24H" });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.notifications.get.invalidate(), utils.notifications.unreadCount.invalidate()]);
    },
  });
  const markAllMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.notifications.get.invalidate(), utils.notifications.unreadCount.invalidate()]);
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;
  const typeCount = new Set(notifications.map((item: any) => item.type).filter(Boolean)).size;

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* 页面标题 */}
        <div className="flex items-start justify-between pb-5 border-b border-[#D0DCE8]">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">通知中心</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">聚合扫描结果、报告生成结果和重点卡片提醒</p>
          </div>
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || unreadCount === 0}
            className="flex items-center gap-2 rounded-xl border border-[#D0DCE8] bg-white px-4 py-2.5 text-sm font-medium text-[#0A1628] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4 text-[#6B7FA3]" /> 全部设为已读
          </button>
        </div>

        {/* 今日趋势摘要 */}
        <div className="rounded-xl border border-[#D0DCE8] bg-[#F5F8FF] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D6FEB] mb-2">
                <CalendarRange className="h-3.5 w-3.5" /> 今日趋势摘要
              </div>
              <p className="text-sm font-medium text-[#0A1628] leading-relaxed">
                {dailySummaryQuery.data?.summary || "正在生成趋势日报..."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 shrink-0">
              {[
                { label: "反转数量", value: dailySummaryQuery.data?.reversalCount ?? 0, icon: <RefreshCw className="h-3.5 w-3.5 text-[#1D6FEB]" />, color: "text-[#0A1628]" },
                { label: "最强上升", value: dailySummaryQuery.data?.topRiser?.playerName || "暂无", icon: <TrendingUp className="h-3.5 w-3.5 text-[#16a34a]" />, color: "text-[#16a34a]" },
                { label: "最大回落", value: dailySummaryQuery.data?.topFaller?.playerName || "暂无", icon: <TrendingDown className="h-3.5 w-3.5 text-[#dc2626]" />, color: "text-[#dc2626]" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-white border border-[#D0DCE8] px-3 py-2.5">
                  <div className="text-[10px] text-[#6B7FA3] mb-1">{item.label}</div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${item.color}`}>{item.icon} {item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 汇总数字 */}
        <div className="grid gap-3 grid-cols-3">
          {[
            { label: "总通知数", value: notifications.length, color: "text-[#0A1628]" },
            { label: "未读通知", value: unreadCount, color: "text-[#1D6FEB]" },
            { label: "覆盖类型", value: typeCount, color: "text-[#0A1628]" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#D0DCE8] bg-white p-4">
              <div className="text-xs font-medium text-[#6B7FA3]">{item.label}</div>
              <div className={`mt-1.5 text-2xl font-bold font-data ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* 通知列表 */}
        <div className="space-y-2">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-4 transition-colors ${notification.isRead ? "border-[#D0DCE8] bg-white" : "border-[#1D6FEB]/30 bg-[#F5F8FF]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-lg p-2 shrink-0 ${notification.isRead ? "bg-[#F8F9FA] text-[#6B7FA3]" : "bg-[#EEF4FF] text-[#1D6FEB]"}`}>
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#0A1628]">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1D6FEB] shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#6B7FA3] leading-relaxed">{notification.content}</p>
                    <div className="mt-2 text-[10px] text-[#A8BDD4]">类型：{notification.type}</div>
                  </div>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate({ id: notification.id })}
                    disabled={markReadMutation.isPending}
                    className="shrink-0 rounded-lg border border-[#D0DCE8] bg-white px-3 py-1.5 text-xs font-medium text-[#0A1628] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
                  >
                    标记已读
                  </button>
                )}
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#D0DCE8] bg-white py-16 text-center">
              <Bell className="mx-auto h-10 w-10 text-[#D0DCE8] mb-3" />
              <p className="text-sm text-[#6B7FA3]">暂无通知</p>
              <p className="text-xs text-[#A8BDD4] mt-1">跑一次扫描或生成报告后，这里会出现更新</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
