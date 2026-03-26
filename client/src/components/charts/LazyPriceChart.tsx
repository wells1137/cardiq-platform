import { useEffect, useRef } from "react";

interface PricePoint {
  saleDate: string | Date;
  price: number;
}

export function LazyPriceChart({ history, className = "" }: { history: PricePoint[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let chart: any;

    async function renderChart() {
      if (!containerRef.current || history.length === 0) return;
      const mod = await import("lightweight-charts");
      if (!mounted || !containerRef.current) return;

      const { createChart, ColorType, AreaSeries } = mod as any;
      chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#64748b",
        },
        grid: {
          vertLines: { color: "#f1f5f9" },
          horzLines: { color: "#f1f5f9" },
        },
        width: containerRef.current.clientWidth,
        height: 400,
        timeScale: {
          borderColor: "#e2e8f0",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: "#e2e8f0",
        },
      });

      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "#1D6FEB",
        topColor: "rgba(29, 111, 235, 0.4)",
        bottomColor: "rgba(29, 111, 235, 0.0)",
        lineWidth: 2,
      });

      const data = history
        .map((h) => ({ time: (new Date(h.saleDate).getTime() / 1000) as any, value: Number(h.price) }))
        .sort((a, b) => (a.time as number) - (b.time as number));

      areaSeries.setData(data);
      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const cleanupPromise = renderChart();

    return () => {
      mounted = false;
      Promise.resolve(cleanupPromise).then((cleanup) => cleanup && cleanup());
      if (chart) chart.remove();
    };
  }, [history]);

  return <div ref={containerRef} className={className} />;
}
