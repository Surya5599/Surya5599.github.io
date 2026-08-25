import { useEffect, useRef } from "react";
import { SPANS, CAREER_START, CAREER_END, STATUS_COLOR, statusCounts, type Span } from "./data";

/* ---------- count-up KPI number ---------- */

export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = to.toLocaleString() + suffix;
      return;
    }
    const t0 = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ---------- career gantt ---------- */

export function Gantt({ selected, onSelect }: { selected: number | null; onSelect: (i: number) => void }) {
  const W = 640;
  const ROW = 48;
  const LEFT = 8;
  const years = [];
  for (let y = CAREER_START; y <= Math.floor(CAREER_END); y++) years.push(y);
  const x = (v: number) => LEFT + ((v - CAREER_START) / (CAREER_END - CAREER_START)) * (W - LEFT - 8);
  const colors = ["var(--color-violet)", "var(--color-clay)", "var(--color-moss)"];

  return (
    <svg viewBox={`0 0 ${W} ${SPANS.length * ROW + 34}`} className="w-full">
      {years.map((y) => (
        <g key={y}>
          <line x1={x(y)} y1={0} x2={x(y)} y2={SPANS.length * ROW + 6} stroke="var(--color-oat)" strokeWidth="2" />
          <text x={x(y) + 3} y={SPANS.length * ROW + 26} fontSize="11" fontWeight="700" fill="var(--color-faded)">
            {y}
          </text>
        </g>
      ))}
      {SPANS.map((s: Span, i) => {
        const isSel = selected === i;
        const barW = Math.max(8, x(s.end) - x(s.start));
        // two-line label: company on top, role below; place inside → right → left
        const labelW = Math.max(s.job.company.length * 6.8, s.job.role.length * 5.8);
        const place = labelW + 20 <= barW ? "in" : x(s.end) + 10 + labelW <= W ? "right" : "left";
        return (
          <g key={i} onClick={() => onSelect(i)} className="cursor-pointer">
            <rect
              x={x(s.start)}
              y={i * ROW + 10}
              width={barW}
              height={ROW - 22}
              rx={13}
              fill={colors[i % colors.length]}
              stroke="var(--color-ink)"
              strokeWidth={isSel ? 3 : 2}
              opacity={selected === null || isSel ? 1 : 0.35}
            >
              <animate attributeName="width" from="8" to={barW} dur="0.7s" fill="freeze" />
            </rect>
            <text
              x={place === "in" ? x(s.start) + 12 : place === "right" ? x(s.end) + 10 : x(s.start) - 10}
              textAnchor={place === "left" ? "end" : "start"}
              pointerEvents="none"
              fill="var(--color-ink)"
            >
              <tspan y={i * ROW + ROW / 2 - 3} fontSize="12" fontWeight="800">
                {s.job.company}
              </tspan>
              <tspan
                x={place === "in" ? x(s.start) + 12 : place === "right" ? x(s.end) + 10 : x(s.start) - 10}
                y={i * ROW + ROW / 2 + 10}
                fontSize="10"
                fontWeight="600"
                fill={place === "in" ? "var(--color-ink)" : "var(--color-faded)"}
                opacity={place === "in" ? 0.75 : 1}
              >
                {s.job.role}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- status donut ---------- */

export function Donut({ filter, onSelect }: { filter: string | null; onSelect: (s: string | null) => void }) {
  const total = statusCounts.reduce((a, b) => a + b.count, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0">
        {statusCounts.map((s) => {
          const frac = s.count / total;
          const dash = frac * C;
          const offset = -acc * C;
          acc += frac;
          const isSel = filter === s.status;
          return (
            <circle
              key={s.status}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={STATUS_COLOR[s.status]}
              strokeWidth={isSel ? 26 : 20}
              strokeDasharray={`${dash - 3} ${C - dash + 3}`}
              strokeDashoffset={offset + C / 4}
              opacity={filter === null || isSel ? 1 : 0.3}
              className="cursor-pointer transition-all"
              onClick={() => onSelect(isSel ? null : s.status)}
            />
          );
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--color-ink)" fontFamily="var(--font-display)">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="1" fill="var(--color-faded)">
          PROJECTS
        </text>
      </svg>
      <div className="space-y-1.5">
        {statusCounts.map((s) => (
          <button
            key={s.status}
            onClick={() => onSelect(filter === s.status ? null : s.status)}
            className={`flex cursor-pointer items-center gap-2 text-xs font-bold ${filter && filter !== s.status ? "opacity-40" : ""}`}
          >
            <span className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: STATUS_COLOR[s.status] }} />
            {s.status} · {s.count}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- horizontal bar list ---------- */

export function Bars({
  items,
  max,
  onSelect,
  selected,
  unit,
}: {
  items: { label: string; value: number; note?: string }[];
  max: number;
  selected?: string | null;
  onSelect?: (label: string | null) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => {
        const isSel = selected === it.label;
        return (
          <button
            key={it.label}
            onClick={() => onSelect?.(isSel ? null : it.label)}
            className={`block w-full text-left ${onSelect ? "cursor-pointer" : "cursor-default"} ${
              selected && !isSel ? "opacity-40" : ""
            }`}
          >
            <div className="flex justify-between text-xs font-bold">
              <span>{it.label}</span>
              <span className="text-faded">
                {it.note ?? `${it.value}${unit ?? ""}`}
              </span>
            </div>
            <div className="mt-1 h-2.5 rounded-full border border-ink/25 bg-oat">
              <div
                className="barfill h-full rounded-full"
                style={{
                  width: `${(it.value / max) * 100}%`,
                  background: ["var(--color-clay)", "var(--color-moss)", "var(--color-violet)"][i % 3],
                  animationDelay: `${i * 60}ms`,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
