import { useEffect, useState } from "react";

// Renders the real Jupyter notebooks from the public Data_Analysis_Portfolio
// repo — markdown, code, text outputs, and matplotlib charts (base64 PNGs) —
// fetched live from GitHub at open time.

const REPO = "https://raw.githubusercontent.com/Surya5599/Data_Analysis_Portfolio/main";
const NOTEBOOKS = [
  { file: "eda.ipynb", label: "eda.ipynb — exploratory analysis" },
  { file: "analysis.ipynb", label: "analysis.ipynb — modeling" },
];

type Output = { text?: string; png?: string };
type Cell = { kind: "markdown" | "code"; source: string; outputs: Output[] };

const cache = new Map<string, Cell[]>();

function joinSource(src: string | string[]): string {
  return Array.isArray(src) ? src.join("") : src ?? "";
}

function parseNotebook(nb: unknown): Cell[] {
  const raw = (nb as { cells?: unknown[] })?.cells ?? [];
  const cells: Cell[] = [];
  for (const c of raw as Record<string, unknown>[]) {
    const kind = c.cell_type === "markdown" ? "markdown" : c.cell_type === "code" ? "code" : null;
    if (!kind) continue;
    const source = joinSource(c.source as string | string[]).trim();
    const outputs: Output[] = [];
    for (const o of (c.outputs as Record<string, unknown>[] | undefined) ?? []) {
      const data = o.data as Record<string, string | string[]> | undefined;
      if (data?.["image/png"]) {
        outputs.push({ png: joinSource(data["image/png"]).replace(/\n/g, "") });
      } else if (data?.["text/plain"]) {
        outputs.push({ text: joinSource(data["text/plain"]) });
      } else if (o.output_type === "stream") {
        outputs.push({ text: joinSource(o.text as string | string[]) });
      } else if (o.output_type === "error") {
        outputs.push({ text: `${o.ename}: ${o.evalue}` });
      }
    }
    if (source || outputs.length) cells.push({ kind, source, outputs });
  }
  return cells;
}

// minimal markdown: headings, bold, inline code, bullets
function Md({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => {
        const t = l.trim();
        if (!t) return null;
        const inline = (s: string) =>
          s
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/`(.+?)`/g, '<code style="color:var(--color-clay);">$1</code>');
        if (/^#{1,6}\s?\S/.test(t)) {
          const level = t.match(/^#+/)![0].length;
          const body = t.replace(/^#+\s*/, "").replace(/\*+/g, "");
          return (
            <p
              key={i}
              className="font-bold text-pane-text"
              style={{ fontSize: level <= 2 ? 17 : 14, marginTop: 10 }}
              dangerouslySetInnerHTML={{ __html: inline(body) }}
            />
          );
        }
        if (/^[-*]\s/.test(t))
          return (
            <p key={i} className="pl-3 text-pane-text/85" dangerouslySetInnerHTML={{ __html: "• " + inline(t.slice(2)) }} />
          );
        return <p key={i} className="text-pane-text/85" dangerouslySetInnerHTML={{ __html: inline(t) }} />;
      })}
    </div>
  );
}

function CellView({ cell, index }: { cell: Cell; index: number }) {
  const [open, setOpen] = useState(false);
  if (cell.kind === "markdown") {
    return (
      <div className="border-l-2 border-pane-edge pl-3 text-[13px] leading-relaxed">
        <Md text={cell.source} />
      </div>
    );
  }
  const longSrc = cell.source.split("\n").length > 12;
  const src = open || !longSrc ? cell.source : cell.source.split("\n").slice(0, 12).join("\n");
  return (
    <div>
      <div className="rounded-md border border-pane-edge bg-black/30">
        <p className="flex items-center justify-between border-b border-pane-edge px-3 py-1 font-mono text-[10px] text-pane-dim">
          <span>In [{index}]</span>
          {longSrc && (
            <button onClick={() => setOpen((o) => !o)} className="cursor-pointer hover:text-pane-text">
              {open ? "collapse ▴" : `show all ${cell.source.split("\n").length} lines ▾`}
            </button>
          )}
        </p>
        <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-relaxed text-pane-text/90">{src}</pre>
      </div>
      {cell.outputs.map((o, i) =>
        o.png ? (
          <img
            key={i}
            src={`data:image/png;base64,${o.png}`}
            alt="notebook chart output"
            className="mt-2 max-w-full rounded-md border border-pane-edge bg-white"
          />
        ) : (
          <pre key={i} className="mt-2 max-h-40 overflow-auto rounded-md bg-black/20 p-2.5 font-mono text-[11px] text-pane-dim">
            {(o.text ?? "").slice(0, 1500)}
          </pre>
        ),
      )}
    </div>
  );
}

export default function NotebookSim() {
  const [file, setFile] = useState(NOTEBOOKS[0].file);
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(false);
    setCells(cache.get(file) ?? null);
    if (cache.has(file)) return;
    fetch(`${REPO}/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((nb) => {
        const parsed = parseNotebook(nb);
        cache.set(file, parsed);
        if (alive) setCells(parsed);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [file]);

  const charts = cells?.reduce((a, c) => a + c.outputs.filter((o) => o.png).length, 0) ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col font-sans text-[13px]">
      <div className="flex flex-wrap items-center gap-2 border-b border-pane-edge px-4 py-2">
        {NOTEBOOKS.map((n) => (
          <button
            key={n.file}
            onClick={() => setFile(n.file)}
            className={`cursor-pointer rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
              file === n.file
                ? "border-clay text-clay"
                : "border-pane-edge text-pane-dim hover:text-pane-text"
            }`}
          >
            {n.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-pane-dim">
          {cells ? `${cells.length} cells · ${charts} charts · fetched live from github` : ""}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!cells && !error && (
          <p className="caret font-mono text-xs text-pane-dim">pulling the real notebook from github</p>
        )}
        {error && (
          <p className="text-pane-dim">
            Couldn't load the notebook right now. View it on{" "}
            <a
              className="text-clay underline"
              href={`https://github.com/Surya5599/Data_Analysis_Portfolio/blob/main/${file}`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>{" "}
            instead.
          </p>
        )}
        {cells?.map((c, i) => <CellView key={`${file}-${i}`} cell={c} index={i + 1} />)}
      </div>
    </div>
  );
}
