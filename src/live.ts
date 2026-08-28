import { useEffect, useState } from "react";

// Live signals, fetched client-side — no backend, no keys.
// GitHub public API (60 req/hr/IP is plenty) + iTunes lookup for HabiCard.

export type Repo = { name: string; stars: number; language: string | null; pushedAt: number; createdAt: number; size: number };

export type Live = {
  ok: boolean;
  syncedAt?: Date;
  lastPush?: Date;
  commitsByDay?: number[]; // last 14 days, oldest first
  recentCommits?: number;
  publicRepos?: number;
  rating?: { avg: number; count: number };
  // deeper analytics, shaped for the Data Lab view
  repos?: Repo[];
  stars?: number;
  languages?: { name: string; repos: number; stars: number }[];
  heatmap?: number[]; // 7 x 24, weekday-major, local time
  heatmapPeak?: { day: number; hour: number; n: number };
  eventTypes?: { type: string; n: number }[];
  reposByYear?: { key: string; n: number }[];
  windowDays?: number; // how far back the event feed actually reached
};

export function relTime(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

type GhEvent = { type: string; created_at: string; payload?: { commits?: unknown[] } };
type GhRepo = {
  name: string;
  fork: boolean;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  created_at: string;
  size: number;
};

// One fetch per page load, shared by every component that asks. The Overview
// strip and the Data Lab both read this; without the cache, navigating between
// them would burn the unauthenticated rate limit for no reason.
let cache: Promise<Live> | null = null;

async function load(): Promise<Live> {
  const out: Live = { ok: false };

  try {
    const [userRes, eventsRes, reposRes] = await Promise.all([
      fetch("https://api.github.com/users/Surya5599"),
      fetch("https://api.github.com/users/Surya5599/events/public?per_page=100"),
      fetch("https://api.github.com/users/Surya5599/repos?per_page=100&sort=pushed"),
    ]);

    if (userRes.ok) {
      const u = await userRes.json();
      out.publicRepos = u.public_repos;
    }

    if (eventsRes.ok) {
      const events = (await eventsRes.json()) as GhEvent[];
      const pushes = events.filter((e) => e.type === "PushEvent");
      if (pushes.length) out.lastPush = new Date(pushes[0].created_at);

      const days = new Array(14).fill(0);
      const heat = new Array(7 * 24).fill(0);
      const now = Date.now();
      let total = 0;
      let oldest = now;

      for (const e of pushes) {
        const at = new Date(e.created_at);
        const n = e.payload?.commits?.length ?? 1;
        const age = Math.floor((now - at.getTime()) / 86400000);
        if (age >= 0 && age < 14) days[13 - age] += n;
        total += n;
        heat[at.getDay() * 24 + at.getHours()] += n;
        oldest = Math.min(oldest, at.getTime());
      }

      let peak = { day: 0, hour: 0, n: 0 };
      for (let i = 0; i < heat.length; i++) {
        if (heat[i] > peak.n) peak = { day: Math.floor(i / 24), hour: i % 24, n: heat[i] };
      }

      const types = new Map<string, number>();
      for (const e of events) types.set(e.type, (types.get(e.type) ?? 0) + 1);

      out.commitsByDay = days;
      out.recentCommits = total;
      out.heatmap = heat;
      out.heatmapPeak = peak.n ? peak : undefined;
      out.eventTypes = [...types.entries()]
        .map(([type, n]) => ({ type: type.replace(/Event$/, ""), n }))
        .sort((a, b) => b.n - a.n);
      out.windowDays = pushes.length ? Math.max(1, Math.round((now - oldest) / 86400000)) : undefined;
      out.ok = true;
      out.syncedAt = new Date();
    }

    if (reposRes.ok) {
      const raw = (await reposRes.json()) as GhRepo[];
      const repos: Repo[] = raw
        .filter((r) => !r.fork)
        .map((r) => ({
          name: r.name,
          stars: r.stargazers_count,
          language: r.language,
          pushedAt: Date.parse(r.pushed_at),
          createdAt: Date.parse(r.created_at),
          size: r.size,
        }));
      out.repos = repos;
      out.stars = repos.reduce((a, r) => a + r.stars, 0);

      const byLang = new Map<string, { repos: number; stars: number }>();
      for (const r of repos) {
        if (!r.language) continue;
        const hit = byLang.get(r.language) ?? { repos: 0, stars: 0 };
        hit.repos++;
        hit.stars += r.stars;
        byLang.set(r.language, hit);
      }
      out.languages = [...byLang.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.repos - a.repos || b.stars - a.stars);

      const byYear = new Map<string, number>();
      for (const r of repos) {
        const y = String(new Date(r.createdAt).getUTCFullYear());
        byYear.set(y, (byYear.get(y) ?? 0) + 1);
      }
      out.reposByYear = [...byYear.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => a.key.localeCompare(b.key));
      out.ok = true;
      out.syncedAt ??= new Date();
    }
  } catch {
    /* stay static */
  }

  try {
    const r = await fetch("https://itunes.apple.com/lookup?id=6766097500");
    if (r.ok) {
      const d = await r.json();
      const app = d.results?.[0];
      if (app?.averageUserRating) out.rating = { avg: app.averageUserRating, count: app.userRatingCount ?? 0 };
    }
  } catch {
    /* optional */
  }

  return out;
}

export function useLive(): Live {
  const [live, setLive] = useState<Live>({ ok: false });

  useEffect(() => {
    let alive = true;
    cache ??= load();
    cache.then((v) => {
      if (alive) setLive(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  return live;
}
