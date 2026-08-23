import { useEffect, useState } from "react";
import { profile, skills, experience, toolbox, education, type Skill } from "./data/profile";
import Chat from "./Chat";
import SimModal from "./SimModal";
import { SIMS } from "./sims";

function useTypewriter(text: string, speed = 28) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text.length);
      return;
    }
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [shown, text, speed]);
  return { typed: text.slice(0, shown), done: shown >= text.length };
}

const STATUS_STYLE: Record<Skill["status"], string> = {
  active: "text-clay",
  shipped: "text-moss",
  archived: "text-faded",
};

function SkillCard({ skill }: { skill: Skill }) {
  const [open, setOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const sim = SIMS[skill.slug];
  return (
    <article className="border border-hairline bg-linen flex flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-2 font-mono text-xs text-faded">
        <span className="truncate">skills/{skill.slug}/SKILL.md</span>
        <span className={`shrink-0 ${STATUS_STYLE[skill.status]}`}>● {skill.status}</span>
      </header>
      <div className="px-4 py-3 font-mono text-[13px] leading-relaxed">
        <div className="text-faded">---</div>
        <div>
          <span className="text-faded">name:</span> {skill.name}
        </div>
        <div>
          <span className="text-faded">description:</span>{" "}
          <span className="text-ink/80">{skill.description}</span>
        </div>
        <div>
          <span className="text-faded">tools:</span>{" "}
          <span className="text-clay-deep">[{skill.tools.join(", ")}]</span>
        </div>
        <div className="text-faded">---</div>
      </div>
      <div className="px-4 pb-4 mt-auto">
        <div className="flex items-center gap-5 font-mono text-xs">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="text-faded hover:text-ink cursor-pointer"
          >
            {open ? "▾ collapse" : "▸ expand"}
          </button>
          {sim && (
            <button
              onClick={() => setSimOpen(true)}
              className="text-clay cursor-pointer hover:text-clay-deep"
            >
              ▶ run simulation
            </button>
          )}
          {skill.repo && (
            <a
              href={skill.repo}
              target="_blank"
              rel="noreferrer"
              className="text-clay-deep underline decoration-hairline underline-offset-4 hover:decoration-clay"
            >
              invoke → github
            </a>
          )}
        </div>
        {open && <p className="mt-3 text-sm leading-relaxed text-ink/85">{skill.detail}</p>}
        {sim && simOpen && (
          <SimModal title={sim.title} onClose={() => setSimOpen(false)}>
            <sim.component />
          </SimModal>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const cmd = `> load_engineer --github Surya5599`;
  const { typed, done } = useTypewriter(cmd);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      {/* status line */}
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-hairline py-3 font-mono text-xs text-faded">
        <span>
          <span className="text-moss">●</span> session: portfolio
        </span>
        <span>skills: {skills.length} loaded</span>
        <span className="ml-auto flex gap-4">
          <a className="hover:text-ink" href={profile.github} target="_blank" rel="noreferrer">
            /github
          </a>
          <a className="hover:text-ink" href={`mailto:${profile.email}`}>
            /email
          </a>
          <a className="hover:text-ink" href="#ask">
            /ask
          </a>
        </span>
      </nav>

      {/* hero: a tool call resolving into the person */}
      <header className="py-16 sm:py-24">
        <p className={`font-mono text-sm text-faded ${done ? "" : "caret"}`}>{typed}</p>
        {done && (
          <div className="mt-6 border-l-2 border-clay pl-5 sm:pl-8">
            <h1 className="font-display text-6xl sm:text-8xl leading-[0.95] tracking-tight">
              Surya <span className="italic text-clay">Singh</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/85">{profile.tagline}</p>
            <p className="mt-4 font-mono text-xs text-faded">
              ✓ data engineer · {profile.location} · building agentic AI workflows at Oliver Wight
              · shipping{" "}
              <a href="#skills" className="text-clay-deep underline underline-offset-4">
                HabiCard
              </a>{" "}
              and{" "}
              <a href="#skills" className="text-clay-deep underline underline-offset-4">
                GymShot
              </a>
            </p>
          </div>
        )}
      </header>

      {/* skills */}
      <section id="skills" className="py-10">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="font-display text-4xl">Skills</h2>
          <span className="font-mono text-xs text-faded">~/skills · {skills.length} files</span>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {skills.map((s) => (
            <SkillCard key={s.slug} skill={s} />
          ))}
        </div>
      </section>

      {/* experience: the session history */}
      <section id="experience" className="py-10">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="font-display text-4xl">Experience</h2>
          <span className="font-mono text-xs text-faded">session history · 4+ yrs</span>
        </div>
        <div className="mt-8 space-y-8">
          {experience.map((job) => (
            <article key={job.company + job.period} className="sm:grid sm:grid-cols-[200px_1fr] sm:gap-8">
              <header className="font-mono text-xs text-faded">
                <p className="text-ink">
                  ▸ {job.company.toLowerCase().replace(/\s+/g, "-")}/{job.role.toLowerCase().replace(/\s+/g, "-")}
                </p>
                <p className="mt-1">{job.period}</p>
              </header>
              <ul className="mt-3 space-y-2 sm:mt-0">
                {job.bullets.map((b) => (
                  <li key={b.slice(0, 32)} className="flex gap-3 text-[15px] leading-relaxed text-ink/85">
                    <span className="text-clay" aria-hidden>–</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          <p className="font-mono text-xs text-faded">{education.toLowerCase()}</p>
        </div>
        <div className="mt-10 space-y-2 border-t border-hairline pt-6">
          {Object.entries(toolbox).map(([group, items]) => (
            <p key={group} className="font-mono text-xs leading-relaxed">
              <span className="text-faded">{group}:</span>{" "}
              <span className="text-clay-deep">[{items.join(", ")}]</span>
            </p>
          ))}
        </div>
      </section>

      {/* system prompt / about */}
      <section id="about" className="py-10">
        <div className="border border-pane-edge bg-pane text-pane-text">
          <header className="border-b border-pane-edge px-5 py-2 font-mono text-xs text-pane-dim">
            SYSTEM_PROMPT.md
          </header>
          <div className="space-y-4 px-5 py-6 sm:px-8 text-[15px] leading-relaxed">
            <p className="font-mono text-xs text-pane-dim">
              You are {profile.name}, a {profile.role.toLowerCase()}. Context:
            </p>
            {profile.about.map((p) => (
              <p key={p.slice(0, 24)} className="max-w-2xl text-pane-text/90">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* chat */}
      <section id="ask" className="py-10">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="font-display text-4xl">Ask the session</h2>
          <span className="font-mono text-xs text-faded">gemini · answers about my work</span>
        </div>
        <Chat />
      </section>

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-hairline py-6 font-mono text-xs text-faded">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span className="ml-auto">built with vite + react · hosted on netlify</span>
      </footer>
    </div>
  );
}
