import { useEffect, useState } from "react";
import { profile, skills, experience, toolbox, education, type Skill, type Job } from "./data/profile";
import Chat from "./Chat";
import SimModal from "./SimModal";
import { SIMS } from "./sims";

// The garden is generated from the data arrays: every job grows a branch,
// every project opens a blossom, every toolbox group rests as a stone.
// Add to src/data/profile.ts and the tree grows on its own.

type Selection =
  | { kind: "job"; job: Job }
  | { kind: "project"; skill: Skill }
  | { kind: "stone"; group: string; items: string[] }
  | { kind: "gardener" }
  | null;

/* ---- generated geometry (viewBox 800 x 880, ground y=830) ---- */

const TRUNK = "M 400 830 C 396 740, 410 700, 398 620 C 386 540, 408 480, 400 400 C 394 340, 402 310, 399 280";

function branchGeometry(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? 1 : -1; // newest job branches right
    const y = 620 - i * 95;
    const len = 190 - i * 25;
    const x1 = 400 + side * 4;
    const x2 = 400 + side * len;
    const y2 = y - 60 - i * 8;
    return { d: `M ${x1} ${y} C ${400 + side * len * 0.4} ${y - 8}, ${400 + side * len * 0.75} ${y2 + 34}, ${x2} ${y2}`, x: x2, y: y2, side };
  });
}

function blossomGeometry(count: number) {
  // spread across the canopy in a gentle arc; more projects = a fuller crown
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI * (1.12 - t * 1.24); // ~200° → ~-22°
    const r = 150 + (i % 3) * 34;
    return { x: 400 + Math.cos(angle) * r, y: 250 - Math.sin(angle) * 96 + (i % 2) * 26 };
  });
}

const BRANCHES = branchGeometry(experience.length);
const BLOSSOMS = blossomGeometry(skills.length);
const STONES = Object.entries(toolbox).map(([group, items], i) => ({
  group,
  items,
  x: 160 + i * 155,
  y: 812 - (i % 2) * 10,
  rx: 46 + (items.length > 6 ? 10 : 0),
}));

const PETALS = Array.from({ length: 7 }, (_, i) => ({
  left: `${8 + i * 13}%`,
  delay: `${i * 2.3}s`,
  duration: `${11 + (i % 3) * 3}s`,
  scale: 0.7 + (i % 3) * 0.25,
}));

function Flower({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          rx="7.5"
          ry="11"
          transform={`rotate(${a}) translate(0 -8)`}
          fill={active ? "var(--color-clay)" : "var(--color-blossom)"}
          opacity={active ? 0.95 : 0.85}
        />
      ))}
      <circle r="4.5" fill="var(--color-amber)" />
    </g>
  );
}

export default function App() {
  const [sel, setSel] = useState<Selection>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function open(s: Exclude<Selection, null>, key: string) {
    setSel(s);
    setVisited((v) => new Set(v).add(key));
  }

  const totalSpots = experience.length + skills.length + STONES.length + 1;

  return (
    <div className="min-h-dvh">
      {/* falling petals */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="petal absolute top-0"
            style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}
          >
            <svg width={14 * p.scale} height={14 * p.scale} viewBox="0 0 14 14">
              <path d="M7 0 C11 3, 12 8, 7 14 C2 8, 3 3, 7 0" fill="var(--color-blossom)" opacity=".55" />
            </svg>
          </span>
        ))}
      </div>

      {/* masthead */}
      <header className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-2 px-6 pt-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{profile.name}</h1>
          <p className="mt-1 text-sm text-faded">
            {profile.role} · {profile.location} — a career, grown. Click anything living.
          </p>
        </div>
        <p className="text-xs text-faded">
          {visited.size}/{totalSpots} spots visited ·{" "}
          <a className="underline decoration-hairline underline-offset-4 hover:text-ink" href={profile.github} target="_blank" rel="noreferrer">
            github
          </a>{" "}
          ·{" "}
          <a className="underline decoration-hairline underline-offset-4 hover:text-ink" href={`mailto:${profile.email}`}>
            email
          </a>
        </p>
      </header>

      {/* legend */}
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-6 pt-4 text-xs text-faded">
        <span><span className="text-moss">⟋</span> branches — where I've worked</span>
        <span><span className="text-blossom">✿</span> blossoms — what I've built</span>
        <span><span className="text-faded">●</span> stones — my tools</span>
        <span><span className="text-amber">◍</span> lantern — ask my AI</span>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-2 pb-10 sm:px-6 lg:flex-row">
        {/* the garden */}
        <svg viewBox="0 0 800 880" className="mx-auto h-[80vh] min-h-[480px] w-full max-w-[820px] flex-1" role="img" aria-label="An interactive tree of Surya's career">
          {/* ground */}
          <path d="M 60 830 Q 400 800 740 830" fill="none" stroke="var(--color-hairline)" strokeWidth="2" />
          <ellipse cx="400" cy="842" rx="330" ry="14" fill="var(--color-linen)" />

          <g className="sway">
            {/* trunk */}
            <path d={TRUNK} className="draw" fill="none" stroke="var(--color-ink)" strokeWidth="10" strokeLinecap="round" />
            {/* branches = jobs */}
            {BRANCHES.map((b, i) => {
              const job = experience[i];
              const key = `job-${i}`;
              return (
                <g key={key}>
                  <path
                    d={b.d}
                    className="draw"
                    style={{ animationDelay: `${0.7 + i * 0.3}s` }}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth={6 - i}
                    strokeLinecap="round"
                  />
                  <g
                    className="bloom cursor-pointer"
                    style={{ animationDelay: `${1.5 + i * 0.3}s` }}
                    onClick={() => open({ kind: "job", job }, key)}
                  >
                    <circle cx={b.x} cy={b.y} r="17" fill="var(--color-moss)" opacity="0.92" />
                    <circle cx={b.x} cy={b.y} r="24" fill="transparent" stroke={visited.has(key) ? "var(--color-moss)" : "transparent"} strokeWidth="1.5" strokeDasharray="3 4" />
                    <text x={b.x + (b.side > 0 ? 30 : -30)} y={b.y + 4} textAnchor={b.side > 0 ? "start" : "end"} fontSize="15" fill="var(--color-ink)" fontFamily="var(--font-display)">
                      {job.company}
                    </text>
                  </g>
                </g>
              );
            })}
            {/* blossoms = projects */}
            {BLOSSOMS.map((p, i) => {
              const skill = skills[i];
              const key = `proj-${i}`;
              return (
                <g
                  key={key}
                  className="bloom cursor-pointer transition-transform hover:scale-110"
                  style={{ animationDelay: `${2 + i * 0.15}s`, transformBox: "fill-box", transformOrigin: "center" }}
                  onClick={() => open({ kind: "project", skill }, key)}
                >
                  <Flower x={p.x} y={p.y} active={visited.has(key)} />
                  <title>{skill.name}</title>
                </g>
              );
            })}
          </g>

          {/* stones = toolbox */}
          {STONES.map((s, i) => {
            const key = `stone-${i}`;
            return (
              <g key={key} className="bloom cursor-pointer" style={{ animationDelay: `${2.6 + i * 0.12}s` }} onClick={() => open({ kind: "stone", group: s.group, items: s.items }, key)}>
                <ellipse cx={s.x} cy={s.y} rx={s.rx} ry="17" fill="var(--color-oat)" stroke="var(--color-hairline)" />
                <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize="11" fill="var(--color-faded)">
                  {s.group}
                </text>
                {visited.has(key) && <circle cx={s.x + s.rx - 7} cy={s.y - 12} r="3" fill="var(--color-moss)" />}
              </g>
            );
          })}

          {/* lantern = ask the gardener */}
          <g className="bloom cursor-pointer" style={{ animationDelay: "3s" }} onClick={() => open({ kind: "gardener" }, "gardener")}>
            <line x1="672" y1="700" x2="672" y2="812" stroke="var(--color-ink)" strokeWidth="3" />
            <path d="M 650 700 h44 l-6 -14 h-32 z" fill="var(--color-ink)" />
            <rect x="656" y="700" width="32" height="42" rx="4" fill="var(--color-amber)" opacity="0.9" />
            <rect x="656" y="700" width="32" height="42" rx="4" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
            <text x="672" y="770" textAnchor="middle" fontSize="12" fill="var(--color-faded)">ask the gardener</text>
            <title>Ask my AI anything</title>
          </g>
        </svg>

        {/* shoji panel */}
        {sel && (
          <aside
            className="panel-enter z-30 w-full rounded-2xl border border-hairline bg-paper/95 p-6 shadow-[0_16px_50px_-20px_rgba(42,42,36,0.35)] backdrop-blur lg:sticky lg:top-6 lg:h-fit lg:max-h-[88vh] lg:w-[380px] lg:overflow-y-auto"
            role="dialog"
            aria-label="Details"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl leading-snug">
                {sel.kind === "job" && `${sel.job.role} · ${sel.job.company}`}
                {sel.kind === "project" && sel.skill.name}
                {sel.kind === "stone" && sel.group}
                {sel.kind === "gardener" && "Ask the gardener"}
              </h2>
              <button onClick={() => setSel(null)} className="cursor-pointer text-sm text-faded hover:text-ink" aria-label="Close panel">
                ✕
              </button>
            </div>

            {sel.kind === "job" && (
              <>
                <p className="mt-1 text-xs text-faded">{sel.job.period}</p>
                <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ink/85">
                  {sel.job.bullets.map((b) => (
                    <li key={b.slice(0, 32)} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-faded">{education}</p>
              </>
            )}

            {sel.kind === "project" && (
              <>
                <p className="mt-1 text-xs capitalize text-faded">{sel.skill.status} · {sel.skill.tools.join(" · ")}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-ink/85">{sel.skill.description}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-faded">{sel.skill.detail}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {SIMS[sel.skill.slug] && (
                    <button onClick={() => setSimOpen(true)} className="cursor-pointer rounded-full bg-clay px-4 py-2 text-sm text-paper transition-colors hover:bg-clay-deep">
                      ▶ Play with it
                    </button>
                  )}
                  {sel.skill.repo && (
                    <a href={sel.skill.repo} target="_blank" rel="noreferrer" className="rounded-full border border-hairline px-4 py-2 text-sm text-faded transition-colors hover:border-ink hover:text-ink">
                      View code ↗
                    </a>
                  )}
                </div>
                {SIMS[sel.skill.slug] && simOpen && (
                  <SimModal title={SIMS[sel.skill.slug].title} onClose={() => setSimOpen(false)}>
                    {(() => {
                      const S = SIMS[sel.skill.slug].component;
                      return <S />;
                    })()}
                  </SimModal>
                )}
              </>
            )}

            {sel.kind === "stone" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {sel.items.map((t) => (
                  <span key={t} className="rounded-full bg-linen px-3 py-1.5 text-sm text-ink/80">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {sel.kind === "gardener" && (
              <>
                <p className="mt-3 text-sm leading-relaxed text-faded">
                  A Gemini-powered guide that knows this whole garden — every branch, blossom, and
                  stone — and nothing more. Ask it anything about my work.
                </p>
                <Chat />
              </>
            )}
          </aside>
        )}
      </div>

      <footer className="mx-auto max-w-6xl px-6 pb-8 text-xs text-faded">
        © {new Date().getFullYear()} {profile.name} — the tree grows as the work does: every job a branch, every project a blossom.
      </footer>
    </div>
  );
}
