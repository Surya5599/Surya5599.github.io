import { useState } from "react";
import { skills, experience, profile } from "../data/profile";
import SimModal from "../SimModal";
import { SIMS } from "../sims";

// The widget vocabulary SAGE composes dashboards from. The Gemini function
// and the local fallback both emit these shapes.
export type Widget =
  | { type: "stat"; label: string; value: string }
  | { type: "bars"; title: string; items: { label: string; value: number; note?: string }[] }
  | { type: "list"; title: string; items: string[] }
  | { type: "text"; title?: string; body: string }
  | { type: "project"; slug: string }
  | { type: "timeline" }
  | { type: "contact" };

function Panel({ children, delay = 0, wide = false }: { children: React.ReactNode; delay?: number; wide?: boolean }) {
  return (
    <div className={`hud flyin p-4 ${wide ? "sm:col-span-2" : ""}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">{children}</p>;
}

function ProjectPanel({ slug, delay }: { slug: string; delay: number }) {
  const skill = skills.find((s) => s.slug === slug);
  const [simOpen, setSimOpen] = useState(false);
  if (!skill) return null;
  const sim = SIMS[skill.slug];
  return (
    <Panel delay={delay} wide>
      <Title>project · {skill.status}</Title>
      <h3 className="mt-1.5 font-display text-2xl font-bold">{skill.name}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink/80">{skill.description}</p>
      <p className="mt-1.5 font-mono text-[11px] text-faded">{skill.tools.join(" · ")}</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {sim && (
          <button
            onClick={() => setSimOpen(true)}
            className="pill cursor-pointer bg-clay/25 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-ink transition-colors hover:bg-clay/40"
          >
            ▶ Run live demo
          </button>
        )}
        {skill.repo && (
          <a
            href={skill.repo}
            target="_blank"
            rel="noreferrer"
            className="pill bg-linen px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-ink"
          >
            Source ↗
          </a>
        )}
      </div>
      {sim && simOpen && (
        <SimModal title={sim.title} onClose={() => setSimOpen(false)}>
          <sim.component />
        </SimModal>
      )}
    </Panel>
  );
}

export function WidgetGrid({ widgets }: { widgets: Widget[] }) {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {widgets.map((w, i) => {
        const d = i * 120;
        switch (w.type) {
          case "stat":
            return (
              <Panel key={i} delay={d}>
                <p className="font-display text-4xl font-extrabold text-ink">{w.value}</p>
                <p className="mt-0.5 text-xs text-faded">{w.label}</p>
              </Panel>
            );
          case "bars":
            return (
              <Panel key={i} delay={d} wide>
                <Title>{w.title}</Title>
                <div className="mt-3 space-y-2.5">
                  {w.items.slice(0, 8).map((it, j) => (
                    <div key={j}>
                      <div className="flex justify-between font-mono text-[11px] text-faded">
                        <span className="text-ink/85">{it.label}</span>
                        <span>{it.note ?? `${Math.round(it.value)}%`}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full border border-ink/20 bg-oat">
                        <div
                          className="barfill h-full rounded-full bg-gradient-to-r from-clay to-moss"
                          style={{ width: `${Math.min(100, Math.max(4, it.value))}%`, animationDelay: `${d + j * 90}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          case "list":
            return (
              <Panel key={i} delay={d}>
                <Title>{w.title}</Title>
                <ul className="mt-2 space-y-1.5">
                  {w.items.slice(0, 8).map((it, j) => (
                    <li key={j} className="flex gap-2 text-sm text-ink/85">
                      <span className="text-clay-deep">✿</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          case "text":
            return (
              <Panel key={i} delay={d} wide>
                {w.title && <Title>{w.title}</Title>}
                <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{w.body}</p>
              </Panel>
            );
          case "project":
            return <ProjectPanel key={i} slug={w.slug} delay={d} />;
          case "timeline":
            return (
              <Panel key={i} delay={d} wide>
                <Title>career timeline</Title>
                <div className="mt-3 space-y-3">
                  {experience.map((job) => (
                    <div key={job.company + job.period} className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-ink bg-clay" />
                      <div>
                        <p className="font-display text-sm font-bold">
                          {job.role} · {job.company}
                          <span className="ml-2 font-mono text-[10px] font-normal text-faded">{job.period}</span>
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-faded">{job.bullets[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          case "contact":
            return (
              <Panel key={i} delay={d}>
                <Title>reach surya</Title>
                <p className="mt-2 font-mono text-sm">
                  <a className="text-clay-deep underline decoration-2 underline-offset-2" href={`mailto:${profile.email}`}>{profile.email}</a>
                </p>
                <p className="mt-1 font-mono text-sm">
                  <a className="text-clay-deep underline decoration-2 underline-offset-2" href={profile.github} target="_blank" rel="noreferrer">
                    {profile.github.replace("https://", "")}
                  </a>
                </p>
                <p className="mt-1 text-xs text-faded">{profile.location}</p>
              </Panel>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
