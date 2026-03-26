import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface AiTrendAnalysisProps {
  card: {
    playerName: string;
    sport: string;
    team?: string;
    year: number;
    brand: string;
    parallel?: string;
    grade?: string;
    currentPrice: number;
    avgPrice30d?: number;
    priceChange7d?: number;
    performanceScore?: number;
    priceHistory?: Array<{ date: string; price: number; source: string }>;
  };
  onClose?: () => void;
}

const SIGNAL_CONFIG = {
  STRONG_BUY: { label: "强烈买入", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", icon: "🚀" },
  BUY:        { label: "买入",     color: "text-green-400",   bg: "bg-green-500/20 border-green-500/40",   icon: "📈" },
  HOLD:       { label: "持有",     color: "text-blue-400",    bg: "bg-blue-500/20 border-blue-500/40",     icon: "⚖️" },
  WAIT:       { label: "观望",     color: "text-yellow-400",  bg: "bg-yellow-500/20 border-yellow-500/40", icon: "⏳" },
  SELL:       { label: "卖出",     color: "text-red-400",     bg: "bg-red-500/20 border-red-500/40",       icon: "📉" },
};

const RISK_CONFIG = {
  "Low":       { label: "低风险",   color: "text-green-400",  dot: "bg-green-400" },
  "Medium":    { label: "中等风险", color: "text-yellow-400", dot: "bg-yellow-400" },
  "High":      { label: "高风险",   color: "text-orange-400", dot: "bg-orange-400" },
  "Very High": { label: "极高风险", color: "text-red-400",    dot: "bg-red-400" },
};

export function AiTrendAnalysis({ card, onClose }: AiTrendAnalysisProps) {
  const [enabled, setEnabled] = useState(false);

  const { data: marketData, isLoading: marketLoading } = trpc.externalMarket.getMarketData.useQuery(
    {
      playerName: card.playerName,
      year: card.year,
      brand: card.brand,
      parallel: card.parallel,
      grade: card.grade,
    },
    { enabled, staleTime: 5 * 60 * 1000 }
  );

  const { data: analysis, isLoading: analysisLoading } = trpc.externalMarket.analyzeCardTrend.useQuery(
    {
      playerName: card.playerName,
      sport: card.sport,
      team: card.team,
      year: card.year,
      brand: card.brand,
      parallel: card.parallel,
      grade: card.grade,
      currentPrice: card.currentPrice,
      avgPrice30d: card.avgPrice30d,
      priceChange7d: card.priceChange7d,
      performanceScore: card.performanceScore,
      priceHistory: card.priceHistory,
      ebayListings: marketData?.ebayListings?.map((l) => ({
        price: l.price,
        soldDate: l.soldDate,
        grade: l.grade,
      })),
      kataoListings: marketData?.kataoListings?.map((l) => ({
        price: l.price,
        soldDate: l.soldDate,
        grade: l.grade,
        currency: l.currency,
      })),
    },
    { enabled: enabled && !!marketData, staleTime: 10 * 60 * 1000 }
  );

  const isLoading = marketLoading || analysisLoading;

  if (!enabled) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">AI 智能分析</h3>
              <p className="text-slate-400 text-sm">实时 eBay + 卡淘数据 · Gemini AI 趋势预测</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
          )}
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 mb-4 border border-slate-700/50">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-slate-400 text-xs mb-1">eBay 成交价</div>
              <div className="text-white font-semibold text-sm">实时抓取</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">卡淘市场</div>
              <div className="text-white font-semibold text-sm">国内行情</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">AI 预测</div>
              <div className="text-white font-semibold text-sm">Gemini 2.5</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setEnabled(true)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>🔍</span>
          <span>启动 AI 分析</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">AI 智能分析</h3>
            <p className="text-slate-400 text-sm">
              {isLoading ? "正在获取实时数据..." : `已获取 ${(marketData?.summary.totalListings || 0)} 条市场数据`}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        )}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="space-y-3">
          {[
            { icon: "🔍", text: "正在搜索 eBay 成交记录...", done: !marketLoading },
            { icon: "🏪", text: "正在查询卡淘市场数据...", done: !marketLoading },
            { icon: "🧠", text: "Gemini AI 分析价格走势...", done: !analysisLoading },
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${step.done ? "border-green-500/30 bg-green-500/10" : "border-slate-700 bg-slate-800/50"}`}>
              <span className="text-lg">{step.icon}</span>
              <span className={`text-sm ${step.done ? "text-green-400" : "text-slate-300"}`}>{step.text}</span>
              {step.done ? (
                <span className="ml-auto text-green-400 text-sm">✓</span>
              ) : (
                <div className="ml-auto w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* eBay 市场数据 */}
      {marketData && !isLoading && (
        <>
          {/* 价格摘要 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
              <div className="text-slate-400 text-xs mb-1">eBay 均价</div>
              <div className="text-white font-bold text-lg">
                {marketData.summary.ebayAvgPrice ? `$${marketData.summary.ebayAvgPrice.toLocaleString()}` : "—"}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
              <div className="text-slate-400 text-xs mb-1">eBay 区间</div>
              <div className="text-white font-bold text-sm">
                {marketData.summary.ebayMinPrice && marketData.summary.ebayMaxPrice
                  ? `$${marketData.summary.ebayMinPrice.toLocaleString()} – $${marketData.summary.ebayMaxPrice.toLocaleString()}`
                  : "—"}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
              <div className="text-slate-400 text-xs mb-1">卡淘均价</div>
              <div className="text-white font-bold text-lg">
                {marketData.summary.kataoAvgPriceCNY ? `¥${marketData.summary.kataoAvgPriceCNY.toLocaleString()}` : "—"}
              </div>
            </div>
          </div>

          {/* eBay 成交记录 */}
          {marketData.ebayListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-white">eBay 近期成交</span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{marketData.ebayListings.length} 条</span>
                <a
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.playerName + " " + card.year + " " + card.brand)}&_sacat=214&LH_Complete=1&LH_Sold=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  在 eBay 查看 →
                </a>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {marketData.ebayListings.slice(0, 6).map((listing, i) => (
                  <a
                    key={i}
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-800 transition-all group"
                  >
                    {listing.imageUrl && (
                      <img
                        src={listing.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate group-hover:text-blue-300 transition-colors">
                        {listing.title}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">{listing.soldDate} · {listing.grade}</div>
                    </div>
                    <div className="text-green-400 font-bold text-sm flex-shrink-0">
                      ${listing.price.toLocaleString()}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 卡淘数据 */}
          {marketData.kataoListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-white">🏪 卡淘市场</span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{marketData.kataoListings.length} 条</span>
                <a
                  href={`https://www.cardhobby.com.cn/Market/Search?keyword=${encodeURIComponent(card.playerName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  在卡淘查看 →
                </a>
              </div>
              <div className="space-y-2">
                {marketData.kataoListings.slice(0, 4).map((listing, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate">{listing.title}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{listing.soldDate} · {listing.grade}</div>
                    </div>
                    <div className="text-yellow-400 font-bold text-sm flex-shrink-0 ml-3">
                      ¥{listing.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {marketData.ebayListings.length === 0 && marketData.kataoListings.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-sm">
              未找到相关市场数据，可能是网络限制或该卡片暂无成交记录
            </div>
          )}
        </>
      )}

      {/* AI 分析结果 */}
      {analysis && !isLoading && (
        <>
          <div className="border-t border-slate-700/50 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-white">🧠 Gemini AI 分析</span>
              <span className="text-xs text-slate-400">
                {new Date(analysis.generatedAt).toLocaleString("zh-CN")}
              </span>
            </div>

            {/* 信号 + 置信度 */}
            <div className="flex gap-3 mb-4">
              {(() => {
                const cfg = SIGNAL_CONFIG[analysis.signal] || SIGNAL_CONFIG.HOLD;
                return (
                  <div className={`flex-1 rounded-xl p-4 border ${cfg.bg} flex items-center gap-3`}>
                    <span className="text-3xl">{cfg.icon}</span>
                    <div>
                      <div className={`font-bold text-xl ${cfg.color}`}>{cfg.label}</div>
                      <div className="text-slate-400 text-xs">置信度 {analysis.confidence}%</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-16 h-16 relative">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                          <circle
                            cx="32" cy="32" r="28" fill="none"
                            stroke={analysis.confidence > 80 ? "#10b981" : analysis.confidence > 60 ? "#3b82f6" : "#f59e0b"}
                            strokeWidth="6"
                            strokeDasharray={`${(analysis.confidence / 100) * 175.9} 175.9`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{analysis.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 风险等级 */}
              {(() => {
                const riskCfg = RISK_CONFIG[analysis.riskLevel] || RISK_CONFIG["Medium"];
                return (
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-center items-center min-w-[100px]">
                    <div className={`w-3 h-3 rounded-full ${riskCfg.dot} mb-2`} />
                    <div className={`font-semibold text-sm ${riskCfg.color}`}>{riskCfg.label}</div>
                    <div className="text-slate-400 text-xs mt-1">风险等级</div>
                  </div>
                );
              })()}
            </div>

            {/* 价格目标 */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 mb-4">
              <div className="text-slate-400 text-xs mb-3">价格目标区间</div>
              <div className="flex items-end gap-2">
                <div className="text-center flex-1">
                  <div className="text-red-400 text-xs mb-1">保守</div>
                  <div className="text-white font-bold">${analysis.priceTarget.low.toLocaleString()}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-blue-400 text-xs mb-1">基准</div>
                  <div className="text-white font-bold text-lg">${analysis.priceTarget.mid.toLocaleString()}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-green-400 text-xs mb-1">乐观</div>
                  <div className="text-white font-bold">${analysis.priceTarget.high.toLocaleString()}</div>
                </div>
              </div>
              {/* 价格条 */}
              <div className="mt-3 relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-green-500"
                  style={{ width: "100%" }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-slate-900"
                  style={{
                    left: `${Math.min(95, Math.max(5, ((card.currentPrice - analysis.priceTarget.low) / (analysis.priceTarget.high - analysis.priceTarget.low)) * 100))}%`,
                    transform: "translateX(-50%) translateY(-50%)",
                  }}
                />
              </div>
              <div className="flex justify-between text-slate-500 text-xs mt-1">
                <span>当前 ${card.currentPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* 摘要 */}
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-4">
              <p className="text-slate-200 text-sm leading-relaxed">{analysis.summary}</p>
            </div>

            {/* 短期/长期展望 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-slate-400 text-xs mb-2">📅 短期展望（1-4周）</div>
                <p className="text-white text-xs leading-relaxed">{analysis.shortTermOutlook}</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-slate-400 text-xs mb-2">📊 长期展望（3-12月）</div>
                <p className="text-white text-xs leading-relaxed">{analysis.longTermOutlook}</p>
              </div>
            </div>

            {/* 催化剂 + 风险 */}
            <div className="grid grid-cols-2 gap-3">
              {analysis.catalysts.length > 0 && (
                <div>
                  <div className="text-green-400 text-xs font-semibold mb-2">✅ 正面催化剂</div>
                  <ul className="space-y-1">
                    {analysis.catalysts.map((c, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.risks.length > 0 && (
                <div>
                  <div className="text-red-400 text-xs font-semibold mb-2">⚠️ 风险因素</div>
                  <ul className="space-y-1">
                    {analysis.risks.map((r, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 关键因素 */}
            {analysis.keyFactors.length > 0 && (
              <div className="mt-4">
                <div className="text-slate-400 text-xs mb-2">关键因素</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyFactors.map((f, i) => (
                    <span key={i} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 刷新按钮 */}
      {!isLoading && (
        <button
          onClick={() => setEnabled(false)}
          className="w-full py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-all"
        >
          重新分析
        </button>
      )}
    </div>
  );
}
