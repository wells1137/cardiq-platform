import { Link, useLocation } from "wouter";
import { Bell, Bookmark, Box, Radar, Search, Settings, TrendingUp, Users, FileText, BriefcaseBusiness, LineChart, GitBranch, BrainCircuit, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardAdvisorDialog } from "./CardAdvisorDialog";

interface SidebarConfig {
  icon: React.ElementType;
  label: string;
  href: string;
  match: string[];
  group?: string;
}

const mainNavItems: SidebarConfig[] = [
  { icon: TrendingUp, label: "趋势概览", href: "/", match: ["/"], group: "核心" },
  { icon: Search, label: "查价 / 市场", href: "/market", match: ["/market", "/card/"], group: "核心" },
  { icon: BrainCircuit, label: "交易信号", href: "/signals", match: ["/signals"], group: "核心" },
  { icon: Users, label: "球员数据", href: "/players", match: ["/players"], group: "分析" },
  { icon: Box, label: "盒子情报", href: "/boxes", match: ["/boxes"], group: "分析" },
  { icon: LineChart, label: "趋势历史", href: "/trends", match: ["/trends"], group: "分析" },
  { icon: GitBranch, label: "关系图谱", href: "/graph", match: ["/graph"], group: "分析" },
  { icon: Bookmark, label: "关注列表", href: "/watchlist", match: ["/watchlist"], group: "我的" },
  { icon: BriefcaseBusiness, label: "资产组合", href: "/portfolio", match: ["/portfolio"], group: "我的" },
  { icon: FileText, label: "AI 报告", href: "/reports", match: ["/reports"], group: "我的" },
  { icon: Bell, label: "通知中心", href: "/notifications", match: ["/notifications"], group: "我的" },
  { icon: Globe2, label: "多平台行情", href: "/multiplatform", match: ["/multiplatform"], group: "工具" },
  { icon: Radar, label: "拍照识卡", href: "/scanner", match: ["/scanner"], group: "工具" },
  { icon: Settings, label: "平台设置", href: "/settings", match: ["/settings"], group: "工具" },
];

const groups = ["核心", "分析", "我的", "工具"];

function isActivePath(location: string, item: SidebarConfig) {
  return item.match.some((path) => (path === "/" ? location === "/" : location === path || location.startsWith(path)));
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F7FB] font-sans">
      {/* 侧边栏 */}
      <aside className="z-10 flex h-full w-[220px] shrink-0 flex-col border-r border-[#E2EAF4] bg-white">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-[#E2EAF4] px-5">
          <Link href="/">
            <div className="flex cursor-pointer items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D6FEB] shadow-sm shadow-blue-200">
                <span className="text-xs font-black text-white tracking-tight">CIQ</span>
              </div>
              <div>
                <div className="text-sm font-bold text-[#0A1628] tracking-tight">CardIQ</div>
                <div className="text-[10px] text-[#A8BDD4] font-medium">球星卡数据平台</div>
              </div>
            </div>
          </Link>
        </div>

        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {groups.map((group) => {
            const items = mainNavItems.filter((item) => item.group === group);
            return (
              <div key={group}>
                <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C5D3E0]">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActivePath(location, item);
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "group flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                            active
                              ? "bg-[#EEF4FF] text-[#1D6FEB] font-semibold"
                              : "text-[#5A6A7E] hover:bg-[#F5F8FF] hover:text-[#1D6FEB]"
                          )}
                        >
                          <div className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
                            active
                              ? "bg-[#1D6FEB] shadow-sm shadow-blue-200"
                              : "bg-[#F4F7FB] group-hover:bg-[#EEF4FF]"
                          )}>
                            <Icon className={cn("h-3.5 w-3.5", active ? "text-white" : "text-[#A8BDD4] group-hover:text-[#1D6FEB]")} />
                          </div>
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* 底部状态卡 */}
        <div className="border-t border-[#E2EAF4] p-3 space-y-2">
          <div className="rounded-xl bg-gradient-to-br from-[#EEF4FF] to-[#E8F0FE] p-3 border border-[#D8E8FF]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider">数据实时</span>
              </div>
              <span className="text-[10px] text-[#A8BDD4] font-medium">v1.0</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[{v:"1.2M",l:"卡牌"},{v:"98%",l:"准确率"},{v:"<1s",l:"延迟"}].map(s=>(
                <div key={s.l} className="text-center">
                  <div className="text-[11px] font-bold text-[#1D6FEB]">{s.v}</div>
                  <div className="text-[9px] text-[#A8BDD4]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="relative flex-1 overflow-y-auto bg-[#F4F7FB]">
        {children}
        <CardAdvisorDialog />
      </main>
    </div>
  );
}
