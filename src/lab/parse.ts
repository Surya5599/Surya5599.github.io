// Delimited-text and JSON parsing, in the browser, with no dependencies.
// The CSV path is a proper RFC 4180 state machine: quoted fields, escaped
// quotes, embedded newlines and CRLF all survive it.

export type Table = { columns: string[]; rows: (string | null)[][]; delimiter: string; format: "csv" | "json" | "ndjson" };

const NULL_TOKENS = new Set(["", "null", "nil", "none", "na", "n/a", "nan", "undefined", "-", "--", "?"]);

export function isNullToken(v: string | null): boolean {
  return v === null || NULL_TOKENS.has(v.trim().toLowerCase());
}

// Delimiter sniffing: count candidates outside quotes across the first few
// lines and keep the one whose per-line count is both highest and most stable.
// Consistency matters more than volume — prose commas beat a real pipe on
// raw count but never on variance.
export function sniffDelimiter(text: string): string {
  const candidates = [",", "\t", ";", "|"];
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 12);
  if (!lines.length) return ",";
  let best = ",";
  let bestScore = -Infinity;
  for (const d of candidates) {
    const counts = lines.map((l) => countOutsideQuotes(l, d));
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (mean < 1) continue;
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length;
    const score = mean - variance * 4;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

function countOutsideQuotes(line: string, d: string): number {
  let n = 0;
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') i++;
      else inQ = !inQ;
    } else if (c === d && !inQ) n++;
  }
  return n;
}

export function parseCSV(text: string, delimiter = sniffDelimiter(text)): Table {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  let quoted = false; // this field was quoted — so "" stays a value, not a null

  const pushField = () => {
    row.push(quoted ? field : field.trim());
    field = "";
    quoted = false;
  };
  const pushRow = () => {
    pushField();
    // skip the blank line that a trailing newline produces
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += c;
      continue;
    }
    if (c === '"') {
      inQ = true;
      quoted = true;
    } else if (c === delimiter) pushField();
    else if (c === "\n") pushRow();
    else if (c === "\r") {
      if (text[i + 1] === "\n") i++;
      pushRow();
    } else field += c;
  }
  if (field !== "" || row.length) pushRow();

  const header = rows.shift() ?? [];
  const columns = dedupeHeader(header.map((h, i) => h.trim() || `column_${i + 1}`));
  // ragged rows are normalized to the header width rather than dropped —
  // a short row is a data-quality finding, not a parse failure
  const width = columns.length;
  const norm = rows.map((r) => {
    const out: (string | null)[] = new Array(width).fill(null);
    for (let i = 0; i < width; i++) out[i] = i < r.length ? (isNullToken(r[i]) ? null : r[i]) : null;
    return out;
  });
  return { columns, rows: norm, delimiter, format: "csv" };
}

function dedupeHeader(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((n) => {
    const hit = seen.get(n);
    if (hit === undefined) {
      seen.set(n, 1);
      return n;
    }
    seen.set(n, hit + 1);
    return `${n}_${hit + 1}`;
  });
}

// JSON: an array of objects, a single object, or NDJSON. Nested values are
// flattened to dotted paths so {a:{b:1}} profiles as the column "a.b".
export function parseJSONish(text: string): Table | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  let records: unknown[] | null = null;
  let format: "json" | "ndjson" = "json";
  try {
    const v = JSON.parse(trimmed);
    records = Array.isArray(v) ? v : [v];
  } catch {
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
    const out: unknown[] = [];
    for (const l of lines) {
      try {
        out.push(JSON.parse(l));
      } catch {
        return null;
      }
    }
    if (!out.length) return null;
    records = out;
    format = "ndjson";
  }
  const flat = records.map((r) => flatten(r));
  const columns: string[] = [];
  for (const r of flat) for (const k of Object.keys(r)) if (!columns.includes(k)) columns.push(k);
  const rows = flat.map((r) =>
    columns.map((c) => {
      const v = r[c];
      if (v === undefined || v === null) return null;
      const s = String(v);
      return isNullToken(s) ? null : s;
    }),
  );
  return { columns, rows, delimiter: "", format };
}

function flatten(v: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (v === null || typeof v !== "object") {
    out[prefix || "value"] = v;
    return out;
  }
  if (Array.isArray(v)) {
    out[prefix || "value"] = JSON.stringify(v);
    return out;
  }
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === "object" && !Array.isArray(val)) flatten(val, key, out);
    else flatten(val, key, out);
  }
  return out;
}

// One entry point: try JSON first (it fails fast and unambiguously), fall
// back to delimited text.
export function parseAny(text: string): Table {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    const j = parseJSONish(text);
    if (j && j.columns.length) return j;
  }
  return parseCSV(text);
}
