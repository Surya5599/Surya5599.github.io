import { useEffect, useRef, useState } from "react";
import { profile, skills, experience, toolbox, education, type Skill } from "./data/profile";
import Chat from "./Chat";
import SimModal from "./SimModal";
import { SIMS } from "./sims";
import HeroFlow from "./HeroFlow";

/* ---------- animation helpers ---------- */

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = to.toLocaleString() + suffix;
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ---------- pipeline stage scaffolding ---------- */

function Stage({
  num,
  name,
  title,
  aside,
  id,
  children,
}: {
  num: string;
  name: string;
  title: string;
  aside?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative pb-24 pl-8 sm:pl-16">
      <span className="node-pulse absolute -left-[7px] top-1 h-[15px] w-[15px] rounded-full border-2 border-clay bg-paper" />
      <Reveal>
        <p className="font-mono text-xs tracking-widest text-clay">
          stage {num} · {name}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-4xl font-medium sm:text-5xl">{title}</h2>
          {aside && <span className="font-mono text-xs text-faded">{aside}</span>}
        </div>
      </Reveal>
      <div className="mt-10">{children}</div>
    </section>
  );
}

/* ---------- project cards ---------- */

const STATUS_STYLE: Record<Skill["status"], string> = {
  active: "text-moss border-moss/40",
  shipped: "text-clay border-clay/40",
  archived: "text-faded border-hairline",
};

function ProjectCard({ skill, index }: { skill: Skill; index: number }) {
  const [open, setOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const sim = SIMS[skill.slug];
  return (
    <Reveal delay={(index % 2) * 90}>
      <article className="group h-full rounded-xl border border-hairline bg-linen p-6 transition-all duration-300 hover:-translate-y-1 hover:border-clay/50 hover:shadow-[0_12px_40px_-18px_rgba(103,232,249,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl font-medium">{skill.name}</h3>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${STATUS_STYLE[skill.status]}`}>
            {skill.status}
          </span>
        </div>
        <p className="mt-3 leading-relaxed text-ink/80">{skill.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skill.tools.map((t) => (
            <span key={t} className="rounded-md bg-oat px-2 py-0.5 font-mono text-[11px] text-faded">
              {t}
            </span>
          ))}
        </div>
        {open && <p className="mt-4 text-sm leading-relaxed text-ink/70">{skill.detail}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-xs">
          {sim && (
            <button
              onClick={() => setSimOpen(true)}
              className="cursor-pointer rounded-md bg-clay/10 px-3 py-1.5 text-clay transition-colors hover:bg-clay/20"
            >
              ▶ run simulation
            </button>
          )}
          <button onClick={() => setOpen((o) => !o)} className="cursor-pointer text-faded hover:text-ink">
            {open ? "less" : "more"}
          </button>
          {skill.repo && (
            <a
              href={skill.repo}
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-faded underline decoration-hairline underline-offset-4 hover:text-clay"
            >
              github ↗
            </a>
          )}
        </div>
        {sim && simOpen && (
          <SimModal title={sim.title} onClose={() => setSimOpen(false)}>
            <sim.component />
          </SimModal>
        )}
      </article>
    </Reveal>
  );
}

/* ---------- app ---------- */

const STATS = [
  { to: 4, suffix: "+", label: "years in data engineering" },
  { to: 10000, suffix: "+", label: "daily users on my dashboards" },
  { to: 500, suffix: "+", label: "reports migrated off legacy" },
  { to: 16, suffix: "×", label: "data retrieval speedup" },
];

export default function App() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* top bar */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3 sm:px-8">
          <a href="#top" className="font-display text-lg font-medium">
            Surya Singh
          </a>
          <div className="ml-auto flex gap-5 font-mono text-xs text-faded">
            <a className="hover:text-clay" href="#experience">experience</a>
            <a className="hover:text-clay" href="#projects">projects</a>
            <a className="hover:text-clay" href="#query">ask ai</a>
            <a className="hover:text-clay" href={profile.github} target="_blank" rel="noreferrer">github</a>
          </div>
        </div>
        <div
          className="h-[2px] origin-left bg-gradient-to-r from-clay via-violet to-amber transition-transform duration-150"
          style={{ transform: `scaleX(${progress})` }}
        />
      </nav>

      <main id="top" className="mx-auto max-w-5xl px-5 pt-24 sm:px-8">
        {/* hero */}
        <header className="pb-20 pt-12 sm:pt-20">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-faded">
              {profile.location.toLowerCase()} · {profile.role.toLowerCase()} · agentic ai
            </p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[1.02] sm:text-7xl">
              Raw data in.
              <br />
              <span className="bg-gradient-to-r from-clay via-violet to-amber bg-clip-text text-transparent">
                Decisions out.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">{profile.tagline}</p>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-10 h-56 overflow-hidden rounded-xl border border-hairline bg-linen sm:h-64">
              <HeroFlow />
            </div>
            <p className="mt-2 text-right font-mono text-[10px] text-faded">
              live: chaos → agent → ordered streams
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-hairline bg-linen p-4">
                  <p className="font-display text-3xl font-medium text-clay">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs leading-snug text-faded">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </header>

        {/* pipeline */}
        <div className="relative">
          {/* rail */}
          <div className="absolute bottom-0 left-0 top-0 w-px bg-hairline" aria-hidden>
            <span className="packet absolute -left-[2px] h-[5px] w-[5px] rounded-full bg-clay" />
            <span className="packet absolute -left-[2px] h-[5px] w-[5px] rounded-full bg-violet" style={{ animationDelay: "3s" }} />
            <span className="packet absolute -left-[2px] h-[5px] w-[5px] rounded-full bg-amber" style={{ animationDelay: "6s" }} />
          </div>

          <Stage num="01" name="transform" title="Experience" aside="4+ years · 2 companies" id="experience">
            <div className="space-y-6">
              {experience.map((job, i) => (
                <Reveal key={job.company + job.period} delay={i * 80}>
                  <article className="rounded-xl border border-hairline bg-linen p-6 transition-colors hover:border-clay/40">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-2xl font-medium">
                        {job.role} <span className="text-faded">@ {job.company}</span>
                      </h3>
                      <span className="font-mono text-xs text-faded">{job.period}</span>
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {job.bullets.map((b) => (
                        <li key={b.slice(0, 32)} className="flex gap-3 leading-relaxed text-ink/80">
                          <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-clay/50" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
              <Reveal>
                <p className="font-mono text-xs text-faded">{education}</p>
              </Reveal>
            </div>
          </Stage>

          <Stage num="02" name="load" title="Projects" aside={`${skills.length} shipped · 2 playable`} id="projects">
            <div className="grid gap-5 sm:grid-cols-2">
              {skills.map((s, i) => (
                <ProjectCard key={s.slug} skill={s} index={i} />
              ))}
            </div>
          </Stage>

          <Stage num="03" name="serve" title="Toolbox" id="toolbox">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(toolbox).map(([group, items], i) => (
                <Reveal key={group} delay={i * 70}>
                  <div className="rounded-xl border border-hairline bg-linen p-5">
                    <p className="font-mono text-xs tracking-widest text-clay">{group}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {items.map((t) => (
                        <span key={t} className="rounded-md bg-oat px-2.5 py-1 text-sm text-ink/80">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Stage>

          <Stage
            num="04"
            name="query"
            title="Ask the pipeline"
            aside="gemini · grounded in my real work"
            id="query"
          >
            <Reveal>
              <p className="max-w-2xl leading-relaxed text-ink/80">
                An AI that knows everything on this page — my roles, projects, and stack — and
                nothing it can't back up. Ask it what a recruiter would ask me.
              </p>
              <Chat />
            </Reveal>
          </Stage>
        </div>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-5 py-8 font-mono text-xs text-faded sm:px-8">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <a className="hover:text-clay" href={`mailto:${profile.email}`}>{profile.email}</a>
          <span className="ml-auto">vite + react · netlify · supabase</span>
        </div>
      </footer>
    </>
  );
}
