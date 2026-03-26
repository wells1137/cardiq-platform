import { useMemo } from "react";

interface SimpleSparklineProps {
  values: number[];
  className?: string;
  color?: string;
  fill?: string;
}

export function SimpleSparkline({ values, className = "", color = "#1D6FEB", fill = "rgba(29,111,235,0.12)" }: SimpleSparklineProps) {
  const width = 160;
  const height = 44;
  const padding = 3;

  const { linePath, areaPath } = useMemo(() => {
    const safeValues = values.length > 0 ? values : [0, 0];
    const min = Math.min(...safeValues);
    const max = Math.max(...safeValues);
    const range = max - min || 1;
    const points = safeValues.map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(safeValues.length - 1, 1);
      const y = padding + ((max - value) / range) * (height - padding * 2);
      return { x, y };
    });
    const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
    const area = `${line} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;
    return { linePath: line, areaPath: area };
  }, [values]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-10 w-full ${className}`} preserveAspectRatio="none">
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
