import { useRef, useState } from "react";
import { Camera, Upload, X, ScanLine, ArrowRight, Radar, TrendingUp, TrendingDown, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TrendBoard } from "@/components/TrendBoard";

export function Scanner() {
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const trendBoardQuery = trpc.scanner.getTrendBoard.useQuery({ limit: 18 });
  const addWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: async () => { await utils.watchlist.get.invalidate(); toast.success("已加入关注列表"); },
  });
  const addPortfolioMutation = trpc.portfolio.add.useMutation({
    onSuccess: async () => { await utils.portfolio.get.invalidate(); toast.success("已加入资产组合"); },
  });
  const runScanMutation = trpc.scanner.runScan.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        utils.scanner.getLatestJob.invalidate(),
        utils.scanner.getHistory.invalidate(),
        utils.scanner.getTrendBoard.invalidate(),
        utils.cards.getTrendBoard.invalidate(),
        utils.cards.getDailyTrendSummary.invalidate(),
        utils.notifications.get.invalidate(),
      ]);
      toast.success(`智能扫描完成，发现 ${data.dealsFound} 个机会`);
    },
  });

  const handleWatch = (item: any) => addWatchlistMutation.mutate({ cardId: item.cardId, alertDealScoreAbove: 75, notes: `${item.playerName} 从扫描中心加入关注` });
  const handlePortfolio = (item: any) => addPortfolioMutation.mutate({ cardId: item.cardId, quantity: 1, averageCost: Number(item.currentPrice || 0), targetPrice: Number(item.currentPrice || 0) * 1.2, notes: `${item.playerName} 从扫描中心加入组合` });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const processFile = (file: File) => {
    setIsScanning(false); setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };
  const triggerScan = () => {
    if (!image) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setResult({ id: 1, playerName: "Victor Wembanyama", year: "2023", brand: "Panini Prizm", set: "Base", grade: "PSA 10", confidence: 96, currentPrice: 245.5 });
    }, 2500);
  };

  const board = trendBoardQuery.data;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F7FB]">
      {/* 顶部 Hero 区 */}
      <div className="bg-white border-b border-[#E2EAF4] px-8 py-6">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">AI 拍照识卡</h1>
            <p className="mt-1 text-sm text-[#6B7FA3]">上传球星卡图片进行识别，同时查看全市场智能扫描的强弱趋势榜</p>
          </div>
          <button
            onClick={() => runScanMutation.mutate({ triggeredBy: "manual" })}
            disabled={runScanMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-[#1D6FEB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
          >
            <Radar className="h-4 w-4" /> {runScanMutation.isPending ? "智能扫描中..." : "运行智能扫描"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-6 space-y-6">

        {/* AI 识卡主区域 */}
        <div className="rounded-2xl border border-[#E2EAF4] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2EAF4]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Sparkles className="h-4 w-4 text-[#1D6FEB]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0A1628]">AI 卡牌识别</h2>
                <p className="text-xs text-[#6B7FA3]">支持 JPG、PNG、WEBP，确保整张卡牌在画面内</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-bold text-[#16a34a]">
                <TrendingUp className="h-3.5 w-3.5" /> {board?.bullish.length || 0} 强势
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-bold text-[#dc2626]">
                <TrendingDown className="h-3.5 w-3.5" /> {board?.bearish.length || 0} 风险
              </span>
            </div>
          </div>

          <div className="p-6">
            {!image ? (
              /* 上传区域 */
              <div
                className={`cursor-pointer rounded-2xl border-2 border-dashed py-24 text-center transition-all ${
                  dragActive
                    ? "border-[#1D6FEB] bg-[#F0F5FF]"
                    : "border-[#D0DCE8] hover:border-[#1D6FEB]/60 hover:bg-[#F8FAFC]"
                }`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${dragActive ? "bg-[#1D6FEB]" : "bg-[#EEF4FF]"}`}>
                  <Camera className={`h-8 w-8 transition-colors ${dragActive ? "text-white" : "text-[#1D6FEB]"}`} />
                </div>
                <h3 className="text-sm font-bold text-[#0A1628] mb-1.5">点击拍照或拖拽图片到此</h3>
                <p className="text-xs text-[#6B7FA3] max-w-xs mx-auto leading-relaxed">确保整张卡牌在画面内且光线充足，AI 将自动识别球员、年份、系列和评级</p>
                <button className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#E2EAF4] bg-white px-5 py-2.5 text-sm font-semibold text-[#0A1628] hover:bg-[#F4F7FB] transition-colors shadow-sm">
                  <Upload className="h-4 w-4 text-[#6B7FA3]" /> 选择本地文件
                </button>
              </div>
            ) : (
              /* 识别区域 */
              <div className="flex flex-col gap-6 md:flex-row">
                {/* 图片预览 */}
                <div className="flex-1">
                  <div className="relative flex aspect-[3/4] max-h-96 items-center justify-center overflow-hidden rounded-2xl border border-[#E2EAF4] bg-[#F8FAFC]">
                    <img src={image} alt="Scanned Card" className="h-full w-full object-contain" />
                    {isScanning && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
                        <div className="absolute top-0 h-0.5 w-full animate-scan bg-gradient-to-r from-transparent via-[#1D6FEB] to-transparent" />
                        <div className="flex items-center gap-2.5 rounded-2xl border border-[#D8E8FF] bg-white px-5 py-3 shadow-lg">
                          <ScanLine className="h-5 w-5 animate-pulse text-[#1D6FEB]" />
                          <span className="text-sm font-bold text-[#1D6FEB]">特征引擎识别中...</span>
                        </div>
                      </div>
                    )}
                    <button
                      className="absolute right-3 top-3 z-20 rounded-xl border border-[#E2EAF4] bg-white p-1.5 text-[#6B7FA3] hover:text-[#dc2626] hover:border-[#dc2626] transition-colors shadow-sm"
                      onClick={() => { setImage(null); setResult(null); setIsScanning(false); }}
                      disabled={isScanning}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 识别结果 */}
                <div className="flex w-full flex-col md:w-72">
                  {!result ? (
                    <div className="flex h-full flex-col justify-center gap-4">
                      <div className="rounded-2xl border border-[#E2EAF4] bg-[#F8FAFC] p-5 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] mx-auto mb-3">
                          <Camera className="h-6 w-6 text-[#1D6FEB]" />
                        </div>
                        <h3 className="text-sm font-bold text-[#0A1628]">图片已加载</h3>
                        <p className="text-xs text-[#6B7FA3] mt-1">点击下方按钮开始 AI 识别</p>
                      </div>
                      <button
                        onClick={triggerScan}
                        disabled={isScanning}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D6FEB] py-3 text-sm font-bold text-white hover:bg-[#1558c7] transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
                      >
                        {isScanning
                          ? <><ScanLine className="h-4 w-4 animate-spin" /> 正在提取卡牌指纹</>
                          : <><Sparkles className="h-4 w-4" /> 开始 AI 识别</>
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col gap-4">
                      {/* 成功标识 */}
                      <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a] shrink-0" />
                        <span className="text-xs font-bold text-[#16a34a]">识别成功（置信度 {result.confidence}%）</span>
                      </div>

                      {/* 识别详情 */}
                      <div className="flex-1 space-y-3">
                        <div className="rounded-2xl border border-[#E2EAF4] bg-[#F8FAFC] p-4 space-y-3">
                          <div>
                            <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-1">球员</div>
                            <div className="text-lg font-bold text-[#0A1628]">{result.playerName}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-1">年份 / 系列</div>
                              <div className="text-sm font-semibold text-[#0A1628]">{result.year} {result.brand}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-1">评级</div>
                              <span className="inline-block rounded-lg bg-[#EEF4FF] border border-[#D8E8FF] px-2.5 py-1 text-xs font-bold text-[#1D6FEB]">{result.grade || "Raw"}</span>
                            </div>
                          </div>
                        </div>

                        {/* 估价 */}
                        <div className="rounded-2xl border border-[#D8E8FF] bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF] p-4">
                          <div className="text-[10px] font-bold text-[#6B7FA3] uppercase tracking-wider mb-1.5">当前市场估价</div>
                          <div className="text-3xl font-black text-[#1D6FEB] font-data">${result.currentPrice?.toFixed(2)}</div>
                        </div>
                      </div>

                      <Link href={`/card/${result.id}`}>
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A1628] py-3 text-sm font-bold text-white hover:bg-[#1D2D4A] transition-colors">
                          查看完整行情 <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 趋势榜 */}
        <div className="grid gap-4 xl:grid-cols-2">
          <TrendBoard title="看涨趋势榜" items={board?.bullish || []} tone="bullish" onWatch={handleWatch} onPortfolio={handlePortfolio} />
          <TrendBoard title="风险预警榜" items={board?.bearish || []} tone="bearish" onWatch={handleWatch} onPortfolio={handlePortfolio} />
        </div>
      </div>
    </div>
  );
}
