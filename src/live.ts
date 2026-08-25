import { useEffect, useState } from "react";

// Live signals, fetched client-side — no backend, no keys.
// GitHub public API (60 req/hr/IP is plenty) + iTunes lookup for HabiCard.

export type Live = {
  ok: boolean;
  syncedAt?: Date;
  lastPush?: Date;
  commitsByDay?: number[]; // last 14 days, oldest first
  recentCommits?: number;
  publicRepos?: number;
  rating?: { avg: number; count: number };
};

export function relTime(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function useLive(): Live {
  const [live, setLive] = useState<Live>({ ok: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Live = { ok: false };
      try {
        const [userRes, eventsRes] = await Promise.all([
          fetch("https://api.github.com/users/Surya5599"),
          fetch("https://api.github.com/users/Surya5599/events/public?per_page=100"),
        ]);
        if (userRes.ok) {
          const u = await userRes.json();
          out.publicRepos = u.public_repos;
        }
        if (eventsRes.ok) {
          const events = (await eventsRes.json()) as { type: string; created_at: string; payload?: { commits?: unknown[] } }[];
          const pushes = events.filter((e) => e.type === "PushEvent");
          if (pushes.length) out.lastPush = new Date(pushes[0].created_at);
          const days = new Array(14).fill(0);
          const now = Date.now();
          let total = 0;
          for (const e of pushes) {
            const age = Math.floor((now - new Date(e.created_at).getTime()) / 86400000);
            const n = e.payload?.commits?.length ?? 1;
            if (age >= 0 && age < 14) days[13 - age] += n;
            total += n;
          }
          out.commitsByDay = days;
          out.recentCommits = total;
          out.ok = true;
          out.syncedAt = new Date();
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
      if (alive) setLive(out);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return live;
}
