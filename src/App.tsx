import { useEffect, useMemo, useRef, useState } from "react";
import { profile, education, roles } from "./data/profile";
import { KPIS, SPANS, skills, toolbox, techFrequency, allTechs, categoryCounts, STATUS_COLOR, type Skill, type Status } from "./dashboard/data";
import { CountUp, Gantt, Donut, Bars } from "./dashboard/charts";
import SimModal from "./SimModal";
import { SIMS } from "./sims";
import { useLive, relTime } from "./live";
import { openResume } from "./resume";

type View = "overview" | "experience" | "projects" | "skills" | "contact";

const NAV: { key: View; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "◫" },
  { key: "experience", label: "Experience", icon: "▤" },
  { key: "projects", label: "Personal Projects", icon: "✦" },
  { key: "skills", label: "Skills", icon: "❋" },
  { key: "contact", label: "Contact", icon: "✉" },
];

// the photo subtly shifts and tilts toward the cursor — a gaze that follows
function Avatar() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        // saturate quickly so even nearby movement reads as a glance
        const k = Math.min(1, d / 260);
        setT({ x: (dx / d) * k, y: (dy / d) * k });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // eye positions over the photo (fraction of the frame) — pupils track the cursor
  const EYES = [
    { left: 42.0, top: 45.0 },
    { left: 61.5, top: 45.0 },
  ];
  return (
    <div
      ref={ref}
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] lg:h-auto lg:w-full lg:aspect-square lg:rounded-2xl lg:shadow-[4px_4px_0_var(--color-ink)]"
    >
      <img src="/surya.jpg" alt="Surya Singh" className="h-full w-full object-cover" />
      {EYES.map((e, i) => (
        <span
          key={i}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            left: `${e.left}%`,
            top: `${e.top}%`,
            width: "8.5%",
            height: "5.5%",
            transform: "translate(-50%, -50%)",
            background: "#e9e0d0",
            boxShadow: "inset 0 0 1px rgba(0,0,0,0.55)",
          }}
        >
          <span
            className="rounded-full transition-transform duration-100 ease-out"
            style={{
              width: "58%",
              height: "66%",
              background: "#241f1c",
              transform: `translate(${t.x * 3.4}px, ${t.y * 2.2}px)`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  const w = 140, h = 28;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - (v / max) * (h - 8)}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke="var(--color-clay-deep)" strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => v > 0 && (
        <circle key={i} cx={(i / (values.length - 1)) * w} cy={h - 3 - (v / max) * (h - 8)} r="2" fill="var(--color-ink)" />
      ))}
    </svg>
  );
}

const BASIS_STYLE: Record<string, string> = {
  "by profession": "bg-clay text-white",
  "by shipped projects": "bg-moss text-ink",
  published: "bg-violet text-ink",
};

function RolesStrip({ go }: { go: (v: View) => void }) {
  return (
    <section className="hud flyin p-5">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">
        the hats — and the evidence for each
      </h2>
      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {roles.map((r) => (
          <button
            key={r.title}
            onClick={() => go(r.goto)}
            className="cursor-pointer rounded-xl border-2 border-ink bg-linen p-3 text-left shadow-[3px_3px_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm font-extrabold leading-tight">{r.title}</p>
            <span className={`mt-1.5 inline-block rounded-full border border-ink px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${BASIS_STYLE[r.basis]}`}>
              {r.basis}
            </span>
            <p className="mt-1.5 text-[11px] font-semibold leading-snug text-faded">{r.proof}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

const FEATURED: { slug: string; tagline: string; links: { label: string; url: string }[] }[] = [
  {
    slug: "universalshelter",
    tagline: "Universal housing platform — donations, merch, live transparency dashboard.",
    links: [{ label: "visit site", url: "https://universalshelter.org" }],
  },
  {
    slug: "habicard",
    tagline: "Habit tracking on web, iOS, and your new-tab page.",
    links: [
      { label: "web", url: "https://habicard.com" },
      { label: "app store", url: "https://apps.apple.com/us/app/habicard/id6766097500" },
      { label: "chrome", url: "https://chromewebstore.google.com/detail/habicard-habit-tracker/bjmipgjaandcekaeookkfpacggnodoaj" },
    ],
  },
  {
    slug: "cc-fleet",
    tagline: "Your AI coding sessions as desktop pixel pets — see who needs you at a glance.",
    links: [
      { label: "github", url: "https://github.com/Surya5599/cc-fleet" },
      { label: "download", url: "https://github.com/Surya5599/cc-fleet/releases" },
    ],
  },
];

function Featured({ go }: { go: () => void }) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">✦ now shipping</h2>
        <button onClick={go} className="cursor-pointer text-[11px] font-bold text-clay-deep underline underline-offset-2">
          all projects →
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURED.map((f, i) => {
          const skill = skills.find((k) => k.slug === f.slug);
          if (!skill) return null;
          return (
            <div key={f.slug} className="hud flyin flex flex-col p-5" style={{ animationDelay: `${i * 90}ms` }}>
              <h3 className="font-display text-2xl font-extrabold">{skill.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/80">{f.tagline}</p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {f.links.map((l, j) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`pill px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider ${
                      j === 0 ? "bg-clay text-white" : "bg-oat text-ink"
                    }`}
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LiveStrip() {
  const live = useLive();
  if (!live.ok) return null;
  return (
    <section className="hud flyin flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-xs font-bold">
      <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-moss" /> live from github
      </span>
      {live.lastPush && <span>last commit {relTime(live.lastPush)}</span>}
      {live.commitsByDay && (
        <span className="flex items-center gap-2">
          <Spark values={live.commitsByDay} />
          <span className="text-faded">{live.recentCommits} commits · 14d</span>
        </span>
      )}
      {live.publicRepos !== undefined && <span>{live.publicRepos} public repos</span>}
      {live.rating && <span>HabiCard ★ {live.rating.avg.toFixed(1)}</span>}
      <span className="ml-auto text-[10px] font-semibold text-faded">
        synced {live.syncedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · no backend, fetched by your browser
      </span>
    </section>
  );
}

type PaletteItem = { label: string; hint: string; act: () => void };

function CommandPalette({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const hits = items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase())).slice(0, 9);
  const run = (it: PaletteItem) => { onClose(); it.act(); };
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/40 pt-[18vh]" onMouseDown={onClose}>
      <div className="hud w-full max-w-md overflow-hidden !rounded-2xl bg-linen" onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(hits.length - 1, i + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            if (e.key === "Enter" && hits[idx]) run(hits[idx]);
            if (e.key === "Escape") onClose();
          }}
          placeholder="Jump to anything… (views, projects, demos)"
          aria-label="Command palette"
          className="w-full border-b-2 border-ink bg-linen px-4 py-3 text-sm font-semibold focus:outline-none"
        />
        <div className="max-h-72 overflow-y-auto py-1.5">
          {hits.map((it, i) => (
            <button
              key={it.label}
              onClick={() => run(it)}
              onMouseEnter={() => setIdx(i)}
              className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm font-bold ${i === idx ? "bg-clay/25" : ""}`}
            >
              {it.label}
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-faded">{it.hint}</span>
            </button>
          ))}
          {hits.length === 0 && <p className="px-4 py-3 text-sm text-faded">Nothing matches.</p>}
        </div>
        <p className="border-t border-oat px-4 py-1.5 text-[10px] font-bold text-faded">↑↓ navigate · ⏎ go · esc close</p>
      </div>
    </div>
  );
}

function Card({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`hud flyin p-5 ${className}`}>
      {(title || aside) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pill cursor-pointer px-3 py-1 text-[11px] font-extrabold ${on ? "bg-moss text-ink" : "bg-linen text-faded"}`}
    >
      {children}
    </button>
  );
}

/* ---------------- views ---------------- */

function Overview({ go }: { go: (v: View) => void }) {
  const [role, setRole] = useState<number | null>(null);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <Card key={k.label} className="!p-4" >
            <p className="font-display text-4xl font-extrabold text-ink" style={{ animationDelay: `${i * 80}ms` }}>
              <CountUp to={k.value} suffix={k.suffix} />
            </p>
            <p className="mt-1 text-xs font-semibold text-faded">{k.label}</p>
          </Card>
        ))}
      </div>
      <RolesStrip go={go} />
      <Featured go={() => go("projects")} />
      <LiveStrip />
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <Card title="career timeline" aside={<button onClick={() => go("experience")} className="text-[11px] font-bold text-clay-deep underline underline-offset-2 cursor-pointer">open experience →</button>}>
          <Gantt selected={role} onSelect={(i) => setRole(role === i ? null : i)} />
          {role !== null && (
            <p className="mt-2 rounded-xl border-2 border-ink bg-oat p-3 text-sm leading-relaxed">
              <strong>{SPANS[role].role} @ {SPANS[role].company}</strong> — {SPANS[role].jobs[0].bullets[0]}
            </p>
          )}
        </Card>
        <Card title="projects by status" aside={<button onClick={() => go("projects")} className="text-[11px] font-bold text-clay-deep underline underline-offset-2 cursor-pointer">open projects →</button>}>
          <Donut filter={null} onSelect={() => go("projects")} />
          <p className="mt-3 text-sm leading-relaxed text-faded">
            {skills.length} personal builds across mobile, web, systems, and hardware — five of them
            run live in this site.
          </p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="toolbox coverage by category">
          <Bars
            items={categoryCounts.map((c) => ({ label: c.category, value: c.count, note: `${c.count} tools` }))}
            max={Math.max(...categoryCounts.map((c) => c.count))}
          />
        </Card>
        <Card title="summary">
          <p className="text-[15px] leading-relaxed text-ink/85">{profile.tagline}</p>
          <p className="mt-3 text-sm leading-relaxed text-faded">
            Currently: agentic data tooling at Oliver Wight — Claude agents & skills in production,
            client onboarding cut from weeks to days. Previously: enterprise BI at Infosys for
            10,000+ daily users. {education}.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Experience() {
  const [sel, setSel] = useState(SPANS.length - 1); // newest span
  const span = SPANS[sel];
  return (
    <div className="grid gap-4">
      <Card title="timeline — click a bar to inspect">
        <Gantt selected={sel} onSelect={setSel} />
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Card title="roles">
          <div className="space-y-2">
            {SPANS.map((s, i) => (
              <button
                key={i}
                onClick={() => setSel(i)}
                className={`pill block w-full cursor-pointer px-4 py-2.5 text-left text-sm font-bold ${sel === i ? "bg-clay text-white" : "bg-linen"}`}
              >
                {s.company}
                <span className={`block text-[11px] font-semibold ${sel === i ? "text-white/80" : "text-faded"}`}>
                  {s.role} · {s.period}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-faded">{education}</p>
        </Card>
        <Card title={`${span.role} @ ${span.company}`} aside={<span className="text-[11px] font-bold text-faded">{span.period}</span>}>
          <div className="space-y-5">
            {span.jobs.map((job) => (
              <div key={job.role + job.period}>
                {span.jobs.length > 1 && (
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-faded">
                    {job.role} · {job.period}
                  </p>
                )}
                <ul className="space-y-3">
                  {job.bullets.map((b) => (
                    <li key={b.slice(0, 32)} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/85">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full border border-ink bg-clay" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Projects() {
  const [status, setStatus] = useState<string | null>(null);
  const [tech, setTech] = useState<string | null>(null);
  const [sel, setSel] = useState<Skill | null>(null);
  const [simOpen, setSimOpen] = useState(false);

  const rows = useMemo(
    () =>
      skills.filter(
        (s) => (!status || s.status === status) && (!tech || s.tools.includes(tech)),
      ),
    [status, tech],
  );
  const sim = sel ? SIMS[sel.slug] : undefined;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[2fr_3fr]">
        <Card title="filter by status — click the donut">
          <Donut filter={status} onSelect={setStatus} />
        </Card>
        <Card title="filter by technology">
          <div className="flex flex-wrap gap-1.5">
            {allTechs.map((t) => (
              <Chip key={t} on={tech === t} onClick={() => setTech(tech === t ? null : t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <Card
          title={`projects grid — ${rows.length} of ${skills.length}`}
          aside={
            (status || tech) && (
              <button onClick={() => { setStatus(null); setTech(null); }} className="cursor-pointer text-[11px] font-bold text-clay-deep underline underline-offset-2">
                clear filters ✕
              </button>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-faded">
                  <th className="pb-2 pr-3">project</th>
                  <th className="pb-2 pr-3">status</th>
                  <th className="pb-2">stack</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.slug}
                    onClick={() => setSel(s)}
                    className={`cursor-pointer border-t-2 border-oat transition-colors hover:bg-oat ${sel?.slug === s.slug ? "bg-oat" : ""}`}
                  >
                    <td className="py-2.5 pr-3 font-bold">
                      {s.name} {SIMS[s.slug] && <span className="text-clay-deep">▶</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-extrabold" style={{ background: STATUS_COLOR[s.status as Status] }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-faded">{s.tools.slice(0, 3).join(" · ")}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-faded">No projects match these filters — clear one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={sel ? "detail" : "detail — select a row"}>
          {sel ? (
            <>
              <h3 className="font-display text-2xl font-extrabold">{sel.name}</h3>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-faded">{sel.tools.join(" · ")}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{sel.description}</p>
              <p className="mt-2 text-sm leading-relaxed text-faded">{sel.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {sim && (
                  <button onClick={() => setSimOpen(true)} className="pill cursor-pointer bg-clay px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white">
                    ▶ run live demo
                  </button>
                )}
                {sel.links?.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill bg-moss px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-ink">
                    {l.label} ↗
                  </a>
                ))}
                {sel.repo && (
                  <a href={sel.repo} target="_blank" rel="noreferrer" className="pill bg-linen px-4 py-2 text-xs font-extrabold uppercase tracking-wider">
                    code ↗
                  </a>
                )}
              </div>
              {sim && simOpen && (
                <SimModal title={sim.title} onClose={() => setSimOpen(false)}>
                  <sim.component />
                </SimModal>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-faded">
              Click any row to see the full story. Rows marked ▶ include a live, playable demo.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Skills() {
  const groups = Object.entries(toolbox);
  const [group, setGroup] = useState(groups[0][0]);
  const items = toolbox[group as keyof typeof toolbox];
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
      <Card title="categories">
        <div className="space-y-2">
          {groups.map(([g, its]) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`pill block w-full cursor-pointer px-4 py-2.5 text-left text-sm font-bold capitalize ${group === g ? "bg-violet text-ink" : "bg-linen"}`}
            >
              {g}
              <span className={`ml-2 text-[11px] font-semibold ${group === g ? "text-ink/70" : "text-faded"}`}>{its.length} tools</span>
            </button>
          ))}
        </div>
      </Card>
      <div className="grid gap-4">
        <Card title={`${group} — professional toolbox`}>
          <div className="flex flex-wrap gap-2">
            {items.map((t) => (
              <span key={t} className="rounded-full border-2 border-ink bg-oat px-3.5 py-1.5 text-sm font-bold">
                {t}
              </span>
            ))}
          </div>
        </Card>
        <Card title="where each tech shows up (personal projects)">
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {techFrequency.slice(0, 12).map((t) => (
              <div key={t.tech} className="flex items-baseline justify-between gap-3 border-b border-oat pb-1.5 text-sm">
                <span className="font-bold">{t.tech}</span>
                <span className="text-right text-xs text-faded">{t.projects.join(", ")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Brand marks as inline SVG — no icon dependency, inherits currentColor.
function GithubIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.086 1.838 1.238 1.838 1.238 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.334-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.814 1.102.814 2.222 0 1.606-.015 2.9-.015 3.294 0 .318.216.69.825.573C20.565 22.295 24 17.795 24 12.5 24 5.87 18.627.5 12 .5z" />
    </svg>
  );
}

function LinkedinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// Icon row under the name: github + linkedin.
function SocialLinks() {
  const links = [
    { href: profile.github, label: "GitHub", Icon: GithubIcon },
    { href: profile.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
  ];
  return (
    <div className="mt-1.5 flex items-center gap-2 lg:justify-center">
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          title={label}
          aria-label={label}
          className="rounded-lg border-2 border-transparent p-1 text-faded transition-colors hover:border-ink hover:bg-oat hover:text-ink"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

function Contact() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card title="reach surya">
        <p className="font-display text-3xl font-extrabold">Let's talk data.</p>
        <div className="mt-4 space-y-2 text-[15px] font-semibold">
          <p><a className="text-clay-deep underline decoration-2 underline-offset-4" href={`mailto:${profile.email}`}>{profile.email}</a></p>
          <p><a className="text-clay-deep underline decoration-2 underline-offset-4" href={profile.github} target="_blank" rel="noreferrer">{profile.github.replace("https://", "")}</a></p>
          <p><a className="text-clay-deep underline decoration-2 underline-offset-4" href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedin.replace("https://", "").replace(/\/$/, "")}</a></p>
          <p className="text-faded">{profile.location}</p>
        </div>
      </Card>
      <Card title="fastest way to evaluate him">
        <ul className="space-y-2.5 text-sm leading-relaxed text-ink/85">
          <li>1 — Skim the <strong>Overview</strong> KPIs and timeline.</li>
          <li>2 — Open <strong>Projects</strong> and run the two live demos (▶).</li>
          <li>3 — Email him. He responds fast.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ---------------- shell ---------------- */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [globalSim, setGlobalSim] = useState<{ slug: string; title: string } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourCaption, setTourCaption] = useState<string | null>(null);
  const tourCancel = useRef(false);

  // ⌘K palette + "sudo" easter egg
  useEffect(() => {
    let buf = "";
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-4);
        if (buf === "sudo") {
          buf = "";
          setGlobalSim({ slug: "rshell", title: "sudo: permission denied — but here, have a shell" });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function runTour() {
    if (tourCaption !== null) return;
    tourCancel.current = false;
    const step = async (caption: string, ms: number, act?: () => void) => {
      if (tourCancel.current) throw new Error("cancelled");
      act?.();
      setTourCaption(caption);
      await wait(ms);
    };
    try {
      await step("This is my career as a dashboard — every number on it is real.", 4000, () => setView("overview"));
      await step("5+ years of data engineering: Infosys → Oliver Wight, where I now build AI agents that run production pipelines.", 5000, () => setView("experience"));
      await step("8 personal builds. Filter them, click them — five of them actually run in this page.", 4500, () => setView("projects"));
      await step("Like this: my C++ shell from college, rebuilt to run in your browser…", 2500, () =>
        setGlobalSim({ slug: "rshell", title: "rshell — live during the tour" }));
      await step("Real parsing, real pipes, real exit codes.", 300);
      (window as unknown as { __rshellRun?: (c: string) => void }).__rshellRun?.("echo hello && echo from the tour");
      await step("Real parsing, real pipes, real exit codes.", 3000);
      (window as unknown as { __rshellRun?: (c: string) => void }).__rshellRun?.("(echo a; echo b) | wc");
      await step("Real parsing, real pipes, real exit codes.", 3500);
      await step("Everything here is generated from one data file — including the resume you can download.", 4000, () => {
        setGlobalSim(null);
        setView("contact");
      });
      await step("That's the 30-second version. The rest is yours to click. — Surya", 4000);
    } catch {
      setGlobalSim(null);
    } finally {
      setTourCaption(null);
    }
  }

  const paletteItems: PaletteItem[] = [
    ...NAV.map((n) => ({ label: n.label, hint: "view", act: () => setView(n.key) })),
    ...Object.keys(SIMS).map((slug) => ({
      label: `run ${skills.find((k) => k.slug === slug)?.name ?? slug} demo`,
      hint: "live demo",
      act: () => setGlobalSim({ slug, title: SIMS[slug].title }),
    })),
    ...skills.map((k) => ({ label: k.name, hint: "project", act: () => setView("projects") })),
    { label: "60-second tour", hint: "play", act: runTour },
    { label: "download resume (PDF)", hint: "print", act: openResume },
    { label: "email surya", hint: "contact", act: () => (window.location.href = `mailto:${profile.email}`) },
    { label: "github profile", hint: "link", act: () => window.open(profile.github, "_blank") },
    { label: "linkedin profile", hint: "link", act: () => window.open(profile.linkedin, "_blank") },
    { label: "habicard.com", hint: "link", act: () => window.open("https://habicard.com", "_blank") },
    { label: "universalshelter.org", hint: "link", act: () => window.open("https://universalshelter.org", "_blank") },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-4 p-4 sm:p-6 lg:flex-row">
      {/* sidebar */}
      <aside className="hud flex shrink-0 flex-row items-center gap-1 self-start p-3 lg:sticky lg:top-6 lg:w-56 lg:flex-col lg:items-stretch lg:gap-1.5 lg:p-4 max-lg:w-full max-lg:overflow-x-auto">
        <div className="mr-2 flex items-center gap-3 lg:mb-3 lg:mr-0 lg:w-full lg:flex-col lg:items-stretch lg:gap-3 lg:pt-1 lg:text-center">
          <Avatar />
          <div>
            <p className="font-display text-xl font-black leading-none lg:text-2xl">
              {profile.name.split(" ")[0]}<span className="text-clay-deep">.</span>
            </p>
            <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.15em] text-faded lg:block">
              personal analytics
            </p>
            <SocialLinks />
          </div>
        </div>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-2 text-left text-sm font-bold transition-colors ${
              view === n.key ? "border-2 border-ink bg-clay text-white shadow-[3px_3px_0_var(--color-ink)]" : "text-faded hover:bg-oat hover:text-ink"
            }`}
          >
            <span className="mr-2">{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div className="hidden flex-1 lg:block" />
        <button
          onClick={openResume}
          className="pill hidden cursor-pointer bg-clay px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white lg:block"
        >
          ⬇ resume (pdf)
        </button>
        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="hidden text-[11px] font-bold text-faded underline decoration-2 underline-offset-4 hover:text-ink lg:block"
        >
          github ↗
        </a>
      </aside>

      {/* main */}
      <main className="min-w-0 flex-1">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-3xl font-black capitalize sm:text-4xl">{NAV.find((n) => n.key === view)?.label ?? view}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={runTour}
              disabled={tourCaption !== null}
              className="pill cursor-pointer bg-amber/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider disabled:opacity-50"
            >
              ▶ 30-sec tour
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="pill hidden cursor-pointer bg-linen px-3.5 py-1.5 text-[11px] font-extrabold text-faded sm:block"
              title="Command palette"
            >
              ⌘K
            </button>
          </div>
        </header>
        {view === "overview" && <Overview go={setView} />}
        {view === "experience" && <Experience />}
        {view === "projects" && <Projects />}
        {view === "skills" && <Skills />}
        {view === "contact" && <Contact />}
        <footer className="py-6 text-center text-[11px] font-semibold text-faded">
          © {new Date().getFullYear()} {profile.name} — a dashboard about the person who builds dashboards.
          <span className="ml-2 text-faded/70">psst: try typing sudo.</span>
        </footer>
      </main>

      {globalSim && SIMS[globalSim.slug] && (
        <SimModal title={globalSim.title} onClose={() => setGlobalSim(null)}>
          {(() => {
            const C = SIMS[globalSim.slug].component;
            return <C />;
          })()}
        </SimModal>
      )}
      {paletteOpen && <CommandPalette items={paletteItems} onClose={() => setPaletteOpen(false)} />}
      {tourCaption && (
        <div className="fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
          <div className="hud flex max-w-xl items-center gap-4 bg-linen px-5 py-3.5 text-sm font-bold">
            <span>{tourCaption}</span>
            <button
              onClick={() => (tourCancel.current = true)}
              className="pill shrink-0 cursor-pointer bg-oat px-3 py-1 text-[10px] font-extrabold uppercase"
            >
              skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
