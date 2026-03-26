import { useMemo, useState } from "react";

interface DataPoint {
  label?: string;
  value: number;
}

interface SimpleAreaChartProps {
  data: DataPoint[];
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  showTooltip?: boolean;
  valueFormatter?: (value: number) => string;
}

export function SimpleAreaChart({
  data,
  height = 240,
  stroke = "#1D6FEB",
  fill = "rgba(29,111,235,0.18)",
  className = "",
  showTooltip = false,
  valueFormatter = (value) => value.toFixed(2),
}: SimpleAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 800;
  const padding = 18;

  const { linePath, areaPath, points, min, max } = useMemo(() => {
    const safeData = data.length > 0 ? data : [{ value: 0 }];
    const values = safeData.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const mappedPoints = safeData.map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(safeData.length - 1, 1);
      const y = padding + ((maxValue - item.value) / range) * (height - padding * 2);
      return { x, y, value: item.value, label: item.label };
    });

    const line = mappedPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
    const area = `${line} L${mappedPoints[mappedPoints.length - 1].x},${height - padding} L${mappedPoints[0].x},${height - padding} Z`;

    return { linePath: line, areaPath: area, points: mappedPoints, min: minValue, max: maxValue };
  }, [data, height]);

  return (
    <div className={`relative w-full ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`simple-area-${stroke.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} />
            <stop offset="100%" stopColor="rgba(29,111,235,0.02)" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#simple-area-${stroke.replace(/[^a-zA-Z0-9]/g, "")})`} />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {showTooltip && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={12}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
        {hoveredIndex !== null && (
          <circle cx={points[hoveredIndex].x} cy={points[hoveredIndex].y} r={5} fill={stroke} stroke="#fff" strokeWidth="2" />
        )}
      </svg>

      {showTooltip && hoveredIndex !== null && (
        <div className="absolute right-4 top-4 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
          <div className="font-semibold text-foreground">{valueFormatter(points[hoveredIndex].value)}</div>
          <div className="text-muted-foreground">{points[hoveredIndex].label || `区间 ${hoveredIndex + 1}`}</div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 text-[10px] text-muted-foreground">{valueFormatter(min)}</div>
      <div className="absolute right-0 top-0 text-[10px] text-muted-foreground">{valueFormatter(max)}</div>
    </div>
  );
}
