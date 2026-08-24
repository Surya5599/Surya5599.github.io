import { useEffect, useRef } from "react";
import { skills } from "./data/profile";

// One waveform, alive for the whole page. Scroll morphs it through five states:
// pure noise → resolved signal → three traces (roles) → node constellation
// (projects) → a breathing orb (the AI). Mouse adds a local bulge.

type P = {
  noise: number;
  amp: number;
  freq: number;
  traces: number; // 0..1 → extra traces fade in
  nodes: number; // 0..1 → project nodes rise
  orb: number; // 0..1 → line coils into a circle
  color: [number, number, number];
};

const CHAPTERS: P[] = [
  { noise: 1.0, amp: 120, freq: 1.0, traces: 0, nodes: 0, orb: 0, color: [110, 112, 128] },
  { noise: 0.1, amp: 60, freq: 1.6, traces: 0, nodes: 0, orb: 0, color: [100, 240, 200] },
  { noise: 0.05, amp: 34, freq: 2.2, traces: 1, nodes: 0, orb: 0, color: [100, 240, 200] },
  { noise: 0.04, amp: 18, freq: 1.4, traces: 0, nodes: 1, orb: 0, color: [177, 149, 255] },
  { noise: 0.07, amp: 30, freq: 3.0, traces: 0, nodes: 0, orb: 1, color: [255, 201, 102] },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function paramsAt(c: number): P {
  const i = Math.min(CHAPTERS.length - 2, Math.floor(c));
  const f = smooth(Math.min(1, Math.max(0, c - i)));
  const a = CHAPTERS[i];
  const b = CHAPTERS[i + 1];
  return {
    noise: lerp(a.noise, b.noise, f),
    amp: lerp(a.amp, b.amp, f),
    freq: lerp(a.freq, b.freq, f),
    traces: lerp(a.traces, b.traces, f),
    nodes: lerp(a.nodes, b.nodes, f),
    orb: lerp(a.orb, b.orb, f),
    color: [lerp(a.color[0], b.color[0], f), lerp(a.color[1], b.color[1], f), lerp(a.color[2], b.color[2], f)],
  };
}

// deterministic smooth pseudo-noise
function n2(x: number, t: number) {
  return (
    Math.sin(x * 1.3 + t * 1.1) * Math.sin(x * 2.9 - t * 0.7) * 0.6 +
    Math.sin(x * 6.1 + t * 1.9) * 0.3 +
    Math.sin(x * 12.7 - t * 3.1) * 0.1
  );
}

export default function SignalCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = -1;
    let bulge = 0;
    const onMouse = (e: MouseEvent) => (mx = e.clientX / w);
    window.addEventListener("mousemove", onMouse);

    const N = 240;
    let raf = 0;

    const draw = (tm: number) => {
      const t = reduced ? 0 : tm / 1000;
      const max = document.documentElement.scrollHeight - h;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const c = p * (CHAPTERS.length - 1);
      const P = paramsAt(c);
      bulge += ((mx >= 0 ? 1 : 0) - bulge) * 0.06;

      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = P.color.map(Math.round);
      const cx = w / 2;
      const cy = h / 2;
      const orbR = Math.min(w, h) * 0.21 * (1 + Math.sin(t * 1.4) * 0.03);

      const traceCount = 3;
      for (let k = 0; k < traceCount; k++) {
        const isMain = k === 0;
        const traceAlpha = isMain ? 1 : P.traces * (1 - P.orb);
        if (traceAlpha <= 0.01) continue;
        const sep = (k === 1 ? -1 : 1) * 90 * P.traces;
        const phase = k * 1.7;

        for (const pass of [0, 1]) {
          ctx.beginPath();
          for (let i = 0; i <= N; i++) {
            const u = i / N;
            const x = u * w;
            const nx = u * 10;
            const wave = Math.sin(u * Math.PI * 2 * P.freq + t * 1.2 + phase) * P.amp;
            const noise = n2(nx + k * 3, t * (reduced ? 0 : 1)) * P.noise * 150;
            const mouseBump = mx >= 0 ? Math.exp(-(((u - mx) * 9) ** 2)) * 46 * bulge * Math.sin(t * 5 + u * 20) : 0;
            const lineY = cy + (isMain ? 0 : sep) + wave + noise + mouseBump;

            // orb morph: line position → circle position
            const ang = u * Math.PI * 2 - Math.PI / 2 + t * 0.22;
            const wob = 1 + n2(u * 6, t * 0.8) * 0.05 * (1 + P.noise);
            const ox = cx + Math.cos(ang) * orbR * wob;
            const oy = cy + Math.sin(ang) * orbR * wob + wave * 0.15;

            const X = lerp(x, ox, smooth(P.orb));
            const Y = lerp(lineY, oy, smooth(P.orb));
            if (i === 0) ctx.moveTo(X, Y);
            else ctx.lineTo(X, Y);
          }
          if (pass === 0) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.10 * traceAlpha})`;
            ctx.lineWidth = 10;
          } else {
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.9 * traceAlpha})`;
            ctx.lineWidth = 1.8;
          }
          ctx.stroke();
        }
      }

      // project nodes rise from the main line
      if (P.nodes > 0.01) {
        const count = skills.length;
        for (let i = 0; i < count; i++) {
          const u = (i + 0.5) / count;
          const x = u * w;
          const wave = Math.sin(u * Math.PI * 2 * P.freq + t * 1.2) * P.amp;
          const y = cy + wave;
          const pulse = 1 + Math.sin(t * 2 + i) * 0.15;
          const rad = 7 * P.nodes * pulse;
          ctx.beginPath();
          ctx.arc(x, y, rad * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${0.12 * P.nodes})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${0.95 * P.nodes})`;
          ctx.fill();
          // stem down to the label row
          ctx.beginPath();
          ctx.moveTo(x, y + rad + 2);
          ctx.lineTo(x, y + 40 * P.nodes);
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.3 * P.nodes})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // orb core
      if (P.orb > 0.02) {
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, orbR);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.20 * P.orb})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      draw(0);
      const onScroll = () => draw(0);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouse);
      };
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 -z-10 h-dvh w-screen" aria-hidden />;
}
