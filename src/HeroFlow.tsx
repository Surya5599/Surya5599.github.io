import { useEffect, useRef } from "react";

// Hero animation: scattered raw-data particles drift in from the left,
// pass through the agent node at center, and exit right as three ordered,
// colored streams — extract, transform, load, drawn literally.

const LANES = ["#67e8f9", "#a78bfa", "#fbbf24"];

type P = { x: number; y: number; vx: number; lane: number; jitter: number; phase: number };

export default function HeroFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const N = 90;
    const parts: P[] = Array.from({ length: N }, (_, i) => ({
      x: Math.random() * -1.2 * 600,
      y: 0,
      vx: 1.1 + Math.random() * 1.3,
      lane: i % 3,
      jitter: Math.random() * 2 * Math.PI,
      phase: Math.random(),
    }));

    const laneY = (lane: number) => h * (0.3 + lane * 0.2);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;

      // faint lane guides on the right half
      for (let l = 0; l < 3; l++) {
        ctx.strokeStyle = LANES[l] + "22";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 26, laneY(l));
        ctx.lineTo(w, laneY(l));
        ctx.stroke();
      }

      // agent node
      const pulse = reduced ? 0 : Math.sin(t / 600) * 2;
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, h / 2, 20 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#1f2940";
      ctx.beginPath();
      ctx.arc(cx, h / 2, 32 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      for (const p of parts) {
        p.x += p.vx;
        if (p.x > w + 20) {
          p.x = -20 - Math.random() * 200;
          p.jitter = Math.random() * 2 * Math.PI;
        }
        const progress = Math.min(1, Math.max(0, (p.x - cx + 130) / 260));
        const chaosY = h / 2 + Math.sin(p.x / 38 + p.jitter) * h * 0.34 * (1 + 0.3 * Math.sin(p.jitter * 3));
        const y = chaosY * (1 - progress) + laneY(p.lane) * progress;
        p.y = y;

        const color = progress > 0.5 ? LANES[p.lane] : "#8a93a8";
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + 0.65 * progress;
        const r = 1.4 + progress * 1.2;
        ctx.beginPath();
        ctx.arc(p.x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    if (reduced) {
      // single static frame
      for (const p of parts) p.x = Math.random() * w;
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}
