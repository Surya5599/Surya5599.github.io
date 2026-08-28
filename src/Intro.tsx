import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { AppleIcon, ChromeIcon, ExternalIcon, GlobeIcon, LinkedinIcon } from "./icons";
import { VideoPeek, type Peek } from "./VideoPeek";
import { HabitCard } from "./HabitCard";
import { ContactCard } from "./ContactCard";
import { profile, skills } from "./data/profile";

// The intro scrolls in place, as a split stage.
//
// At rest the identity sits in the middle of the screen. As soon as you scroll
// it slides to the left and a rule draws down the centre. Each beat then
// arrives on the right, holds while you read it, and hands itself across the
// rule — leaving a compact line stacked under the name on the left. By the end
// the left column has assembled itself into a summary and the right is empty,
// which is when the dashboard takes over.
//
// This is native sticky positioning, not scroll hijacking: wheel, trackpad,
// scrollbar, Page Down and the keyboard all behave normally, and a visitor can
// leave at any point.

type LinkIcon = "linkedin" | "site" | "apple" | "chrome" | "globe";

// one place that decides which mark a destination gets
function iconFor(url: string): LinkIcon {
  if (url.includes("apps.apple.com")) return "apple";
  if (url.includes("chromewebstore.google.com")) return "chrome";
  return "globe";
}

function LinkMark({ icon, className }: { icon: LinkIcon; className: string }) {
  if (icon === "linkedin") return <LinkedinIcon className={className} />;
  if (icon === "apple") return <AppleIcon className={className} />;
  if (icon === "chrome") return <ChromeIcon className={className} />;
  if (icon === "globe") return <GlobeIcon className={className} />;
  return <ExternalIcon className={className} />;
}

type Beat = {
  label: string;
  /** the compact form that ends up stacked on the left */
  summary: string;
  title?: string;
  body?: string;
  chips?: string[];
  /** an aside introducing the links */
  aside?: string;
  /** they ride along on the right, and stay on the line once it lands */
  links?: { label: string; href: string; icon: LinkIcon }[];
  /** a silent 4x loop shown with the beat, openable at full size */
  peek?: Peek;
  /** the working HabiCard miniature */
  demo?: "habitcard";
  /** a role's span, drawn on the shared career axis */
  tenure?: { from: string; to?: string };
};

const BEATS: Beat[] = [
  {
    label: "currently",
    title: "Data Engineer at Oliver Wight Americas",
    tenure: { from: "2024-12" },
    aside: "and here's my LinkedIn, by the way",
    links: [{ label: "LinkedIn", href: profile.linkedin, icon: "linkedin" }],
    summary: "Data Engineer at Oliver Wight Americas",
  },
  {
    label: "previously",
    title: "Infosys",
    tenure: { from: "2021-04", to: "2024-12" },
    body: "I started there as an ETL Developer and moved into data engineering, working across a range of BI projects.",
    summary: "Infosys — ETL Developer, then Data Engineer on BI",
  },
  {
    label: "what I'm into right now",
    title: "AI — specifically Claude agents and skills",
    body: "Everyone says AI. What I actually build: agents and skills pointed at work that repeats often enough to hurt, but isn't mechanical enough for a plain script. Right now that's a pipeline parsing raw client data into an ETL data model, with a human in the loop to validate the issues and errors it turns up.",
    summary: "Claude agents & skills — human-in-the-loop ETL",
  },
  {
    label: "what I work in",
    chips: ["Agentic tech", "Design", "Development", "Data engineering"],
    summary: "Agentic tech · Design · Development · Data engineering",
  },
  {
    label: "a project I'm proud of",
    title: "UniversalShelter.org",
    body: "Eight months of iteration, built from the ground up — front end, back end, database functions and triggers, the PayPal API. It runs a live donation dashboard and a transparency portal that puts every expense a nonprofit makes out in the open.",
    links: [{ label: "check it out", href: "https://universalshelter.org", icon: "site" }],
    peek: {
      loop: "/actum-preview.mp4",
      full: "/actum-full.mp4",
      poster: "/actum-poster.jpg",
      label: "UniversalShelter.org — a walkthrough",
      ratio: 1920 / 992,
    },
    summary: "UniversalShelter.org — built end to end",
  },
  {
    label: "and this one",
    title: "HabiCard",
    body: "It started as a spreadsheet, because I couldn't keep track of my own habits. It's a real app now, with around 1,300 people using it — on the web, as a Chrome extension, and on iOS. Android is in development.",
    demo: "habitcard",
    peek: {
      loop: "/habicard-preview.mp4",
      full: "/habicard-full.mp4",
      poster: "/habicard-poster.jpg",
      label: "HabiCard — a walkthrough",
      ratio: 16 / 9,
    },
    links: (skills.find((k) => k.slug === "habicard")?.links ?? []).map((l) => ({
      label: l.label,
      href: l.url,
      icon: iconFor(l.url),
    })),
    summary: "HabiCard — ~1,300 people, web · Chrome · iOS",
  },
];

// The identity takes the first slice to move out of the middle; the beats share
// the rest, at roughly four fifths of a screen of scrolling each.
const SETTLE = 0.18;
const SLOTS = BEATS.length + 1; // the beats, then the closing panel
const RUNWAY_SVH = 120 + SLOTS * 72;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// ease-out, so a scroll-linked move decelerates instead of tracking linearly
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

const canAnimate = () =>
  typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Phase = {
  /** right-hand card */
  opacity: number;
  y: number;
  x: number;
  scale: number;
  /** left-hand stacked line */
  landed: number;
};

// Each beat owns a window: it enters, holds, then transfers across the rule.
// The left line fades in over exactly the transfer, so one movement reads as
// one object crossing the page rather than two things happening at once.
function phaseOf(p: number, i: number, count: number): Phase {
  const span = (1 - SETTLE) / count;
  const start = SETTLE + i * span;
  const enterEnd = start + span * 0.26;
  const transferStart = start + span * 0.74;
  const end = start + span;

  if (p < start) return { opacity: 0, y: 26, x: 0, scale: 1, landed: 0 };
  if (p < enterEnd) {
    const t = ease((p - start) / (enterEnd - start));
    return { opacity: t, y: 26 * (1 - t), x: 0, scale: 0.96 + 0.04 * t, landed: 0 };
  }
  if (p < transferStart) return { opacity: 1, y: 0, x: 0, scale: 1, landed: 0 };
  if (p < end) {
    const t = ease((p - transferStart) / (end - transferStart));
    return { opacity: 1 - t, y: 0, x: -110 * t, scale: 1 - 0.42 * t, landed: t };
  }
  return { opacity: 0, y: 0, x: -110, scale: 0.58, landed: 1 };
}


// Tenure, computed from the start date every time the page loads — a hand-typed
// "1 yr 8 mos" is wrong by definition a month later.
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function spanLabel(months: number) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} yr${y === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} mo${m === 1 ? "" : "s"}`);
  return parts.join(" ") || "just started";
}

function stamp(d: Date) {
  return `${MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

// Both roles are drawn on one shared axis that runs from the first job to now,
// so the bar's position carries meaning and not just its length.
const AXIS_START = new Date(2021, 0, 1);

function Tenure({ from, to, compact = false }: { from: string; to?: string; compact?: boolean }) {
  const now = new Date();
  const [fy, fm] = from.split("-").map(Number);
  const start = new Date(fy, fm - 1, 1);
  const end = to ? new Date(Number(to.split("-")[0]), Number(to.split("-")[1]) - 1, 1) : now;
  const total = Math.max(1, monthsBetween(AXIS_START, now));
  const left = (monthsBetween(AXIS_START, start) / total) * 100;
  const width = Math.max(3, (monthsBetween(start, end) / total) * 100);
  const months = monthsBetween(start, end);
  const current = !to;

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <div className="flex items-baseline justify-between text-[11px] font-extrabold uppercase tracking-wider text-faded">
        <span>{stamp(start)}</span>
        <span>{current ? "now" : stamp(end)}</span>
      </div>
      <div className="relative mt-1.5 h-[6px] w-full max-w-sm rounded-full bg-oat">
        <div
          className="absolute top-0 h-full rounded-full bg-clay"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {current && (
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-ink bg-clay-deep"
            style={{ left: `calc(${left + width}% - 5px)` }}
          />
        )}
      </div>
      <p className="mt-2 text-sm font-semibold text-faded">
        {current ? `${spanLabel(months)} in, and counting` : `${spanLabel(months)} there`}
      </p>
    </div>
  );
}

function BeatCard({ beat, active, compact = false }: { beat: Beat; active: boolean; compact?: boolean }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-clay-deep">{beat.label}</p>
      {beat.title && (
        <p className="mt-3 font-display text-4xl font-extrabold leading-[1.05] lg:text-5xl">{beat.title}</p>
      )}
      {beat.tenure && <Tenure from={beat.tenure.from} to={beat.tenure.to} compact={compact} />}
      {beat.chips && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {beat.chips.map((c) => (
            <span key={c} className="rounded-full border-2 border-ink px-4 py-1.5 text-base font-bold lg:text-lg">
              {c}
            </span>
          ))}
        </div>
      )}
      {beat.body && !(compact && beat.peek) && (
        <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-faded lg:text-lg">{beat.body}</p>
      )}
      {(beat.peek || beat.demo) && (
        <div className="mt-5 flex flex-nowrap items-start gap-3 sm:gap-4">
          {beat.peek && (
            <VideoPeek peek={beat.peek} active={active} className={beat.demo ? "min-w-0 flex-1 max-w-md" : "w-full max-w-md"} />
          )}
          {beat.demo === "habitcard" && <HabitCard scale={compact ? 0.68 : 1} className="shrink-0" />}
        </div>
      )}
      {beat.links?.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          {beat.aside && <span className="text-sm font-semibold text-faded">{beat.aside}</span>}
          {beat.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="pill inline-flex items-center gap-2 bg-linen px-3.5 py-1.5 text-sm font-extrabold"
            >
              <LinkMark icon={l.icon} className="h-4 w-4" />
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// the compact line a completed beat leaves behind on the left
function LandedLine({ beat, t }: { beat: Beat; t: number }) {
  return (
    <div
      className="border-l-2 border-clay pl-3.5"
      style={{ opacity: t, transform: `translateX(${(1 - t) * 18}px)` }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-faded">{beat.label}</p>
      <p className="flex flex-wrap items-center gap-x-2 text-[15px] font-bold leading-snug">
        {beat.summary}
        {beat.tenure && (
          <span className="font-semibold text-faded">
            · {spanLabel(monthsBetween(new Date(Number(beat.tenure.from.split("-")[0]), Number(beat.tenure.from.split("-")[1]) - 1, 1), beat.tenure.to ? new Date(Number(beat.tenure.to.split("-")[0]), Number(beat.tenure.to.split("-")[1]) - 1, 1) : new Date()))}
          </span>
        )}
        {beat.links?.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            title={l.label}
            aria-label={l.label}
            className="text-faded transition-colors hover:text-ink"
          >
            <LinkMark icon={l.icon} className="h-3.5 w-3.5" />
          </a>
        ))}
      </p>
    </div>
  );
}

function Identity({
  settle,
  wide,
  innerRef,
  avatarRef,
  nameRef,
  offset,
  avatarOffset,
}: {
  settle: number;
  wide: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  avatarRef?: React.Ref<HTMLDivElement>;
  nameRef?: React.Ref<HTMLParagraphElement>;
  offset?: number;
  avatarOffset?: number;
}) {
  // Huge at rest, settling to a nameplate. The scale carries the move, so
  // nothing reflows while it happens; `offset` slides the block from the middle
  // of the stage to its docked position on the left, and `avatarOffset` centres
  // the portrait over the name at rest. Both come from real measurements —
  // "centred" cannot be faked with percentages once a scale is involved.
  const grow = 1 + (wide ? 0.95 : 0.3) * (1 - settle);
  return (
    <div
      ref={innerRef}
      className="flex w-fit flex-col items-start gap-4"
      style={{
        transform: `translateX(${offset ?? 0}px) scale(${grow})`,
        transformOrigin: "left center",
      }}
    >
      <div ref={avatarRef} style={{ transform: `translateX(${avatarOffset ?? 0}px)` }}>
        <Avatar className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-ink shadow-[5px_5px_0_var(--color-ink)] sm:w-28 lg:w-32" />
      </div>
      <p
        ref={nameRef}
        className="max-w-[6em] font-display text-4xl font-black leading-[0.98] tracking-[-0.03em] sm:max-w-none sm:text-5xl xl:text-6xl"
      >
        Hello, I&apos;m Surya<span className="text-clay-deep">.</span>
      </p>
      <p className="-mt-2 max-w-[15em] text-[12px] font-semibold italic text-faded sm:max-w-none">
        ignore the goofy eyes — they follow your cursor
      </p>
    </div>
  );
}

type Dest = "overview" | "experience" | "projects" | "skills" | "contact";

// Where the sequence lets you out. The dashboard is the headline; the rest are
// there so nobody has to scroll back up to find a way in.
const EXITS: { key: Dest; label: string; note: string }[] = [
  { key: "experience", label: "Experience", note: "the roles, and what each one actually involved" },
  { key: "projects", label: "Projects", note: "nine builds, five of them runnable right here" },
  { key: "skills", label: "Skills", note: "the toolbox, by category" },
  { key: "contact", label: "Contact", note: "the fastest way to reach me" },
];


// The end of the road: it holds the right-hand half of the stage once the beats
// are spent, centred in that half rather than pinned to its top edge.
function Closing({ t, go, compact }: { t: number; go: (v: Dest) => void; compact: boolean }) {
  if (t <= 0) return null;
  return (
    <div
      className={compact ? "text-center" : "absolute inset-x-0 top-0 text-center"}
      style={{
        opacity: t,
        transform: compact ? `translateY(${(1 - t) * 22}px)` : `translateY(calc(-50% + ${(1 - t) * 22}px))`,
      }}
    >
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-clay-deep">
          that&apos;s the short version
        </p>
        <p className="mt-2 font-display text-3xl font-extrabold leading-[1.05] lg:text-4xl">Where to next?</p>

        <button
          onClick={() => go("overview")}
          className="pill mt-5 inline-flex cursor-pointer items-center gap-2 bg-clay px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-white"
        >
          Let&apos;s view my dashboard →
        </button>

        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {EXITS.map((e) => (
            <button
              key={e.key}
              onClick={() => go(e.key)}
              title={e.note}
              className="cursor-pointer text-[13px] font-bold text-faded underline decoration-2 underline-offset-4 transition-colors hover:text-ink"
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="mt-6 text-left">
          <ContactCard compact={compact} />
        </div>
      </div>
    </div>
  );
}

export function Intro({ go, onEnd }: { go: (v: Dest) => void; onEnd: (atEnd: boolean) => void }) {
  const runway = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [animated] = useState(canAnimate);
  const atEndRef = useRef(false);
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const stageEl = useRef<HTMLDivElement>(null);
  const identityEl = useRef<HTMLDivElement>(null);
  const avatarEl = useRef<HTMLDivElement>(null);
  const nameEl = useRef<HTMLParagraphElement>(null);
  const [box, setBox] = useState({ stage: 0, identity: 0, avatar: 0, name: 0 });
  // how far the sticky stage still is from the top of the viewport
  const [gap, setGap] = useState(0);

  // one measurement, kept in sync with the viewport — the centring maths needs
  // the real widths, not an assumption about them
  useEffect(() => {
    const s = stageEl.current;
    const i = identityEl.current;
    if (!s || !i) return;
    const read = () =>
      setBox({
        stage: s.clientWidth,
        identity: i.offsetWidth,
        avatar: avatarEl.current?.offsetWidth ?? 0,
        name: nameEl.current?.offsetWidth ?? 0,
      });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(s);
    ro.observe(i);
    return () => ro.disconnect();
  }, [wide, animated]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!animated) {
      // no scroll coupling here, so the closing panel is on the page already
      onEnd(true);
      return;
    }
    const el = runway.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      const p = travel > 0 ? clamp01(-box.top / travel) : 1;
      setProgress(p);
      // Before the stage sticks it sits at the top of the page, so a
      // full-height stage centres its contents that far too low. Shrinking it
      // by twice the gap puts the midpoint back on the viewport centre, and
      // the term falls to zero the moment it sticks.
      setGap(Math.max(0, box.top));
      // The nav comes back for the closing panel — that is the point at which
      // the visitor is choosing where to go, and needs the tabs. Reported once
      // at the crossing rather than every frame.
      const atEnd = p >= SETTLE + ((1 - SETTLE) / SLOTS) * BEATS.length;
      if (atEnd !== atEndRef.current) {
        atEndRef.current = atEnd;
        onEnd(atEnd);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [animated, onEnd]);

  // Reduced motion gets the same words with no pinning and no scroll coupling:
  // the identity, then every beat as an ordinary section.
  if (!animated) {
    return (
      <div className="-mt-4 grid gap-8 sm:-mt-6">
        <div className="py-4">
          <Identity settle={1} wide={false} />
        </div>
        {BEATS.map((b) => (
          <section key={b.label} className="border-l-2 border-clay pl-4">
            <BeatCard beat={b} active />
          </section>
        ))}
        <Closing t={1} go={go} compact />
      </div>
    );
  }

  const settle = ease(progress / SETTLE);
  const phases = BEATS.map((_, i) => phaseOf(progress, i, SLOTS));
  const closeSpan = (1 - SETTLE) / SLOTS;
  // the closing panel arrives and stays — it is the end of the road, not a beat
  const closeIn = clamp01((progress - (SETTLE + closeSpan * BEATS.length)) / (closeSpan * 0.45));
  // centre the scaled identity on the stage at rest, dock it at x=0 by the end
  const grow = 1 + (wide ? 0.95 : 0.3) * (1 - settle);
  const identityOffset = box.stage && box.identity ? (1 - settle) * (box.stage / 2 - (box.identity * grow) / 2) : 0;
  const avatarOffset = box.name && box.avatar ? (1 - settle) * ((box.name - box.avatar) / 2) : 0;
  const activeIndex = Math.min(SLOTS - 1, Math.max(0, Math.floor((progress - SETTLE) / closeSpan)));

  return (
    <>
      <div ref={runway} className="-mt-4 sm:-mt-6" style={{ height: `${RUNWAY_SVH}svh` }} aria-label="Introduction">
      <div
        ref={stageEl}
        className="sticky top-0 overflow-hidden"
        style={{ height: `max(24rem, calc(100svh - ${2 * gap}px))` }}
      >
        {wide ? (
          /* ---------- split stage ---------- */
          <div className="relative flex h-full items-center">
            {/* the rule draws itself once the identity is out of the middle */}
            <div
              className="absolute left-1/2 w-[2px] bg-ink/15"
              style={{
                top: "14%",
                bottom: "14%",
                opacity: settle * (1 - clamp01((progress - 0.9) / 0.1)),
                transformOrigin: "top center",
                transform: `translateX(-50%) scaleY(${settle})`,
              }}
            />

            {/* left: the identity, then everything that has landed */}
            <div className="w-1/2 pr-12">
              <Identity settle={settle} wide innerRef={identityEl} avatarRef={avatarEl} nameRef={nameEl} offset={identityOffset} avatarOffset={avatarOffset} />
              {/* space is reserved only once the identity has docked, so the
                  landing frame stays vertically centred */}
              <div className="mt-7 grid auto-rows-min content-start gap-3" style={{ minHeight: settle * BEATS.length * 52 }}>
                {BEATS.map((b, i) => (phases[i].landed > 0 ? <LandedLine key={b.label} beat={b} t={phases[i].landed} /> : null))}
              </div>
            </div>

            {/* right: whatever is arriving */}
            <div className="w-1/2 px-12" style={{ opacity: settle }}>
              <div className="relative">
                {BEATS.map((b, i) => {
                  const ph = phases[i];
                  if (ph.opacity === 0) return null;
                  return (
                    <div
                      key={b.label}
                      aria-hidden={ph.opacity < 0.5}
                      inert={ph.opacity <= 0.6}
                      className="absolute inset-x-0 top-0"
                      style={{
                        opacity: ph.opacity,
                        transform: `translate(${ph.x}px, calc(-50% + ${ph.y}px)) scale(${ph.scale})`,
                        transformOrigin: "left center",
                        pointerEvents: ph.opacity > 0.6 ? "auto" : "none",
                        willChange: ph.opacity < 1 ? "opacity, transform" : undefined,
                      }}
                    >
                      <BeatCard beat={b} active={ph.opacity > 0.6} />
                    </div>
                  );
                })}
                <Closing t={closeIn} go={go} compact={false} />
              </div>
            </div>
          </div>
        ) : (
          /* ---------- narrow: the same sequence, stacked ---------- */
          <div className="flex h-full flex-col justify-center">
            <Identity settle={settle} wide={false} innerRef={identityEl} avatarRef={avatarEl} nameRef={nameEl} offset={identityOffset} avatarOffset={avatarOffset} />
            <div className="h-[1px] w-16 bg-ink/20" style={{ opacity: settle, marginTop: settle * 24 }} />
            <div className="relative" style={{ marginTop: settle * 24, height: settle * (closeIn > 0 ? 560 : 430) }}>
              {BEATS.map((b, i) => {
                const ph = phases[i];
                if (ph.opacity === 0) return null;
                return (
                  <div
                    key={b.label}
                    aria-hidden={ph.opacity < 0.5}
                    inert={ph.opacity <= 0.6}
                    className="absolute inset-x-0 top-0"
                    style={{
                      opacity: ph.opacity,
                      transform: `translate(${ph.x}px, ${ph.y}px) scale(${ph.scale})`,
                      transformOrigin: "left top",
                      pointerEvents: ph.opacity > 0.6 ? "auto" : "none",
                      willChange: ph.opacity < 1 ? "opacity, transform" : undefined,
                    }}
                  >
                    <BeatCard beat={b} active={ph.opacity > 0.6} compact />
                  </div>
                );
              })}
              <Closing t={closeIn} go={go} compact />
            </div>
          </div>
        )}
      </div>

      {/* the cue: how far along you are, and how to leave */}
      <div
        aria-hidden={closeIn > 0.5}
        className={`pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-500 ${
          closeIn > 0.5 ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: SLOTS }, (_, i) => (
              <span
                key={i}
                className="h-[3px] w-5 rounded-full transition-colors duration-300"
                style={{
                  background: i === activeIndex ? "var(--color-clay-deep)" : "var(--color-ink)",
                  opacity: i === activeIndex ? 1 : 0.18,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-faded">keep scrolling</span>
        </div>
      </div>
      </div>
    </>
  );
}
