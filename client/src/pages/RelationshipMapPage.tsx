import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowRight, GitBranch, Sparkles, Star, TrendingDown, TrendingUp, Users } from "lucide-react";

type CardNode = {
  id: number;
  playerId?: number | null;
  playerName: string;
  brand: string;
  set: string;
  sport?: string | null;
  dealScore?: number | null;
  priceChange7d?: number | null;
  boxName?: string | null;
};

type PlayerGraph = {
  playerName: string;
  playerId?: number | null;
  cards: CardNode[];
  avgTrend: number;
  topBrand?: string;
  topSet?: string;
  topCard?: CardNode;
  brands: Array<{
    brand: string;
    count: number;
    avgTrend: number;
    topSet?: string;
    topCard?: CardNode;
    sets: Array<{
      set: string;
      count: number;
      avgTrend: number;
      topCard?: CardNode;
    }>;
  }>;
};

const sports = ["ALL", "NBA", "NFL", "MLB", "NHL", "EPL"];
const svgWidth = 1040;
const svgHeight = 520;
const columns = { box: 120, player: 360, brand: 620, set: 900 } as const;
const rowGap = 78;

export function RelationshipMapPage() {
  const cardsQuery = trpc.cards.getAll.useQuery({ limit: 150 });
  const [sport, setSport] = useState("ALL");
  const cards = (cardsQuery.data || []).map((card) => ({ ...card, boxName: null })) as CardNode[];

  const filteredCards = useMemo(
    () => cards.filter((card) => sport === "ALL" || card.sport === sport),
    [cards, sport],
  );

  const players = useMemo<PlayerGraph[]>(() => {
    const map = new Map<string, CardNode[]>();
    for (const card of filteredCards) {
      const key = card.playerName || "Unknown";
      const current = map.get(key) || [];
      current.push({
        ...card,
        brand: card.brand || "未标注品牌",
        set: card.set || "未标注系列",
        playerName: card.playerName || "Unknown",
      });
      map.set(key, current);
    }

    return Array.from(map.entries())
      .map(([playerName, items]) => {
        const brandMap = new Map<string, CardNode[]>();
        for (const card of items) {
          const current = brandMap.get(card.brand) || [];
          current.push(card);
          brandMap.set(card.brand, current);
        }

        const brands = Array.from(brandMap.entries())
          .map(([brand, brandCards]) => {
            const setMap = new Map<string, CardNode[]>();
            for (const card of brandCards) {
              const current = setMap.get(card.set) || [];
              current.push(card);
              setMap.set(card.set, current);
            }

            const sets = Array.from(setMap.entries())
              .map(([set, setCards]) => ({
                set,
                count: setCards.length,
                avgTrend: average(setCards.map((card) => Number(card.priceChange7d || 0))),
                topCard: [...setCards].sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0))[0],
              }))
              .sort((a, b) => b.count - a.count);

            return {
              brand,
              count: brandCards.length,
              avgTrend: average(brandCards.map((card) => Number(card.priceChange7d || 0))),
              topSet: sets[0]?.set,
              topCard: [...brandCards].sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0))[0],
              sets,
            };
          })
          .sort((a, b) => b.count - a.count);

        const topCard = [...items].sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0))[0];
        return {
          playerName,
          playerId: items[0]?.playerId,
          cards: items,
          avgTrend: average(items.map((card) => Number(card.priceChange7d || 0))),
          topBrand: brands[0]?.brand,
          topSet: brands[0]?.sets[0]?.set,
          topCard,
          brands,
        };
      })
      .sort((a, b) => b.cards.length - a.cards.length);
  }, [filteredCards]);

  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  const selectedPlayer = useMemo(
    () => players.find((player) => player.playerName === selectedPlayerName) || players[0] || null,
    [players, selectedPlayerName],
  );

  const graphPlayers = players.slice(0, 5);
  const graphNodes = useMemo(() => {
    return graphPlayers.map((player, index) => {
      const y = 90 + index * rowGap;
      const primaryBrand = player.brands[0];
      const primarySet = primaryBrand?.sets[0];
      const boxName = player.topCard?.boxName || `${primaryBrand?.brand || "精选盒"} 推荐盒`;
      return {
        player,
        y,
        boxName,
        brand: primaryBrand?.brand || "未标注品牌",
        set: primarySet?.set || "未标注系列",
      };
    });
  }, [graphPlayers]);

  const trendPulse = average(filteredCards.map((item) => Number(item.priceChange7d || 0)));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_24%),linear-gradient(135deg,rgba(17,24,39,0.92),rgba(11,16,32,0.96))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">Relationship Graph</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">球员 × 品牌 × 系列 × 单卡 关系战情图</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">把一个明星对应多个品牌卡、多个系列卡的结构做成可视化图谱，同时标出强趋势品牌与高价值单卡，方便你快速判断追哪条产品线。</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {sports.map((item) => (
              <button
                key={item}
                onClick={() => setSport(item)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${sport === item ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
              >
                {item === "ALL" ? "全部项目" : item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="球员节点" value={`${players.length}`} icon={<Users className="h-4 w-4 text-primary" />} />
          <MetricCard label="品牌连接" value={`${new Set(filteredCards.map((item) => item.brand || "未标注品牌")).size}`} icon={<GitBranch className="h-4 w-4 text-primary" />} />
          <MetricCard label="卡片样本" value={`${filteredCards.length}`} icon={<Activity className="h-4 w-4 text-primary" />} />
          <MetricCard label="市场脉冲" value={`${trendPulse >= 0 ? "+" : ""}${trendPulse.toFixed(1)}%`} icon={trendPulse >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-300" /> : <TrendingDown className="h-4 w-4 text-rose-300" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">Visual Map</div>
                <div className="mt-2 text-2xl font-black text-white">核心关系链路</div>
                <div className="mt-1 text-sm text-white/50">展示 Top 5 球员的主品牌、主系列和推荐切入盒。</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/65">Box → Player → Brand → Set</div>
            </div>

            <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-[#090f1d] p-4">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="min-w-[900px]">
                <defs>
                  <linearGradient id="edgeGlow" x1="0" x2="1">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.18)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0.46)" />
                  </linearGradient>
                </defs>

                {Object.entries(columns).map(([key, x]) => (
                  <g key={key}>
                    <text x={x - 34} y={36} fill="rgba(255,255,255,0.36)" fontSize="12" fontWeight="700" letterSpacing="3">{key.toUpperCase()}</text>
                    <line x1={x} y1={58} x2={x} y2={svgHeight - 40} stroke="rgba(255,255,255,0.08)" strokeDasharray="6 8" />
                  </g>
                ))}

                {graphNodes.map((node, index) => {
                  const isActive = selectedPlayer?.playerName === node.player.playerName;
                  const color = isActive ? "rgba(56,189,248,0.95)" : "rgba(255,255,255,0.42)";
                  return (
                    <g key={node.player.playerName}>
                      <path d={`M ${columns.box + 26} ${node.y} C 190 ${node.y}, 250 ${node.y}, ${columns.player - 42} ${node.y}`} stroke="url(#edgeGlow)" strokeWidth={isActive ? 3.5 : 2.2} fill="none" opacity={isActive ? 1 : 0.5} />
                      <path d={`M ${columns.player + 44} ${node.y} C 470 ${node.y}, 540 ${node.y}, ${columns.brand - 40} ${node.y}`} stroke="url(#edgeGlow)" strokeWidth={isActive ? 3.5 : 2.2} fill="none" opacity={isActive ? 1 : 0.5} />
                      <path d={`M ${columns.brand + 54} ${node.y} C 730 ${node.y}, 800 ${node.y}, ${columns.set - 50} ${node.y}`} stroke="url(#edgeGlow)" strokeWidth={isActive ? 3.5 : 2.2} fill="none" opacity={isActive ? 1 : 0.5} />

                      <NodePill x={columns.box} y={node.y} title={node.boxName} subtitle="推荐盒" tone="amber" active={isActive} width={130} />
                      <NodePill x={columns.player} y={node.y} title={node.player.playerName} subtitle={`${node.player.cards.length} 张卡`} tone="cyan" active={isActive} width={160} />
                      <NodePill x={columns.brand} y={node.y} title={node.brand} subtitle={`均值 ${node.player.brands[0]?.avgTrend?.toFixed(1) || "0.0"}%`} tone="violet" active={isActive} width={150} />
                      <NodePill x={columns.set} y={node.y} title={node.set} subtitle={`价值分 ${Number(node.player.brands[0]?.sets[0]?.topCard?.dealScore || 0).toFixed(0)}`} tone="emerald" active={isActive} width={170} />

                      <circle cx={columns.player - 62} cy={node.y} r={index === 0 ? 5 : 3.5} fill={color} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">Player Spotlight</div>
              {selectedPlayer ? (
                <>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-3xl font-black text-white">{selectedPlayer.playerName}</div>
                      <div className="mt-2 text-sm text-white/55">主品牌 {selectedPlayer.topBrand || "未标注品牌"} · 主系列 {selectedPlayer.topSet || "未标注系列"}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-bold ${selectedPlayer.avgTrend >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{selectedPlayer.avgTrend >= 0 ? "+" : ""}{selectedPlayer.avgTrend.toFixed(1)}%</div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="总卡数" value={`${selectedPlayer.cards.length}`} />
                    <MiniStat label="关联品牌" value={`${selectedPlayer.brands.length}`} />
                    <MiniStat label="最高价值分" value={`${Number(selectedPlayer.topCard?.dealScore || 0).toFixed(0)}`} />
                  </div>
                  <div className="mt-5 space-y-3">
                    {selectedPlayer.brands.slice(0, 4).map((brand) => (
                      <div key={`${selectedPlayer.playerName}-${brand.brand}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-white">{brand.brand}</div>
                            <div className="mt-1 text-xs text-white/45">{brand.count} 张卡 · 主系列 {brand.topSet || "未标注"}</div>
                          </div>
                          <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${brand.avgTrend >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{brand.avgTrend >= 0 ? "+" : ""}{brand.avgTrend.toFixed(1)}%</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {brand.sets.slice(0, 3).map((setNode) => (
                            <Link key={`${brand.brand}-${setNode.set}`} href={setNode.topCard ? `/card/${setNode.topCard.id}` : "#"} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10">
                              {setNode.set} · {setNode.count}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {selectedPlayer.playerId && <Link href={`/players/${selectedPlayer.playerId}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10">查看球员详情 <ArrowRight className="h-4 w-4" /></Link>}
                    {selectedPlayer.topCard && <Link href={`/card/${selectedPlayer.topCard.id}`} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">查看核心单卡 <Star className="h-4 w-4" /></Link>}
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-white/45">暂无图谱数据。</div>
              )}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">Top Players</div>
                  <div className="mt-2 text-xl font-black text-white">切换图谱焦点</div>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/50">Top {players.slice(0, 8).length}</div>
              </div>
              <div className="space-y-3">
                {players.slice(0, 8).map((player, index) => (
                  <button
                    key={player.playerName}
                    onClick={() => setSelectedPlayerName(player.playerName)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedPlayer?.playerName === player.playerName ? "border-primary/40 bg-primary/10" : "border-white/10 bg-black/20 hover:bg-white/5"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm font-black text-white/70">{index + 1}</div>
                      <div>
                        <div className="font-bold text-white">{player.playerName}</div>
                        <div className="text-xs text-white/45">{player.topBrand || "未标注品牌"} · {player.cards.length} 张卡</div>
                      </div>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${player.avgTrend >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{player.avgTrend >= 0 ? "+" : ""}{player.avgTrend.toFixed(1)}%</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {players.slice(0, 6).map((player) => (
            <div key={player.playerName} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Player Matrix</div>
                  <div className="mt-2 text-xl font-black text-white">{player.playerName}</div>
                  <div className="mt-1 text-sm text-white/45">{player.cards.length} 张卡片关系</div>
                </div>
                <button onClick={() => setSelectedPlayerName(player.playerName)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10">设为焦点</button>
              </div>
              <div className="mt-5 space-y-3">
                {player.brands.slice(0, 3).map((brand) => (
                  <div key={`${player.playerName}-${brand.brand}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{brand.brand}</div>
                        <div className="mt-1 text-xs text-white/45">{brand.count} 张关联卡 · {brand.sets.length} 个系列</div>
                      </div>
                      <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${brand.avgTrend >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{brand.avgTrend >= 0 ? "+" : ""}{brand.avgTrend.toFixed(1)}%</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {brand.sets.slice(0, 3).map((setNode) => (
                        <div key={`${brand.brand}-${setNode.set}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm">
                          <div>
                            <div className="font-semibold text-white">{setNode.set}</div>
                            <div className="text-xs text-white/45">{setNode.count} 张卡 · 趋势 {setNode.avgTrend >= 0 ? "+" : ""}{setNode.avgTrend.toFixed(1)}%</div>
                          </div>
                          {setNode.topCard && <Link href={`/card/${setNode.topCard.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">单卡 <ArrowRight className="h-3.5 w-3.5" /></Link>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-16 text-center text-white/45">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-white/25" /> 当前范围暂无关系图谱数据
          </div>
        )}
      </div>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-white/55">{icon} {label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function NodePill({
  x,
  y,
  title,
  subtitle,
  tone,
  active,
  width,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  tone: "amber" | "cyan" | "violet" | "emerald";
  active: boolean;
  width: number;
}) {
  const palette = {
    amber: { fill: "rgba(251,191,36,0.14)", stroke: "rgba(251,191,36,0.34)" },
    cyan: { fill: "rgba(56,189,248,0.16)", stroke: "rgba(56,189,248,0.38)" },
    violet: { fill: "rgba(168,85,247,0.14)", stroke: "rgba(168,85,247,0.32)" },
    emerald: { fill: "rgba(16,185,129,0.14)", stroke: "rgba(16,185,129,0.32)" },
  }[tone];

  return (
    <g>
      <rect x={x - width / 2} y={y - 26} rx="20" ry="20" width={width} height="52" fill={palette.fill} stroke={active ? "rgba(255,255,255,0.55)" : palette.stroke} strokeWidth={active ? 1.8 : 1.2} />
      <text x={x - width / 2 + 14} y={y - 3} fill="white" fontSize="13" fontWeight="700">{truncate(title, 18)}</text>
      <text x={x - width / 2 + 14} y={y + 14} fill="rgba(255,255,255,0.48)" fontSize="11" fontWeight="600">{truncate(subtitle, 22)}</text>
    </g>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
