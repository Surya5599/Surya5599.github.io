import { useState } from "react";

// A working miniature of a HabiCard day card, with one habit in it. It is the
// product demoing itself: the habit is "Visit Surya's Website", and you are
// already on it — so checking it off is the one habit on this card that is
// guaranteed to be honest.
//
// Authored at a fixed 200px width and scaled, so the compact variant does not
// need a second set of every class.

const RING = 2 * Math.PI * 26;

function Smiley({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function HabitCard({ scale = 1, className = "" }: { scale?: number; className?: string }) {
  const [done, setDone] = useState(false);
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: "long" });
  const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const pct = done ? 100 : 0;

  return (
    <div className={className} style={{ width: 200 * scale, height: 320 * scale }}>
      <div
        className="hud w-[200px] overflow-hidden p-0"
        style={{ transform: `scale(${scale})`, transformOrigin: "left top" }}
      >
        <div className="border-b-2 border-ink bg-violet px-3 py-2.5 text-center">
          <p className="font-display text-lg font-black uppercase leading-none tracking-wide text-white">{day}</p>
          <p className="mt-1 text-[10px] font-extrabold text-ink/70">{date}</p>
        </div>

        <div className="flex justify-center py-3.5">
          <div className="relative">
            <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-oat)" strokeWidth="7" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="var(--color-violet)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - pct / 100)}
                transform="rotate(-90 32 32)"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-base font-extrabold">
              {pct}%
            </span>
          </div>
        </div>

        <button
          role="checkbox"
          aria-checked={done}
          onClick={() => setDone((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 border-t-2 border-ink/10 px-3 py-2.5 text-left transition-colors hover:bg-oat"
        >
          <span className={`text-[13px] font-bold leading-snug ${done ? "text-faded line-through" : ""}`}>
            Visit Surya&apos;s Website
          </span>
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 border-ink transition-colors ${
              done ? "bg-violet text-ink" : "bg-linen text-transparent"
            }`}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        </button>

        {done && (
          <p className="fadein border-t-2 border-ink/10 px-3 py-2 text-[11px] font-semibold italic leading-snug text-faded">
            already done — you&apos;re on it right now.
          </p>
        )}

        <div className="grid grid-cols-3 border-t-2 border-ink text-center [&>*+*]:border-l-2 [&>*+*]:border-ink/15">
          <div className="px-1 py-2">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-faded">habits</p>
            <p className="text-[11px] font-extrabold">{done ? "1/1" : "0/1"}</p>
          </div>
          <div className="px-1 py-2">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-faded">tasks</p>
            <p className="text-[11px] font-extrabold">+</p>
          </div>
          <div className="px-1 py-2">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-faded">journal</p>
            <Smiley className="mx-auto mt-0.5 h-3.5 w-3.5 text-amber" />
          </div>
        </div>
      </div>
    </div>
  );
}
