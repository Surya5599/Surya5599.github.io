import { useEffect, useRef, useState } from "react";

// the photo subtly shifts and tilts toward the cursor — a gaze that follows
export function Avatar({ className }: { className?: string }) {
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
    { left: 42.0, top: 45.0 },
    { left: 61.5, top: 45.0 },
  ];
  return (
    <div
      ref={ref}
      className={
        className ??
        "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] lg:h-auto lg:w-full lg:aspect-square lg:rounded-2xl lg:shadow-[4px_4px_0_var(--color-ink)]"
      }
    >
      <img src="/surya.jpg" alt="Surya Singh" className="h-full w-full object-cover" />
      {EYES.map((e, i) => (
        <span
          key={i}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            left: `${e.left}%`,
            top: `${e.top}%`,
            width: "8.5%",
            height: "5.5%",
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
