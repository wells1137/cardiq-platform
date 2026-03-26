import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, Trophy, Activity, ArrowRight, Users, Flame } from "lucide-react";
import { trpc } from "@/lib/trpc";

const sports = ["ALL", "NBA", "NFL", "MLB", "NHL", "EPL"] as const;

const sportColors: Record<string, { bg: string; text: string; dot: string }> = {
  NBA: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  NFL: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  MLB: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  NHL: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  EPL: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

function getScoreLabel(score: number) {
  if (score >= 90) return { label: "超级热门", color: "text-[#1D6FEB]", bg: "bg-[#EEF4FF]" };
  if (score >= 80) return { label: "明星强势期", color: "text-[#0D5FD6]", bg: "bg-[#E8F0FE]" };
  if (score >= 70) return { label: "持续关注", color: "text-[#4A90D9]", bg: "bg-[#F0F7FF]" };
  return { label: "观察中", color: "text-[#6B7FA3]", bg: "bg-slate-50" };
}

// 运动项目颜色映射（用于fallback头像背景色）
const SPORT_AVATAR_COLORS: Record<string, string> = {
  NBA: '1D6FEB',
  NFL: '16A34A',
  MLB: '0369A1',
  NHL: '0EA5E9',
  EPL: '7C3AED',
};

// 获取球员头像：优先使用服务端返回的 imageUrl（已含 ESPN CDN 地址）
function getPlayerAvatar(player: any): string {
  if (player.imageUrl && !player.imageUrl.includes('ui-avatars')) return player.imageUrl;
  // 通用 fallback：按运动项目使用对应品牌色生成字母头像
  const initials = (player.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const bg = SPORT_AVATAR_COLORS[player.sport] || '1D6FEB';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=ffffff&size=200&bold=true&font-size=0.38&rounded=false`;
}

export function Players() {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<(typeof sports)[number]>("ALL");

  const topPlayersQuery = trpc.players.getTop.useQuery({ sport, limit: 18 });
  const searchPlayersQuery = trpc.players.search.useQuery(
    { query, sport },
    { enabled: query.trim().length >= 2 }
  );

  const players = useMemo(() => {
    if (query.trim().length >= 2) return searchPlayersQuery.data ?? [];
    return topPlayersQuery.data ?? [];
  }, [query, searchPlayersQuery.data, topPlayersQuery.data]);

  const isLoading = query.trim().length >= 2 ? searchPlayersQuery.isLoading : topPlayersQuery.isLoading;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">球员数据库</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">追踪重点球员热度、表现评分与卡片研究入口</p>
          </div>
          <div className="rounded-2xl border border-[#E2EAF4] bg-[#F4F7FB] px-5 py-3 text-right">
            <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider">研究池</div>
            <div className="mt-0.5 text-2xl font-bold text-[#0A1628] font-data">{players.length}</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6 space-y-5">

        {/* 搜索与筛选 */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8BDD4]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索球员姓名，例如 Luka、Messi、Ohtani"
              className="w-full rounded-xl border border-[#E2EAF4] bg-white py-3 pl-10 pr-4 text-sm text-[#0A1628] outline-none focus:border-[#1D6FEB] focus:ring-2 focus:ring-[#1D6FEB]/15 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-1.5 bg-white border border-[#E2EAF4] rounded-xl p-1 shadow-sm">
            {sports.map((item) => (
              <button
                key={item}
                onClick={() => setSport(item)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sport === item
                    ? "bg-[#1D6FEB] text-white shadow-sm shadow-blue-200"
                    : "text-[#6B7FA3] hover:text-[#0A1628] hover:bg-[#F4F7FB]"
                }`}
              >
                {item === "ALL" ? "全部" : item}
              </button>
            ))}
          </div>
        </div>

        {/* 信息卡片 */}
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: <Trophy className="h-4 w-4" />, label: "热门项目", value: sport === "ALL" ? "多运动" : sport, desc: "支持跨 NBA、NFL、MLB、NHL、EPL 的球员搜索与研究", iconBg: "bg-amber-50", iconColor: "text-amber-500" },
            { icon: <Activity className="h-4 w-4" />, label: "数据维度", value: "表现评分", desc: "结合近期状态、热度与市场表现，为卡片研究提供切入点", iconBg: "bg-blue-50", iconColor: "text-[#1D6FEB]" },
            { icon: <Users className="h-4 w-4" />, label: "搜索提示", value: "输入 2+ 字符", desc: "不输入关键词时展示默认热门球员榜，方便直接开始研究", iconBg: "bg-green-50", iconColor: "text-green-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#E2EAF4] bg-white p-4 shadow-sm flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
                {item.icon}
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-0.5">{item.label}</div>
                <div className="text-sm font-bold text-[#0A1628]">{item.value}</div>
                <p className="mt-0.5 text-xs text-[#6B7FA3] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 球员网格 */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#EEF1F5]" />
          ))}

          {!isLoading && players.map((player: any) => {
            const sportStyle = sportColors[player.sport] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
            const scoreInfo = getScoreLabel(player.performanceScore || 0);
            const score = Math.round(player.performanceScore || 0);

            return (
              <Link key={player.id} href={`/players/${player.id}`}>
                <div className="group cursor-pointer rounded-2xl border border-[#E2EAF4] bg-white p-5 hover:border-[#1D6FEB] hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* 球员头像 */}
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#D8E8FF] bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF]">
                        <img
                          src={getPlayerAvatar(player)}
                          alt={player.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const initials = (player.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                            const bg = SPORT_AVATAR_COLORS[player.sport] || '1D6FEB';
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=ffffff&size=200&bold=true&font-size=0.38&rounded=false`;
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${sportStyle.bg} ${sportStyle.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sportStyle.dot}`} />
                          {player.sport}
                        </span>
                        <h3 className="mt-1.5 text-base font-bold text-[#0A1628] truncate group-hover:text-[#1D6FEB] transition-colors">{player.name}</h3>
                        <p className="text-xs text-[#6B7FA3] truncate">{player.team || "待补充球队"} · {player.position || "待补充位置"}</p>
                      </div>
                    </div>
                    {/* 评分圆形指示 */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1D6FEB] bg-[#EEF4FF]">
                        <span className="text-base font-black text-[#1D6FEB] font-data">{score}</span>
                      </div>
                      <span className="mt-1 text-[9px] font-semibold text-[#6B7FA3]">评分</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                      {score >= 85 && <Flame className="h-3 w-3" />}
                      {scoreInfo.label}
                    </span>
                    {score >= 90 && (
                      <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[#1D6FEB] animate-pulse" />
                    )}
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#1D6FEB] opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情 <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {!isLoading && players.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#D0DCE8] bg-white py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1F5] mb-4">
              <Users className="h-7 w-7 text-[#A8BDD4]" />
            </div>
            <p className="text-sm font-semibold text-[#4A5568]">没有找到球员</p>
            <p className="text-xs text-[#A8BDD4] mt-1.5">换个关键词试试</p>
          </div>
        )}
      </div>
    </div>
  );
}
