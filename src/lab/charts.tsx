// Chart primitives for the Data Lab. One hue per chart: these encode a single
// series, so a rotating palette would only add noise.

import { fmtNum, type Bin } from "./profile";

export function Histogram({ bins, height = 92 }: { bins: Bin[]; height?: number }) {
  if (!bins.length) return null;
  const max = Math.max(...bins.map((b) => b.n));
  const W = 300;
  const gap = 1.5;
  const w = (W - gap * (bins.length - 1)) / bins.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="distribution">
        {bins.map((b, i) => {
          const h = max ? (b.n / max) * (height - 4) : 0;
          return (
            <rect
              key={i}
              x={i * (w + gap)}
              y={height - h}
              width={w}
              height={Math.max(b.n ? 1.5 : 0, h)}
              rx="2"
              fill="var(--color-clay)"
              className="barfill"
              style={{ animationDelay: `${i * 22}ms` }}
            >
              <title>{`${fmtNum(b.from)} – ${fmtNum(b.to)}: ${b.n.toLocaleString()}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-bold text-faded">
        <span>{fmtNum(bins[0].from)}</span>
        <span>{fmtNum(bins[bins.length - 1].to)}</span>
      </div>
    </div>
  );
}

export function TimeSeries({ points, height = 92 }: { points: { key: string; n: number }[]; height?: number }) {
  if (points.length < 2) return null;
  const W = 300;
  const max = Math.max(...points.map((p) => p.n));
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (n: number) => height - 4 - (max ? (n / max) * (height - 12) : 0);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.n).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="volume over time">
        <polygon points={`0,${height} ${line} ${W},${height}`} fill="var(--color-clay)" opacity="0.18" />
        <polyline points={line} fill="none" stroke="var(--color-clay-deep)" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.key} cx={x(i)} cy={y(p.n)} r={points.length > 60 ? 0 : 2} fill="var(--color-ink)">
            <title>{`${p.key}: ${p.n.toLocaleString()}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-bold text-faded">
        <span>{points[0].key}</span>
        <span>{points[points.length - 1].key}</span>
      </div>
    </div>
  );
}

// Single-hue horizontal bars — for a top-N breakdown where the categories are
// values of one column, not separate series.
export function MiniBars({ items, total }: { items: { label: string; n: number }[]; total: number }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.label + i}>
          <div className="flex items-baseline justify-between gap-3 text-xs font-bold">
            <span className="truncate" title={it.label}>
              {it.label === "" ? <span className="text-faded italic">empty string</span> : it.label}
            </span>
            <span className="shrink-0 text-faded">
              {it.n.toLocaleString()}
              <span className="ml-1.5 font-semibold">{total ? `${((it.n / total) * 100).toFixed(0)}%` : ""}</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-oat">
            <div
              className="barfill h-full rounded-full bg-clay"
              style={{ width: `${(it.n / max) * 100}%`, animationDelay: `${i * 45}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const COLS24 = { gridTemplateColumns: "repeat(24, minmax(0, 1fr))" } as const;

// 7 x 24 commit heatmap. Opacity ramp on one hue, because the value is a
// single magnitude — a rainbow scale would imply categories that aren't there.
export function Heatmap({ cells }: { cells: number[] }) {
  const max = Math.max(1, ...cells);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="flex gap-1">
          <div className="w-4" />
          <div className="grid flex-1 gap-[2px]" style={COLS24}>
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center text-[8px] font-bold text-faded">
                {h % 6 === 0 ? h : ""}
              </span>
            ))}
          </div>
        </div>
        {Array.from({ length: 7 }, (_, d) => (
          <div key={d} className="mt-[2px] flex items-center gap-1">
            <span className="w-4 text-[9px] font-extrabold text-faded">{DAYS[d]}</span>
            <div className="grid flex-1 gap-[2px]" style={COLS24}>
              {Array.from({ length: 24 }, (_, h) => {
                const n = cells[d * 24 + h] ?? 0;
                return (
                  <div
                    key={h}
                    title={`${DAYS[d]} ${h}:00 — ${n} commit${n === 1 ? "" : "s"}`}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background: n ? "var(--color-clay)" : "var(--color-oat)",
                      opacity: n ? 0.28 + 0.72 * (n / max) : 1,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
