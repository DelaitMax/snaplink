export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  emptyLabel?: string;
}

/**
 * Простой столбчатый график на чистом HTML/CSS (flex-колонки) — без
 * recharts/d3, чтобы не тянуть лишнюю зависимость под пару графиков.
 */
export function BarChart({ data, height = 140, emptyLabel = "Нет данных за этот период" }: BarChartProps) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="py-6 text-center text-sm text-ink-faint">{emptyLabel}</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2 pt-4" style={{ height }}>
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0);
        return (
          <div
            className="flex h-full min-w-0 flex-1 flex-col items-center"
            key={d.label}
            title={`${d.label}: ${d.value}`}
          >
            <span className="h-3.5 font-mono text-[11px] text-ink-muted">{d.value > 0 ? d.value : ""}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full min-h-0.5 rounded-t-[3px] bg-accent transition-[height] duration-250 ease-out"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="mt-2 max-w-full truncate font-mono text-[10px] text-ink-faint">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
