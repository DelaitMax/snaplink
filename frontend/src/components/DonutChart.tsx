export interface DonutChartDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  size?: number;
  emptyLabel?: string;
}

const SLICE_OPACITIES = [1, 0.78, 0.6, 0.45, 0.32, 0.22];

/**
 * Донат-чарт на чистом SVG (stroke-dasharray по кругу) — без recharts/d3, по
 * той же причине, что и у BarChart: не тянуть лишнюю зависимость под пару
 * графиков.
 */
export function DonutChart({ data, size = 140, emptyLabel = "Нет данных за этот период" }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return <p className="py-6 text-center text-sm text-ink-faint">{emptyLabel}</p>;
  }

  const strokeWidth = size * 0.18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  interface Segment extends DonutChartDatum {
    dashArray: string;
    dashOffset: number;
    opacity: number;
  }

  const segments = data.reduce<{ items: Segment[]; cumulative: number }>(
    (acc, d, i) => {
      const fraction = d.value / total;
      const dash = fraction * circumference;
      acc.items.push({
        ...d,
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -acc.cumulative,
        opacity: SLICE_OPACITIES[i] ?? SLICE_OPACITIES[SLICE_OPACITIES.length - 1] ?? 1,
      });
      return { items: acc.items, cumulative: acc.cumulative + dash };
    },
    { items: [], cumulative: 0 },
  ).items;

  return (
    <div className="flex items-center gap-5 pt-2 max-[420px]:flex-col max-[420px]:items-start">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        {segments.map((s) => (
          <circle
            key={s.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity={s.opacity}
            strokeWidth={strokeWidth}
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
          >
            <title>{`${s.label}: ${s.value}`}</title>
          </circle>
        ))}
      </svg>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex min-w-0 items-center gap-2 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-accent)", opacity: s.opacity }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-muted">{s.label}</span>
            <span className="font-mono text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
