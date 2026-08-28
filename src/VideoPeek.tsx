import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// A silent 4x loop that behaves like a GIF but weighs a fraction of one, and
// opens the real recording at normal speed when clicked.
//
// The 4x is baked into the preview file rather than set through playbackRate:
// the browser then decodes 23 seconds of video instead of 94, and the file is
// 709KB instead of 43MB. Nothing is fetched until the clip is actually on
// screen, because `preload="none"` means the first byte waits for play().

export type Peek = {
  /** 4x, muted, loop-friendly */
  loop: string;
  /** full speed, for the lightbox */
  full: string;
  poster: string;
  label: string;
  /** width / height of the source, so no layout shift while it loads */
  ratio: number;
};

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rendered into the body: the beat card that opens this carries a transform,
// and a transformed ancestor becomes the containing block for `position:
// fixed`, which would trap a full-screen overlay inside the card.
function Lightbox({ peek, onClose }: { peek: Peek; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // the page behind is a scroll-driven sequence; letting it advance under an
    // open lightbox means closing it lands you somewhere you did not choose
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={peek.label}
      className="fadein fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hud w-full max-w-5xl overflow-hidden bg-ink p-0">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-linen px-4 py-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">{peek.label}</p>
          <button
            ref={closeBtn}
            onClick={onClose}
            className="pill cursor-pointer bg-linen px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider"
          >
            close (esc)
          </button>
        </div>
        <video
          ref={video}
          src={peek.full}
          poster={peek.poster}
          controls
          autoPlay
          playsInline
          className="block max-h-[78svh] w-full bg-ink"
        />
      </div>
    </div>,
    document.body,
  );
}

export function VideoPeek({ peek, active, className = "" }: { peek: Peek; active: boolean; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [still] = useState(reduced);

  // Play only while the clip is actually on screen. A loop running behind a
  // faded-out card is pure battery.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (active && !open && !still) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
    }
  }, [active, open, still]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`${peek.label} — play at full size`}
        className={`hud group relative block w-full cursor-pointer overflow-hidden p-0 ${className}`}
        style={{ aspectRatio: String(peek.ratio) }}
      >
        <video
          ref={video}
          src={peek.loop}
          poster={peek.poster}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          aria-hidden
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full border-2 border-ink bg-linen/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          {still ? "play" : "4× · click to play"}
        </span>
      </button>
      {open && <Lightbox peek={peek} onClose={() => setOpen(false)} />}
    </>
  );
}
