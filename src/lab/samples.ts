// Sample datasets, generated deterministically and handed to the profiler as
// raw CSV text — so a sample takes exactly the same path as a dropped file.
// Each one hides a different set of problems worth catching.

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller, so the numeric columns have a shape a histogram can show
// instead of a flat uniform smear.
function normal(rng: () => number, mean: number, sd: number): number {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pick<T>(rng: () => number, weighted: [T, number][]): T {
  const total = weighted.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [v, w] of weighted) {
    r -= w;
    if (r <= 0) return v;
  }
  return weighted[weighted.length - 1][0];
}

function csv(header: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n");
}

function isoDay(base: number, dayOffset: number, rng: () => number): string {
  const t = base + dayOffset * 86400000 + Math.floor(rng() * 86400000);
  return new Date(t).toISOString().slice(0, 19) + "Z";
}

/* ---------- 1. e-commerce orders: the messy one ---------- */

function orders(): string {
  const rng = mulberry32(42);
  const base = Date.UTC(2025, 0, 1);
  const first = ["ana", "ben", "chris", "dev", "elena", "farid", "grace", "hugo", "iris", "jae", "kira", "luis"];
  const last = ["lopez", "shah", "obrien", "nakamura", "silva", "khan", "muller", "adeyemi"];
  const rows: (string | number)[][] = [];

  for (let i = 0; i < 1400; i++) {
    const f = first[Math.floor(rng() * first.length)];
    const l = last[Math.floor(rng() * last.length)];
    // long tail with a handful of genuine whales — the outlier finding is real
    const isWhale = rng() < 0.006;
    const amount = isWhale ? normal(rng, 4200, 900) : Math.exp(normal(rng, 3.9, 0.55));
    const channel = pick<string>(rng, [["web", 58], ["ios", 24], ["android", 12], ["partner-api", 6]]);
    rows.push([
      100000 + i,
      isoDay(base, Math.floor(rng() * 240), rng),
      `${f}.${l}${Math.floor(rng() * 90) + 10}@example.com`,
      `$${Math.max(4, amount).toFixed(2)}`,
      // deliberately skewed: one region dominates
      pick<string>(rng, [["us-west", 68], ["us-east", 17], ["eu-central", 11], ["apac", 4]]),
      channel,
      rng() < 0.037 ? "true" : "false",
      // sparse by design — a third of orders have no coupon at all
      rng() < 0.34 ? "" : `SAVE${Math.floor(rng() * 4) * 5 + 5}`,
      Math.max(1, Math.round(normal(rng, 2.4, 1.3))),
    ]);
  }
  // a replayed webhook batch: six rows duplicated verbatim
  for (let i = 0; i < 6; i++) rows.push([...rows[i * 37]]);

  return csv(
    ["order_id", "created_at", "customer_email", "amount", "region", "channel", "refunded", "coupon_code", "line_items"],
    rows,
  );
}

/* ---------- 2. sensor telemetry: epoch time and unit-suffixed values ---------- */

function sensors(): string {
  const rng = mulberry32(7);
  const start = Math.floor(Date.UTC(2026, 5, 1) / 1000);
  const rows: (string | number)[][] = [];
  const devices = ["rpi-a1", "rpi-a2", "rpi-b7", "esp32-c3"];

  for (let i = 0; i < 2600; i++) {
    const device = devices[i % devices.length];
    const hour = (i / devices.length) % 24;
    // a real daily cycle, so the time-series chart has a shape
    const temp = normal(rng, 21 + 4 * Math.sin(((hour - 6) / 24) * 2 * Math.PI), 0.8);
    const stuck = rng() < 0.004; // a sensor that fails high
    rows.push([
      start + i * 600,
      device,
      stuck ? "88.4" : temp.toFixed(2),
      `${Math.round(normal(rng, 47, 9))}%`,
      // battery drains monotonically per device
      (100 - (i / 2600) * 62 + normal(rng, 0, 1.2)).toFixed(1),
      rng() < 0.02 ? "" : stuck ? "fault" : "ok",
    ]);
  }
  return csv(["reading_ts", "device_id", "temp_c", "humidity", "battery_pct", "status"], rows);
}

/* ---------- 3. habit log: small, clean, and personal ---------- */

function habits(): string {
  const rng = mulberry32(1312);
  const base = Date.UTC(2026, 2, 1);
  const names = ["read", "gym", "no-doomscroll", "write", "cold-shower"];
  const rows: (string | number)[][] = [];
  const streak: Record<string, number> = {};

  for (let day = 0; day < 120; day++) {
    for (const habit of names) {
      const done = rng() < (habit === "gym" ? 0.62 : 0.78);
      streak[habit] = done ? (streak[habit] ?? 0) + 1 : 0;
      rows.push([
        new Date(base + day * 86400000).toISOString().slice(0, 10),
        habit,
        done ? "yes" : "no",
        streak[habit],
        done ? Math.round(normal(rng, habit === "gym" ? 58 : 24, 11)) : "",
      ]);
    }
  }
  return csv(["log_date", "habit", "completed", "streak_days", "minutes"], rows);
}

export type Sample = { key: string; label: string; note: string; text: () => string };

export const SAMPLES: Sample[] = [
  {
    key: "orders",
    label: "e-commerce orders",
    note: "1,406 rows · PII, currency strings, a replayed webhook batch",
    text: orders,
  },
  {
    key: "sensors",
    label: "sensor telemetry",
    note: "2,600 rows · epoch seconds, unit suffixes, a sensor stuck high",
    text: sensors,
  },
  {
    key: "habits",
    label: "habit log",
    note: "600 rows · tidy long format, the shape HabiCard exports",
    text: habits,
  },
];
