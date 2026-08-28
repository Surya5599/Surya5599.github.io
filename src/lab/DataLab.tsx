import { useCallback, useMemo, useRef, useState } from "react";
import { Card, BandLabel } from "../ui";
import { parseAny, sniffDelimiter } from "./parse";
import { fmtNum, mask, profile, type Column, type Report } from "./profile";
import { SAMPLES } from "./samples";
import { Heatmap, Histogram, MiniBars, TimeSeries } from "./charts";
import { useLive, relTime } from "../live";

/* ================= shared bits ================= */

const TYPE_DOT: Record<Column["type"], string> = {
  integer: "var(--color-clay)",
  decimal: "var(--color-clay)",
  datetime: "var(--color-moss)",
  category: "var(--color-violet)",
  boolean: "var(--color-amber)",
  text: "var(--color-faded)",
  empty: "var(--color-faded)",
};

function TypeBadge({ col }: { col: Column }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-extrabold">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_DOT[col.type] }} />
      {col.type}
      {col.format && <span className="font-bold text-faded">· {col.format}</span>}
    </span>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="p-4">
      <p className="font-display text-3xl font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-faded">{label}</p>
      {note && <p className="mt-0.5 text-[11px] font-semibold text-faded">{note}</p>}
    </div>
  );
}

function StatPanel({ children }: { children: React.ReactNode }) {
  return <div className="hud-flat grid min-w-0 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 [&>*+*]:border-l-2 [&>*+*]:border-ink/12">{children}</div>;
}

/* ================= band 1: live public data ================= */

function LiveAnalytics() {
  const live = useLive();

  if (!live.ok) {
    return (
      <Card quiet title="live from public apis">
        <p className="text-sm font-semibold text-faded">
          Reaching GitHub and the App Store from your browser… if this stays put, the unauthenticated rate limit is
          spent (60 requests an hour, shared by your IP) and the page falls back to static content.
        </p>
      </Card>
    );
  }

  const langs = live.languages ?? [];
  const topRepos = [...(live.repos ?? [])].sort((a, b) => b.stars - a.stars || b.pushedAt - a.pushedAt).slice(0, 6);
  const peak = live.heatmapPeak;
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="grid min-w-0 gap-4">
      <StatPanel>
        <Stat label="public repos" value={fmtNum(live.publicRepos ?? 0)} />
        <Stat label="stars earned" value={fmtNum(live.stars ?? 0)} />
        <Stat
          label="commits"
          value={fmtNum(live.recentCommits ?? 0)}
          note={live.windowDays ? `across ${live.windowDays}d of events` : undefined}
        />
        <Stat label="languages" value={String(langs.length)} note={langs[0]?.name ? `most used: ${langs[0].name}` : undefined} />
        <Stat
          label="last push"
          value={live.lastPush ? relTime(live.lastPush) : "—"}
          note={live.rating ? `HabiCard ${live.rating.avg.toFixed(1)}★` : undefined}
        />
      </StatPanel>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[2fr_3fr]">
        <Card title="language mix" aside={<span className="text-[10px] font-bold text-faded">by repo</span>}>
          {langs.length ? (
            <MiniBars items={langs.slice(0, 7).map((l) => ({ label: l.name, n: l.repos }))} total={langs.reduce((a, l) => a + l.repos, 0)} />
          ) : (
            <p className="text-sm text-faded">No language data on the public repos.</p>
          )}
        </Card>

        <Card
          title="when the commits land"
          aside={
            peak ? (
              <span className="text-[10px] font-bold text-faded">
                peak: {dayName[peak.day]} {peak.hour}:00
              </span>
            ) : undefined
          }
        >
          {live.heatmap ? <Heatmap cells={live.heatmap} /> : <p className="text-sm text-faded">No push events in the window.</p>}
          <p className="mt-3 text-xs font-semibold leading-relaxed text-faded">
            Every public push event, bucketed by weekday and local hour. The GitHub events feed only reaches back{" "}
            {live.windowDays ?? 90} days, so this is a recent-habits picture, not a career one.
          </p>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card quiet title="most-starred repos">
          <div className="space-y-2.5">
            {topRepos.map((r) => (
              <a
                key={r.name}
                href={`https://github.com/Surya5599/${r.name}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-baseline justify-between gap-3 border-b-2 border-ink/8 pb-2 text-sm font-bold last:border-0 hover:text-clay-deep"
              >
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 text-xs font-semibold text-faded">
                  {r.language ?? "—"} · {r.stars}★ · pushed {relTime(new Date(r.pushedAt))}
                </span>
              </a>
            ))}
          </div>
        </Card>
        <Card quiet title="what the events were">
          <MiniBars
            items={(live.eventTypes ?? []).slice(0, 6).map((e) => ({ label: e.type, n: e.n }))}
            total={(live.eventTypes ?? []).reduce((a, e) => a + e.n, 0)}
          />
          <p className="mt-3 text-xs font-semibold leading-relaxed text-faded">
            Three endpoints, fetched in your browser, reshaped into the panels above: no server, no API key, nothing
            cached on my side.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ================= band 2: the visitor's own data ================= */

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_ROWS = 200_000;

type Loaded = { name: string; report: Report; delimiter: string; format: string; bytes: number; truncated: boolean };

function DropZone({ onText, busy }: { onText: (name: string, text: string) => void; busy: boolean }) {
  const [over, setOver] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      if (file.size > MAX_BYTES) {
        onText(file.name, "");
        return;
      }
      file.text().then((t) => onText(file.name, t));
    },
    [onText],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          over ? "border-clay-deep bg-clay/10" : "border-ink/25"
        }`}
      >
        <p className="font-display text-2xl font-extrabold">{busy ? "Profiling…" : "Drop a CSV, TSV, or JSON file"}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm font-semibold leading-relaxed text-faded">
          It is parsed and profiled in this tab. Nothing is uploaded, nothing is stored — there is no server behind
          this page to send it to.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="pill cursor-pointer bg-clay px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white">
            choose a file
          </button>
          <button
            onClick={() => setPasting((v) => !v)}
            className="text-[11px] font-bold text-faded underline decoration-2 underline-offset-4 hover:text-ink"
          >
            {pasting ? "hide paste box" : "or paste rows"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.json,.ndjson,.jsonl,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {pasting && (
        <div className="mt-3">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={"order_id,created_at,amount\n1001,2026-03-01,$42.10\n1002,2026-03-02,$18.00"}
            aria-label="Paste delimited or JSON rows"
            className="hud-flat w-full resize-y p-3 font-mono text-xs leading-relaxed focus:outline-none"
          />
          <button
            onClick={() => paste.trim() && onText("pasted rows", paste)}
            disabled={!paste.trim()}
            className="pill mt-2 cursor-pointer bg-clay px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white disabled:opacity-40"
          >
            profile this
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-faded">or try one</span>
        {SAMPLES.map((s) => (
          <button
            key={s.key}
            onClick={() => onText(s.label, s.text())}
            title={s.note}
            className="cursor-pointer rounded-full border-2 border-ink px-3 py-1 text-xs font-bold transition-colors hover:bg-oat"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SchemaTable({ report }: { report: Report }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-[10px] font-extrabold uppercase tracking-wider text-faded">
            <th className="py-2 pr-3">column</th>
            <th className="py-2 pr-3">inferred type</th>
            <th className="py-2 pr-3 text-right">null</th>
            <th className="py-2 pr-3 text-right">distinct</th>
            <th className="py-2 pr-3">sample</th>
          </tr>
        </thead>
        <tbody>
          {report.columns.map((c) => (
            <tr key={c.name} className="border-b-2 border-ink/8 align-top last:border-0">
              <td className="py-2.5 pr-3">
                <span className="font-mono text-xs font-bold">{c.name}</span>
                {c.isKey && <span className="ml-2 text-[10px] font-extrabold uppercase text-clay-deep">key</span>}
                {c.pii && <span className="ml-2 text-[10px] font-extrabold uppercase text-clay-deep">pii</span>}
              </td>
              <td className="py-2.5 pr-3">
                <TypeBadge col={c} />
              </td>
              <td className="py-2.5 pr-3 text-right font-semibold">
                {c.nulls ? (
                  <span className={c.nullPct >= 20 ? "text-clay-deep" : ""}>{c.nullPct.toFixed(1)}%</span>
                ) : (
                  <span className="text-faded">—</span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-right font-semibold">{c.distinct.toLocaleString()}</td>
              <td className="max-w-[260px] truncate py-2.5 pr-3 font-mono text-xs text-faded">
                {c.sample.map((v) => (c.pii ? mask(v, c.pii) : v)).join(" · ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ColumnChart({ col, rowCount }: { col: Column; rowCount: number }) {
  const detail =
    col.type === "integer" || col.type === "decimal"
      ? `min ${fmtNum(col.min!)} · median ${fmtNum(col.median!)} · p95 ${fmtNum(col.p95!)} · max ${fmtNum(col.max!)}`
      : col.type === "datetime"
        ? `${new Date(col.tMin!).toISOString().slice(0, 10)} → ${new Date(col.tMax!).toISOString().slice(0, 10)}`
        : `${col.distinct.toLocaleString()} distinct · ${col.count.toLocaleString()} filled`;

  return (
    <Card quiet>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs font-extrabold">{col.name}</span>
        <TypeBadge col={col} />
      </div>
      {(col.type === "integer" || col.type === "decimal") &&
        (col.distinct <= 12 && col.top ? (
          <MiniBars items={col.top.slice(0, 8).map((t) => ({ label: t.value, n: t.n }))} total={col.count} />
        ) : (
          col.bins && <Histogram bins={col.bins} />
        ))}
      {col.type === "datetime" && col.byPeriod && <TimeSeries points={col.byPeriod} />}
      {(col.type === "category" || col.type === "boolean" || col.type === "text") && col.top && (
        <MiniBars items={col.top.slice(0, 6).map((t) => ({ label: t.value, n: t.n }))} total={col.count} />
      )}
      <p className="mt-3 text-[11px] font-semibold leading-relaxed text-faded">{detail}</p>
      {col.outliers ? (
        <p className="mt-1 text-[11px] font-bold text-clay-deep">
          {col.outliers.toLocaleString()} outlier{col.outliers === 1 ? "" : "s"} past 1.5×IQR
        </p>
      ) : null}
      {col.binsNote && col.distinct > 12 ? (
        <p className="mt-1 text-[11px] font-semibold text-faded">histogram range: {col.binsNote}</p>
      ) : null}
      {col.type === "datetime" && col.period ? (
        <p className="mt-1 text-[11px] font-semibold text-faded">bucketed by {col.period} · {rowCount.toLocaleString()} rows</p>
      ) : null}
    </Card>
  );
}

// Which columns are worth drawing: a time axis first (it frames everything
// else), then the numerics, then the categories. Text and ids get a row in the
// schema table and nothing more.
function chartable(report: Report): Column[] {
  const order: Column["type"][] = ["datetime", "decimal", "integer", "category", "boolean"];
  // An id column is a near-unique integer packed densely into its own range —
  // 100000..101399 over 1,406 rows. A continuous measure can also be
  // near-unique (every order amount differs), so the density test is what
  // separates "identifier" from "measurement", and only integers qualify.
  const isIdSequence = (c: Column) =>
    c.type === "integer" &&
    c.count > 20 &&
    c.distinct > 0.9 * c.count &&
    c.max !== undefined &&
    c.min !== undefined &&
    c.max - c.min + 1 <= c.count * 1.5;

  return report.columns
    .filter(
      (c) =>
        c.count > 0 &&
        // a unique timestamp is a candidate key AND the time axis — the axis
        // wins, since it is the frame the other charts are read against
        !(c.isKey && c.type !== "datetime") &&
        !isIdSequence(c) &&
        (c.type !== "text" || (c.distinct <= 12 && !c.pii)),
    )
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
    .slice(0, 6);
}

function Profiler() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback((name: string, text: string) => {
    setError(null);
    if (!text.trim()) {
      setLoaded(null);
      setError(`Couldn't read "${name}" — it is empty, or larger than ${MAX_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setBusy(true);
    // let the "Profiling…" label paint before a synchronous pass over the rows
    setTimeout(() => {
      try {
        const t0 = performance.now();
        const table = parseAny(text);
        const parseMs = performance.now() - t0;
        if (!table.columns.length || !table.rows.length) {
          setLoaded(null);
          setError(`Parsed "${name}" but found no rows. If it is delimited text, it needs a header row.`);
          return;
        }
        const truncated = table.rows.length > MAX_ROWS;
        if (truncated) table.rows = table.rows.slice(0, MAX_ROWS);
        setLoaded({
          name,
          report: profile(table, parseMs),
          delimiter: table.format === "csv" ? sniffDelimiter(text) : "",
          format: table.format,
          bytes: new Blob([text]).size,
          truncated,
        });
      } catch (e) {
        setLoaded(null);
        setError(`Parsing "${name}" failed: ${e instanceof Error ? e.message : "unrecognized shape"}.`);
      } finally {
        setBusy(false);
      }
    }, 20);
  }, []);

  const charts = useMemo(() => (loaded ? chartable(loaded.report) : []), [loaded]);

  const delimiterName = (d: string) => (d === "\t" ? "tab" : d === "," ? "comma" : d === ";" ? "semicolon" : d === "|" ? "pipe" : d);

  return (
    <div className="grid min-w-0 gap-4">
      <Card title="your data">
        <DropZone onText={run} busy={busy} />
      </Card>

      {error && (
        <Card quiet>
          <p className="text-sm font-bold text-clay-deep">{error}</p>
        </Card>
      )}

      {loaded && (
        <>
          <StatPanel>
            <Stat label="rows" value={fmtNum(loaded.report.rowCount)} note={loaded.truncated ? `first ${MAX_ROWS.toLocaleString()} profiled` : undefined} />
            <Stat label="columns" value={String(loaded.report.colCount)} />
            <Stat
              label="null cells"
              value={`${loaded.report.cells ? ((loaded.report.nullCells / loaded.report.cells) * 100).toFixed(1) : "0"}%`}
              note={`${fmtNum(loaded.report.nullCells)} of ${fmtNum(loaded.report.cells)}`}
            />
            <Stat label="duplicate rows" value={fmtNum(loaded.report.dupRows)} />
            <Stat
              label="profiled in"
              value={`${loaded.report.stages.reduce((a, s) => a + s.ms, 0).toFixed(0)}ms`}
              note={`${fmtNum(Math.round(loaded.report.rowCount / Math.max(1, loaded.report.stages.reduce((a, s) => a + s.ms, 0) / 1000)))} rows/sec`}
            />
          </StatPanel>

          <Card quiet title="the pipeline that just ran">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-bold">
              <span className="rounded-full bg-oat px-2.5 py-1">
                {loaded.format === "csv" ? `delimiter sniffed: ${delimiterName(loaded.delimiter)}` : `${loaded.format} detected`}
              </span>
              {loaded.report.stages.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5">
                  <span className="text-faded">→</span>
                  <span className="rounded-full bg-oat px-2.5 py-1">
                    {s.name} <span className="font-extrabold text-clay-deep">{s.ms < 1 ? "<1" : s.ms.toFixed(0)}ms</span>
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-faded">
              {fmtNum(loaded.bytes)} bytes of {loaded.name} → {loaded.report.colCount} typed columns and{" "}
              {loaded.report.findings.length} quality finding{loaded.report.findings.length === 1 ? "" : "s"}, entirely
              in this tab.
            </p>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <Card title="inferred schema">
              <SchemaTable report={loaded.report} />
            </Card>
            <Card title="what looks wrong">
              <ul className="space-y-2.5">
                {loaded.report.findings.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: f.level === "warn" ? "var(--color-clay)" : "var(--color-moss)" }}
                    />
                    <span>
                      {f.column && <span className="font-mono text-xs font-extrabold">{f.column}</span>}
                      {f.column && " — "}
                      <span className={f.level === "warn" ? "font-semibold" : "font-semibold text-faded"}>{f.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {charts.length > 0 && (
            <div className="grid min-w-0 gap-4">
              <BandLabel
                aside={<span className="text-[10px] font-bold text-faded">chart picked from the inferred type</span>}
              >
                auto-charted
              </BandLabel>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {charts.map((c) => (
                  <ColumnChart key={c.name} col={c} rowCount={loaded.report.rowCount} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= the view ================= */

export default function DataLab() {
  return (
    <div className="grid min-w-0 gap-10">
      <div className="grid min-w-0 gap-4">
        <BandLabel aside={<span className="text-[10px] font-bold text-faded">github + app store, no backend</span>}>
          live data about me
        </BandLabel>
        <LiveAnalytics />
      </div>

      <div className="grid min-w-0 gap-4">
        <BandLabel aside={<span className="text-[10px] font-bold text-faded">nothing leaves your browser</span>}>
          now do it with yours
        </BandLabel>
        <Profiler />
      </div>
    </div>
  );
}
