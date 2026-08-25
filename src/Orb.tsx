import { useEffect, useRef } from "react";

export type OrbState = "asleep" | "idle" | "listening" | "thinking" | "speaking";

const STATE_STYLE: Record<OrbState, { color: [number, number, number]; speed: number; pulse: number }> = {
  asleep: { color: [165, 160, 148], speed: 0.15, pulse: 0.25 },
  idle: { color: [176, 106, 93], speed: 0.4, pulse: 0.5 },
  listening: { color: [86, 148, 120], speed: 0.7, pulse: 1.4 },
  thinking: { color: [200, 150, 60], speed: 2.4, pulse: 0.9 },
  speaking: { color: [176, 106, 93], speed: 1.1, pulse: 2.0 },
};

export default function Orb({ state, size = 260 }: { state: OrbState; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.34;
    let raf = 0;
    // smooth color/speed transitions between states
    let cur = { ...STATE_STYLE[stateRef.current], rot1: 0, rot2: 0, rot3: 0 };

    const draw = (tm: number) => {
      const t = reduced ? 0 : tm / 1000;
      const target = STATE_STYLE[stateRef.current];
      cur.color = cur.color.map((c, i) => c + (target.color[i] - c) * 0.06) as [number, number, number];
      cur.speed += (target.speed - cur.speed) * 0.06;
      cur.pulse += (target.pulse - cur.pulse) * 0.06;
      cur.rot1 += 0.004 * cur.speed * (reduced ? 0 : 1);
      cur.rot2 -= 0.007 * cur.speed * (reduced ? 0 : 1);
      cur.rot3 += 0.011 * cur.speed * (reduced ? 0 : 1);

      const [r, g, b] = cur.color.map(Math.round);
      const breathe = 1 + Math.sin(t * 2.1) * 0.03 * cur.pulse;
      ctx.clearRect(0, 0, size, size);

      // core glow
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, R * breathe);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
      grad.addColorStop(0.35, `rgba(${r},${g},${b},0.12)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * breathe, 0, Math.PI * 2);
      ctx.fill();

      // inner core
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.28 * breathe, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.fill();

      // rotating arc rings
      const rings = [
        { rad: R * 0.62, rot: cur.rot1, arcs: 3, w: 2.5, a: 0.9 },
        { rad: R * 0.82, rot: cur.rot2, arcs: 2, w: 1.5, a: 0.6 },
        { rad: R * 1.02, rot: cur.rot3, arcs: 4, w: 1, a: 0.35 },
      ];
      for (const ring of rings) {
        for (let i = 0; i < ring.arcs; i++) {
          const start = ring.rot + (i * Math.PI * 2) / ring.arcs;
          ctx.beginPath();
          ctx.arc(cx, cy, ring.rad * breathe, start, start + Math.PI / ring.arcs);
          ctx.strokeStyle = `rgba(${r},${g},${b},${ring.a})`;
          ctx.lineWidth = ring.w;
          ctx.stroke();
        }
      }

      // outer dashed ring
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.28)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // speaking: ripple rings
      if (stateRef.current === "speaking" && !reduced) {
        const rip = (t * 0.9) % 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * (1.1 + rip * 0.5), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 * (1 - rip)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    if (reduced) {
      const iv = setInterval(() => draw(0), 400);
      return () => clearInterval(iv);
    }
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden />;
}
