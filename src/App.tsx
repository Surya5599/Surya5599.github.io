import { useEffect, useMemo, useRef, useState } from "react";
import { profile, education } from "./data/profile";
import { KPIS, SPANS, skills, toolbox, techFrequency, allTechs, categoryCounts, STATUS_COLOR, type Skill, type Status } from "./dashboard/data";
import { CountUp, Gantt, Donut, Bars } from "./dashboard/charts";
import SimModal from "./SimModal";
import { SIMS } from "./sims";

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
    { left: 42.6, top: 44.8 },
    { left: 58.8, top: 44.8 },
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
            width: "8%",
            height: "6.2%",
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
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <Card title="career timeline" aside={<button onClick={() => go("experience")} className="text-[11px] font-bold text-clay-deep underline underline-offset-2 cursor-pointer">open experience →</button>}>
          <Gantt selected={role} onSelect={(i) => setRole(role === i ? null : i)} />
          {role !== null && (
            <p className="mt-2 rounded-xl border-2 border-ink bg-oat p-3 text-sm leading-relaxed">
              <strong>{SPANS[role].job.role} @ {SPANS[role].job.company}</strong> — {SPANS[role].job.bullets[0]}
            </p>
          )}
        </Card>
        <Card title="projects by status" aside={<button onClick={() => go("projects")} className="text-[11px] font-bold text-clay-deep underline underline-offset-2 cursor-pointer">open projects →</button>}>
          <Donut filter={null} onSelect={() => go("projects")} />
          <p className="mt-3 text-sm leading-relaxed text-faded">
            {skills.length} personal builds across mobile, web, systems, and hardware — two of them
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
  const [sel, setSel] = useState(2); // newest first in SPANS index 2
  const job = SPANS[sel].job;
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
                {s.job.company}
                <span className={`block text-[11px] font-semibold ${sel === i ? "text-white/80" : "text-faded"}`}>
                  {s.job.role} · {s.job.period}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-faded">{education}</p>
        </Card>
        <Card title={`${job.role} @ ${job.company}`} aside={<span className="text-[11px] font-bold text-faded">{job.period}</span>}>
          <ul className="space-y-3">
            {job.bullets.map((b) => (
              <li key={b.slice(0, 32)} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/85">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full border border-ink bg-clay" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
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
                {sel.link && (
                  <a href={sel.link.url} target="_blank" rel="noreferrer" className="pill bg-moss px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-ink">
                    visit {sel.link.label} ↗
                  </a>
                )}
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

function Contact() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card title="reach surya">
        <p className="font-display text-3xl font-extrabold">Let's talk data.</p>
        <div className="mt-4 space-y-2 text-[15px] font-semibold">
          <p><a className="text-clay-deep underline decoration-2 underline-offset-4" href={`mailto:${profile.email}`}>{profile.email}</a></p>
          <p><a className="text-clay-deep underline decoration-2 underline-offset-4" href={profile.github} target="_blank" rel="noreferrer">{profile.github.replace("https://", "")}</a></p>
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

export default function App() {
  const [view, setView] = useState<View>("overview");
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
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl font-black capitalize sm:text-4xl">{NAV.find((n) => n.key === view)?.label ?? view}</h1>
          <p className="text-xs font-semibold text-faded">
            {profile.role} · {profile.location} · every number here is real
          </p>
        </header>
        {view === "overview" && <Overview go={setView} />}
        {view === "experience" && <Experience />}
        {view === "projects" && <Projects />}
        {view === "skills" && <Skills />}
        {view === "contact" && <Contact />}
        <footer className="py-6 text-center text-[11px] font-semibold text-faded">
          © {new Date().getFullYear()} {profile.name} — a dashboard about the person who builds dashboards.
        </footer>
      </main>
    </div>
  );
}
