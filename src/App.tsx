import { useEffect, useRef, useState } from "react";
import { profile, skills, experience, type Skill } from "./data/profile";
import Chat from "./Chat";
import SimModal from "./SimModal";
import { SIMS } from "./sims";
import SignalCanvas from "./SignalCanvas";

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
      { threshold: 0.25 },
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

const CHAPTER_IDS = ["c0", "c1", "c2", "c3", "c4"];

function ChapterDots() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setActive(Math.round(p * (CHAPTER_IDS.length - 1)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 sm:flex" aria-label="Chapters">
      {CHAPTER_IDS.map((id, i) => (
        <a
          key={id}
          href={`#${id}`}
          aria-label={`Chapter ${i}`}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
            i === active ? "scale-125 bg-ink" : "bg-faded/40 hover:bg-faded"
          }`}
        />
      ))}
    </nav>
  );
}

function ProjectOverlay({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [simOpen, setSimOpen] = useState(false);
  const sim = SIMS[skill.slug];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/70 p-5 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-hairline bg-linen/95 p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={skill.name}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-3xl font-bold">{skill.name}</h3>
          <button onClick={onClose} className="cursor-pointer text-faded hover:text-ink" aria-label="Close">✕</button>
        </div>
        <p className="mt-1 font-mono text-xs text-faded">{skill.tools.join(" · ")}</p>
        <p className="mt-4 leading-relaxed text-ink/85">{skill.description}</p>
        <p className="mt-3 text-sm leading-relaxed text-faded">{skill.detail}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {sim && (
            <button onClick={() => setSimOpen(true)} className="cursor-pointer rounded-full bg-clay px-5 py-2 text-sm font-medium text-paper transition-transform hover:scale-105">
              ▶ Play it
            </button>
          )}
          {skill.repo && (
            <a href={skill.repo} target="_blank" rel="noreferrer" className="rounded-full border border-hairline px-5 py-2 text-sm text-faded transition-colors hover:border-clay hover:text-ink">
              Code ↗
            </a>
          )}
        </div>
        {sim && simOpen && (
          <SimModal title={sim.title} onClose={() => setSimOpen(false)}>
            <sim.component />
          </SimModal>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [openSkill, setOpenSkill] = useState<Skill | null>(null);

  return (
    <>
      <SignalCanvas />
      <ChapterDots />

      {/* corner idents */}
      <header className="fixed left-5 top-5 z-40 font-mono text-xs text-faded sm:left-8">
        {profile.name.toLowerCase().replace(" ", ".")} — {profile.location.toLowerCase()}
      </header>
      <a
        href={profile.github}
        target="_blank"
        rel="noreferrer"
        className="fixed right-5 top-5 z-40 font-mono text-xs text-faded transition-colors hover:text-ink sm:right-8"
      >
        github ↗
      </a>

      <main>
        {/* 00 — noise */}
        <section id="c0" className="flex min-h-[140vh] items-center">
          <div className="mx-auto w-full max-w-5xl px-6 pb-40">
            <Reveal>
              <p className="tick font-mono text-xs tracking-[0.3em] text-faded">00 / NOISE</p>
              <h1 className="mt-6 font-display text-6xl font-extrabold leading-[0.98] sm:text-[7.5rem]">
                Most data
                <br />
                is noise.
              </h1>
              <p className="mt-8 font-mono text-sm text-faded">scroll — watch it resolve ↓</p>
            </Reveal>
          </div>
        </section>

        {/* 01 — signal */}
        <section id="c1" className="flex min-h-[150vh] items-center">
          <div className="mx-auto w-full max-w-5xl px-6">
            <Reveal>
              <p className="tick font-mono text-xs tracking-[0.3em] text-clay">01 / SIGNAL</p>
              <h2 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.02] sm:text-7xl">
                I find the signal.
              </h2>
              <p className="mt-6 w-fit max-w-xl rounded-lg bg-paper/60 text-lg leading-relaxed text-ink/80 backdrop-blur-sm">
                Data engineer, 4+ years. Pipelines, models, and dashboards — and lately, AI agents
                that run them on their own.
              </p>
              <p className="mt-8 w-fit rounded-md bg-paper/60 font-mono text-xs leading-loose text-faded backdrop-blur-sm">
                10,000+ people read my dashboards daily · 500+ reports migrated · 16× faster
                retrieval · onboarding: weeks → days
              </p>
            </Reveal>
          </div>
        </section>

        {/* 02 — three traces */}
        <section id="c2" className="flex min-h-[170vh] items-center">
          <div className="mx-auto w-full max-w-5xl px-6">
            <Reveal>
              <p className="tick font-mono text-xs tracking-[0.3em] text-clay">02 / TRACES</p>
              <h2 className="mt-6 font-display text-5xl font-bold leading-[1.02] sm:text-7xl">
                Every role,
                <br />a cleaner wave.
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {experience.map((job, i) => (
                <Reveal key={job.company + job.period} delay={i * 110}>
                  <div className="rounded-2xl border border-hairline bg-paper/60 p-5 backdrop-blur-md transition-colors hover:border-clay/60">
                    <p className="font-mono text-[11px] text-faded">{job.period}</p>
                    <h3 className="mt-2 font-display text-xl font-bold">{job.company}</h3>
                    <p className="text-sm text-faded">{job.role}</p>
                    <p className="mt-3 text-sm leading-relaxed text-ink/80">{job.bullets[0]}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — emissions (projects) */}
        <section id="c3" className="flex min-h-[170vh] items-center">
          <div className="mx-auto w-full max-w-5xl px-6 pt-64">
            <Reveal>
              <p className="tick font-mono text-xs tracking-[0.3em] text-violet">03 / EMISSIONS</p>
              <h2 className="mt-6 font-display text-5xl font-bold leading-[1.02] sm:text-7xl">
                The signal
                <br />
                builds things.
              </h2>
              <p className="mt-5 max-w-lg text-faded">
                {skills.length} personal builds — apps, systems, hardware. Tap a node. Two of them
                run right here.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-10 flex flex-wrap gap-2.5">
                {skills.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => setOpenSkill(s)}
                    className="cursor-pointer rounded-full border border-hairline bg-paper/60 px-4 py-2 font-mono text-xs text-ink/85 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-violet hover:text-ink"
                  >
                    {SIMS[s.slug] ? "▶ " : ""}
                    {s.name}
                  </button>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* 04 — the orb */}
        <section id="c4" className="min-h-[170vh]">
          <div className="h-[70vh]" aria-hidden />
          <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6">
            <div className="sm:grid sm:grid-cols-2 sm:items-center sm:gap-12">
              <Reveal>
                <p className="tick font-mono text-xs tracking-[0.3em] text-amber">04 / VOICE</p>
                <h2 className="mt-6 font-display text-5xl font-bold leading-[1.02] sm:text-7xl">
                  The signal
                  <br />
                  answers.
                </h2>
                <p className="mt-5 max-w-md leading-relaxed text-faded">
                  Everything you just scrolled through, condensed into an AI. Ask it what I've
                  built, where I've worked, whether I can help you — it only knows the truth.
                </p>
                <p className="mt-8 font-mono text-xs text-faded">
                  <a className="transition-colors hover:text-ink" href={`mailto:${profile.email}`}>{profile.email}</a>
                  {"  ·  "}
                  <a className="transition-colors hover:text-ink" href={profile.github} target="_blank" rel="noreferrer">github</a>
                </p>
              </Reveal>
              <Reveal delay={140}>
                <Chat />
              </Reveal>
            </div>
            <p className="mt-24 pb-10 text-center font-mono text-[11px] text-faded">
              © {new Date().getFullYear()} {profile.name} — noise in, signal out.
            </p>
          </div>
        </section>
      </main>

      {openSkill && <ProjectOverlay skill={openSkill} onClose={() => setOpenSkill(null)} />}
    </>
  );
}
