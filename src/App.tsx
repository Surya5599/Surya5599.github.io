import { useEffect, useRef, useState } from "react";
import { profile, skills, experience, toolbox, education, type Skill } from "./data/profile";
import Chat from "./Chat";
import SimModal from "./SimModal";
import { SIMS } from "./sims";

/* ---------- motion ---------- */

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
      { threshold: 0.12 },
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
        const dur = 1200;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ---------- projects: quiet rows, no cards ---------- */

function ProjectRow({ skill }: { skill: Skill }) {
  const [open, setOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const sim = SIMS[skill.slug];
  return (
    <Reveal>
      <article className="group border-t border-hairline py-9 first:border-t-0">
        <div className="sm:grid sm:grid-cols-[1fr_2fr] sm:gap-10">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight">{skill.name}</h3>
            <p className="mt-1 text-sm text-faded">{skill.tools.slice(0, 3).join(" · ")}</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <p className="text-[17px] leading-relaxed text-ink/85">{skill.description}</p>
            {open && <p className="mt-3 text-[15px] leading-relaxed text-faded">{skill.detail}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-6 text-[15px]">
              {sim && (
                <button onClick={() => setSimOpen(true)} className="quiet-link cursor-pointer">
                  Run the simulation <span className="arrow">›</span>
                </button>
              )}
              <button onClick={() => setOpen((o) => !o)} className="quiet-link cursor-pointer">
                {open ? "Less" : "Learn more"} <span className="arrow">›</span>
              </button>
              {skill.repo && (
                <a href={skill.repo} target="_blank" rel="noreferrer" className="quiet-link">
                  View on GitHub <span className="arrow">↗</span>
                </a>
              )}
            </div>
          </div>
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
  { to: 4, suffix: "+", label: "years in data" },
  { to: 10000, suffix: "+", label: "daily dashboard users" },
  { to: 500, suffix: "+", label: "reports migrated" },
  { to: 16, suffix: "×", label: "retrieval speedup" },
];

export default function App() {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-hairline/60 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3 text-sm">
          <a href="#top" className="font-semibold tracking-tight">
            Surya Singh
          </a>
          <div className="flex gap-7 text-faded">
            <a className="transition-colors hover:text-ink" href="#work">Work</a>
            <a className="transition-colors hover:text-ink" href="#projects">Projects</a>
            <a className="transition-colors hover:text-ink" href="#ask">Ask</a>
            <a className="transition-colors hover:text-ink" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </nav>

      <main id="top">
        {/* hero */}
        <header className="mx-auto max-w-4xl px-6 pb-28 pt-44 text-center">
          <Reveal>
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">
              Data engineer.
            </h1>
            <h1 className="mt-1 font-display text-5xl font-semibold tracking-tight text-faded sm:text-7xl">
              Agent builder.
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink/80 sm:text-xl">
              {profile.tagline}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex items-center justify-center gap-7 text-[15px]">
              <a href="#projects" className="rounded-full bg-clay px-5 py-2.5 text-white transition-colors hover:bg-clay-deep">
                See the work
              </a>
              <a href="#ask" className="quiet-link">
                Ask my AI anything <span className="arrow">›</span>
              </a>
            </div>
          </Reveal>
        </header>

        {/* stats band */}
        <section className="bg-linen">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-y-10 px-6 py-16 text-center sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 70}>
                <p className="font-display text-4xl font-semibold tracking-tight">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-1.5 text-sm text-faded">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* work */}
        <section id="work" className="mx-auto max-w-4xl px-6 py-28">
          <Reveal>
            <p className="text-sm font-semibold text-faded">Work</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Four years of moving data.
              <br />
              <span className="text-faded">Now the agents do the moving.</span>
            </h2>
          </Reveal>
          <div className="mt-16">
            {experience.map((job) => (
              <Reveal key={job.company + job.period}>
                <article className="border-t border-hairline py-10 first:border-t-0 sm:grid sm:grid-cols-[1fr_2fr] sm:gap-10">
                  <header>
                    <h3 className="text-xl font-semibold tracking-tight">{job.role}</h3>
                    <p className="mt-1 text-faded">{job.company}</p>
                    <p className="mt-0.5 text-sm text-faded">{job.period}</p>
                  </header>
                  <ul className="mt-4 space-y-3 sm:mt-0">
                    {job.bullets.map((b) => (
                      <li key={b.slice(0, 32)} className="text-[16px] leading-relaxed text-ink/85">
                        {b}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
            <Reveal>
              <p className="border-t border-hairline pt-8 text-sm text-faded">{education}</p>
            </Reveal>
          </div>
        </section>

        {/* projects */}
        <section id="projects" className="bg-linen">
          <div className="mx-auto max-w-4xl px-6 py-28">
            <Reveal>
              <p className="text-sm font-semibold text-faded">Projects</p>
              <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Built end to end.
                <br />
                <span className="text-faded">Two of them, you can play with.</span>
              </h2>
            </Reveal>
            <div className="mt-14">
              {skills.map((s) => (
                <ProjectRow key={s.slug} skill={s} />
              ))}
            </div>
          </div>
        </section>

        {/* toolbox */}
        <section className="mx-auto max-w-4xl px-6 py-28">
          <Reveal>
            <p className="text-sm font-semibold text-faded">Toolbox</p>
          </Reveal>
          <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {Object.entries(toolbox).map(([group, items], i) => (
              <Reveal key={group} delay={i * 60}>
                <p className="text-sm font-semibold capitalize">{group}</p>
                <p className="mt-2 leading-relaxed text-faded">{items.join(", ")}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ask */}
        <section id="ask" className="bg-linen">
          <div className="mx-auto max-w-4xl px-6 py-28">
            <Reveal>
              <h2 className="text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Have a question?
                <br />
                <span className="text-faded">My AI has read all of this.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-center text-[17px] leading-relaxed text-faded">
                Grounded in my real roles, projects, and stack — it won't claim anything I can't
                back up.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mx-auto mt-12 max-w-2xl">
                <Chat />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-10 text-sm text-faded">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <a className="transition-colors hover:text-ink" href={`mailto:${profile.email}`}>{profile.email}</a>
        <span className="ml-auto">{profile.location}</span>
      </footer>
    </>
  );
}
