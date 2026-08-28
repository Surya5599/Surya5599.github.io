// Column profiling: infer a type per column, then compute the statistics that
// type actually supports. Everything here is pure and synchronous — the whole
// point of the demo is that the pipeline runs in the visitor's browser.

import { isNullToken, type Table } from "./parse";

export type ColType = "integer" | "decimal" | "datetime" | "boolean" | "category" | "text" | "empty";
export type PII = "email" | "phone" | "ip" | "card" | "ssn";

export type Bin = { from: number; to: number; n: number };
export type TopValue = { value: string; n: number };

export type Column = {
  name: string;
  type: ColType;
  format?: string; // e.g. "currency", "percent", "epoch ms", "ISO-8601"
  count: number; // non-null
  nulls: number;
  nullPct: number;
  distinct: number;
  isKey: boolean;
  pii?: PII;
  // numeric
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  p95?: number;
  stdev?: number;
  outliers?: number;
  bins?: Bin[];
  binsNote?: string; // set when the histogram range is clipped to the middle 98%
  // temporal
  tMin?: number;
  tMax?: number;
  byPeriod?: { key: string; n: number }[];
  period?: "day" | "month" | "year";
  // categorical / text
  top?: TopValue[];
  minLen?: number;
  maxLen?: number;
  sample: string[];
};

export type Finding = { level: "info" | "warn"; column?: string; text: string };

export type Report = {
  rowCount: number;
  colCount: number;
  cells: number;
  nullCells: number;
  dupRows: number;
  columns: Column[];
  findings: Finding[];
  stages: { name: string; ms: number }[];
};

/* ---------- value coercion ---------- */

const CURRENCY = /^[-+]?[$£€¥]\s?[\d,]+(\.\d+)?$/;
const PERCENT = /^[-+]?[\d,]+(\.\d+)?\s?%$/;
const INTEGER = /^[-+]?\d{1,3}(,\d{3})+$|^[-+]?\d+$/;
const DECIMAL = /^[-+]?(\d{1,3}(,\d{3})+|\d*)(\.\d+)?([eE][-+]?\d+)?$/;
const TRUE = new Set(["true", "yes", "y", "t"]);
const FALSE = new Set(["false", "no", "n", "f"]);

function toNumber(raw: string): number | null {
  const s = raw.trim().replace(/[$£€¥%,\s]/g, "");
  if (s === "" || s === "-" || s === "+") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[-+]\d{2}:?\d{2})?)?$/;
const SLASHED = /^\d{1,2}\/\d{1,2}\/\d{2,4}([T ]\d{1,2}:\d{2}(:\d{2})?)?$/;
const DOTTED = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
const MONTH_NAME = /^\d{1,2}[- ][A-Za-z]{3,9}[- ]\d{2,4}$|^[A-Za-z]{3,9} \d{1,2},? \d{4}$/;

// Epoch numbers are only read as time when they land in a plausible window —
// 1e9..2.1e9 seconds, or the same range in ms. Without that guard every id
// column in the world becomes a timestamp.
function toTime(raw: string): { t: number; format: string } | null {
  const s = raw.trim();
  if (ISO.test(s)) {
    const t = Date.parse(s.includes("T") || s.includes(" ") ? s : `${s}T00:00:00Z`);
    return Number.isFinite(t) ? { t, format: "ISO-8601" } : null;
  }
  if (DOTTED.test(s)) {
    const t = Date.parse(s.split(".").reverse().join("-"));
    return Number.isFinite(t) ? { t, format: "DD.MM.YYYY" } : null;
  }
  if (SLASHED.test(s) || MONTH_NAME.test(s)) {
    const t = Date.parse(s);
    return Number.isFinite(t) ? { t, format: SLASHED.test(s) ? "M/D/YYYY" : "month name" } : null;
  }
  if (/^\d{10}$/.test(s)) {
    const n = Number(s);
    if (n > 9.4e8 && n < 2.1e9) return { t: n * 1000, format: "epoch seconds" };
  }
  if (/^\d{13}$/.test(s)) {
    const n = Number(s);
    if (n > 9.4e11 && n < 2.1e12) return { t: n, format: "epoch ms" };
  }
  return null;
}

/* ---------- PII sniffing ---------- */

const PII_TESTS: { kind: PII; re: RegExp }[] = [
  { kind: "email", re: /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/ },
  { kind: "ip", re: /^(\d{1,3}\.){3}\d{1,3}$/ },
  { kind: "ssn", re: /^\d{3}-\d{2}-\d{4}$/ },
  // A phone number has to be punctuated or country-prefixed and carry 10-15
  // digits. A bare digit run is not enough: that shape is also every epoch
  // timestamp and half the id columns in existence.
  { kind: "phone", re: /^(\+\d{1,3}[\s.-]?)?(\(\d{2,4}\)|\d{2,4})[\s.-]\d{2,4}[\s.-]\d{2,6}$/ },
];

function luhn(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// A long digit run is only called a card number if it passes Luhn — otherwise
// every order id and account number trips the alarm.
function sniffPII(values: string[], type: ColType): PII | undefined {
  if (!values.length) return undefined;
  const probe = values.slice(0, 200);

  // Card numbers read as integers, so they are the one kind worth checking on
  // a numeric column — and only when Luhn agrees.
  if (type === "integer" || type === "text" || type === "category") {
    const cardHits = probe.filter((v) => {
      const d = v.replace(/[\s-]/g, "");
      return /^\d{13,19}$/.test(d) && luhn(d);
    }).length;
    if (cardHits / probe.length > 0.8) return "card";
  }

  // The rest are string shapes. A datetime or a plain number is never one of
  // them, and checking anyway is how a date column gets labelled a phone.
  if (type !== "text" && type !== "category") return undefined;

  for (const { kind, re } of PII_TESTS) {
    const hits = probe.filter((v) => {
      const s = v.trim();
      if (!re.test(s)) return false;
      if (kind === "phone") {
        const digits = s.replace(/\D/g, "").length;
        return digits >= 10 && digits <= 15;
      }
      return true;
    }).length;
    if (hits / probe.length > 0.8) return kind;
  }
  return undefined;
}

const DOT = "•";

export function mask(value: string, kind: PII): string {
  switch (kind) {
    case "email": {
      const [user, domain] = value.split("@");
      return `${user.slice(0, 2)}${DOT.repeat(Math.max(3, user.length - 2))}@${domain ?? ""}`;
    }
    case "card": {
      const d = value.replace(/[\s-]/g, "");
      return `${DOT.repeat(4)} ${DOT.repeat(4)} ${DOT.repeat(4)} ${d.slice(-4)}`;
    }
    case "ssn":
      return `${DOT.repeat(3)}-${DOT.repeat(2)}-${value.slice(-4)}`;
    case "ip": {
      const parts = value.split(".");
      return `${parts[0]}.${parts[1]}.${DOT}.${DOT}`;
    }
    case "phone":
      return `${value.slice(0, 3)}${DOT.repeat(5)}${value.slice(-2)}`;
  }
}

/* ---------- statistics ---------- */

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Freedman-Diaconis, clamped to a bin count a small card can actually draw.
function histogram(sorted: number[]): Bin[] {
  const n = sorted.length;
  if (!n) return [];
  const min = sorted[0];
  const max = sorted[n - 1];
  if (min === max) return [{ from: min, to: max, n }];
  const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
  const fd = iqr > 0 ? (2 * iqr) / Math.cbrt(n) : 0;
  const count = Math.max(6, Math.min(16, fd > 0 ? Math.ceil((max - min) / fd) : Math.ceil(Math.sqrt(n))));
  const width = (max - min) / count;
  const bins: Bin[] = Array.from({ length: count }, (_, i) => ({ from: min + i * width, to: min + (i + 1) * width, n: 0 }));
  for (const v of sorted) {
    const i = Math.min(count - 1, Math.floor((v - min) / width));
    bins[i].n++;
  }
  return bins;
}

function periodKey(t: number, period: "day" | "month" | "year"): string {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  if (period === "year") return String(y);
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  if (period === "month") return `${y}-${m}`;
  return `${y}-${m}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/* ---------- the profiler ---------- */

export function profile(table: Table, parseMs: number): Report {
  const { columns: names, rows } = table;
  const rowCount = rows.length;
  const columns: Column[] = [];
  const findings: Finding[] = [];

  let nullCells = 0;
  let inferMs = 0;
  let statMs = 0;

  for (let c = 0; c < names.length; c++) {
    const tInfer = performance.now();
    const raw: string[] = [];
    let nulls = 0;
    for (let r = 0; r < rowCount; r++) {
      const v = rows[r][c];
      if (v === null || isNullToken(v)) nulls++;
      else raw.push(v);
    }
    nullCells += nulls;

    const freq = new Map<string, number>();
    for (const v of raw) freq.set(v, (freq.get(v) ?? 0) + 1);
    const distinct = freq.size;

    const col: Column = {
      name: names[c],
      type: "empty",
      count: raw.length,
      nulls,
      nullPct: rowCount ? (nulls / rowCount) * 100 : 0,
      distinct,
      isKey: raw.length > 0 && distinct === raw.length && nulls === 0 && rowCount > 1,
      sample: raw.slice(0, 4),
    };

    if (!raw.length) {
      columns.push(col);
      findings.push({ level: "warn", column: col.name, text: "entirely empty — no values to profile" });
      inferMs += performance.now() - tInfer;
      continue;
    }

    // Types are voted on, not sampled from the first row: one stray value
    // that survived the null tokens shouldn't flip a numeric column to text,
    // so a type wins the column at 95% agreement.
    const step = Math.ceil(raw.length / 20000);
    const probe = step > 1 ? raw.filter((_, i) => i % step === 0) : raw;
    let ints = 0;
    let nums = 0;
    let times = 0;
    let bools = 0;
    let timeFormat = "";
    let numFormat = "";
    for (const v of probe) {
      const s = v.trim();
      const low = s.toLowerCase();
      if (TRUE.has(low) || FALSE.has(low)) bools++;
      const tm = toTime(s);
      if (tm) {
        times++;
        timeFormat ||= tm.format;
      }
      if (CURRENCY.test(s)) numFormat ||= "currency";
      else if (PERCENT.test(s)) numFormat ||= "percent";
      const n = toNumber(s);
      if (n !== null && (DECIMAL.test(s) || CURRENCY.test(s) || PERCENT.test(s) || INTEGER.test(s))) {
        nums++;
        if (Number.isInteger(n)) ints++;
      }
    }
    const share = (x: number) => x / probe.length;

    if (share(bools) >= 0.95 && distinct <= 3) col.type = "boolean";
    else if (share(times) >= 0.95) {
      col.type = "datetime";
      col.format = timeFormat;
    } else if (share(nums) >= 0.95) {
      col.type = share(ints) >= 0.99 ? "integer" : "decimal";
      if (numFormat) col.format = numFormat;
    } else if (distinct <= Math.max(12, rowCount * 0.05) && distinct < raw.length) col.type = "category";
    else col.type = "text";
    col.pii = sniffPII(raw, col.type);
    inferMs += performance.now() - tInfer;

    const tStat = performance.now();
    if (col.type === "integer" || col.type === "decimal") {
      const vals: number[] = [];
      for (const v of raw) {
        const n = toNumber(v);
        if (n !== null) vals.push(n);
      }
      vals.sort((a, b) => a - b);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      col.min = vals[0];
      col.max = vals[vals.length - 1];
      col.mean = mean;
      col.median = quantile(vals, 0.5);
      col.p95 = quantile(vals, 0.95);
      col.stdev = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
      const q1 = quantile(vals, 0.25);
      const q3 = quantile(vals, 0.75);
      const iqr = q3 - q1;
      // A low-cardinality integer column is ordinal, not continuous: 1.5xIQR
      // on {1..7} calls the top bucket an anomaly, which tells nobody anything.
      col.outliers = iqr > 0 && distinct > 12 ? vals.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length : 0;

      // A few whales stretch the axis until every real bar is one pixel tall.
      // When the tails own most of the range, bin the middle 98% and say so —
      // the outlier count above is what reports the tail.
      const p1 = quantile(vals, 0.01);
      const p99 = quantile(vals, 0.99);
      if (p99 > p1 && col.max! - col.min! > 3 * (p99 - p1)) {
        col.bins = histogram(vals.filter((v) => v >= p1 && v <= p99));
        col.binsNote = "1st–99th percentile";
      } else {
        col.bins = histogram(vals);
      }

      // Discrete integers read better as ranked values than as bins.
      if (distinct <= 12) {
        col.top = [...freq.entries()]
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([value, n]) => ({ value, n }));
      }
    } else if (col.type === "datetime") {
      const ts: number[] = [];
      for (const v of raw) {
        const tm = toTime(v.trim());
        if (tm) ts.push(tm.t);
      }
      ts.sort((a, b) => a - b);
      col.tMin = ts[0];
      col.tMax = ts[ts.length - 1];
      const spanDays = (col.tMax - col.tMin) / 86400000;
      const period = spanDays > 1200 ? "year" : spanDays > 70 ? "month" : "day";
      col.period = period;
      const buckets = new Map<string, number>();
      for (const t of ts) {
        const k = periodKey(t, period);
        buckets.set(k, (buckets.get(k) ?? 0) + 1);
      }
      col.byPeriod = [...buckets.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => a.key.localeCompare(b.key));
    } else {
      col.top = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, n]) => ({ value, n }));
      let minLen = Infinity;
      let maxLen = 0;
      for (const v of raw) {
        if (v.length < minLen) minLen = v.length;
        if (v.length > maxLen) maxLen = v.length;
      }
      col.minLen = minLen;
      col.maxLen = maxLen;
    }
    statMs += performance.now() - tStat;

    columns.push(col);
  }

  const tDup = performance.now();
  const seen = new Set<string>();
  let dupRows = 0;
  for (const r of rows) {
    const k = r.join("");
    if (seen.has(k)) dupRows++;
    else seen.add(k);
  }
  const dupMs = performance.now() - tDup;

  /* ---------- findings ---------- */

  if (dupRows) {
    findings.push({
      level: "warn",
      text: `${dupRows.toLocaleString()} duplicate row${dupRows === 1 ? "" : "s"} — identical across every column`,
    });
  }

  for (const col of columns) {
    if (col.pii) {
      findings.push({
        level: "warn",
        column: col.name,
        text: `looks like ${col.pii === "card" ? "card numbers (Luhn-valid)" : col.pii} — masked in every preview below`,
      });
    }
    if (col.nullPct >= 20) findings.push({ level: "warn", column: col.name, text: `${col.nullPct.toFixed(0)}% null — too sparse to trust` });
    else if (col.nullPct > 0) findings.push({ level: "info", column: col.name, text: `${col.nullPct.toFixed(1)}% null (${col.nulls.toLocaleString()} rows)` });
    if (col.outliers) {
      findings.push({
        level: "warn",
        column: col.name,
        text: `${col.outliers.toLocaleString()} outlier${col.outliers === 1 ? "" : "s"} past 1.5×IQR — max ${fmtNum(col.max!)} against a median of ${fmtNum(col.median!)}`,
      });
    }
    if (col.isKey) findings.push({ level: "info", column: col.name, text: "unique and never null — candidate primary key" });
    if (col.type === "category" && col.top?.length) {
      const pct = (col.top[0].n / col.count) * 100;
      if (pct >= 60) findings.push({ level: "warn", column: col.name, text: `skewed — ${pct.toFixed(0)}% of rows are "${col.top[0].value}"` });
    }
    if (col.type === "datetime" && col.tMax && col.tMax > Date.now()) {
      findings.push({ level: "warn", column: col.name, text: "contains dates in the future" });
    }
  }
  if (!findings.length) findings.push({ level: "info", text: "no quality issues found — a clean dataset" });

  const stages = [
    { name: "parse", ms: parseMs },
    { name: "infer types", ms: inferMs },
    { name: "compute stats", ms: statMs },
    { name: "dedupe scan", ms: dupMs },
  ];

  return {
    rowCount,
    colCount: names.length,
    cells: rowCount * names.length,
    nullCells,
    dupRows,
    columns,
    findings: findings.sort((a, b) => (a.level === b.level ? 0 : a.level === "warn" ? -1 : 1)),
    stages,
  };
}

export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: abs < 1 ? 3 : 2 });
}
