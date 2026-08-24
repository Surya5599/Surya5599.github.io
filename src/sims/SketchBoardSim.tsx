import { useCallback, useEffect, useRef, useState } from "react";

// Browser recreation of the SketchBoard embedded-systems project: an
// Etch-a-Sketch on an AVR. Joystick (arrow keys / WASD / on-screen d-pad)
// moves a cursor on a Nokia 5110 LCD (84x48 px); a 16x02 LCD shows the menu;
// drawings save to "EEPROM" slots (localStorage, so they survive power-off).

const W = 84;
const H = 48;
const SCALE = 4;
const MODES = ["draw", "move", "erase"] as const;
type Mode = (typeof MODES)[number];

const LCD_BG = "#9aa887";
const LCD_PX = "#1e2718";
const SLOT_KEY = (n: number) => `sketchboard_eeprom_${n}`;

function packPixels(px: Uint8Array): string {
  let bits = "";
  for (const p of px) bits += p ? "1" : "0";
  return bits;
}

function unpackPixels(s: string) {
  const px = new Uint8Array(W * H);
  for (let i = 0; i < Math.min(s.length, px.length); i++) px[i] = s[i] === "1" ? 1 : 0;
  return px;
}

export default function SketchBoardSim() {
  const pixels = useRef(new Uint8Array(W * H));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 42, y: 24 });
  const [mode, setMode] = useState<Mode>("draw");
  const [slot, setSlot] = useState(1);
  const [msg, setMsg] = useState("READY");
  const [stick, setStick] = useState({ dx: 0, dy: 0 });
  const [angle, setAngle] = useState({ rx: 48, rz: -14 });
  const drag = useRef<{ x: number; y: number; rx: number; rz: number } | null>(null);
  const blink = useRef(true);

  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, W * SCALE, H * SCALE);
    ctx.fillStyle = LCD_PX;
    const px = pixels.current;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (px[y * W + x]) ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    if (blink.current) {
      ctx.strokeStyle = "#c15f3c";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cursor.x * SCALE - 1, cursor.y * SCALE - 1, SCALE + 2, SCALE + 2);
    }
  }, [cursor]);

  useEffect(redraw, [redraw, mode]);

  useEffect(() => {
    const t = setInterval(() => {
      blink.current = !blink.current;
      redraw();
    }, 450);
    return () => clearInterval(t);
  }, [redraw]);

  const move = useCallback(
    (dx: number, dy: number) => {
      setStick({ dx, dy });
      setTimeout(() => setStick({ dx: 0, dy: 0 }), 180);
      setCursor((c) => {
        const x = Math.min(W - 1, Math.max(0, c.x + dx));
        const y = Math.min(H - 1, Math.max(0, c.y + dy));
        if (mode === "draw") pixels.current[y * W + x] = 1;
        if (mode === "erase") pixels.current[y * W + x] = 0;
        return { x, y };
      });
    },
    [mode],
  );

  const cycleMode = useCallback(() => {
    setMode((m) => {
      const next = MODES[(MODES.indexOf(m) + 1) % MODES.length];
      setMsg(`MODE ${next.toUpperCase()}`);
      return next;
    });
  }, []);

  function save() {
    try {
      localStorage.setItem(SLOT_KEY(slot), packPixels(pixels.current));
      setMsg("SAVED OK");
    } catch {
      setMsg("EEPROM WRITE ERR");
    }
  }

  function load() {
    const data = localStorage.getItem(SLOT_KEY(slot));
    if (data === null) {
      setMsg("SLOT EMPTY");
      return;
    }
    pixels.current = unpackPixels(data);
    setMsg("LOADED OK");
    redraw();
  }

  function clearScreen() {
    pixels.current = new Uint8Array(W * H);
    setMsg("CLEARED");
    redraw();
  }

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const map: Record<string, [number, number]> = {
        arrowup: [0, -1], w: [0, -1],
        arrowdown: [0, 1], s: [0, 1],
        arrowleft: [-1, 0], a: [-1, 0],
        arrowright: [1, 0], d: [1, 0],
      };
      if (map[k]) {
        e.preventDefault();
        move(...map[k]);
      } else if (k === " " || k === "m") {
        e.preventDefault();
        cycleMode();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [move, cycleMode]);

  const lcdLine1 = `MODE:${mode.toUpperCase().padEnd(5)} ${String(cursor.x).padStart(2)},${String(cursor.y).padStart(2)}`;
  const lcdLine2 = `SLOT:${slot} ${msg}`.slice(0, 16);

  const dpad: { label: string; dx: number; dy: number; style: React.CSSProperties }[] = [
    { label: "▲", dx: 0, dy: -1, style: { top: 0, left: 34 } },
    { label: "▼", dx: 0, dy: 1, style: { top: 68, left: 34 } },
    { label: "◀", dx: -1, dy: 0, style: { top: 34, left: 0 } },
    { label: "▶", dx: 1, dy: 0, style: { top: 34, left: 68 } },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col font-mono text-[13px]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-pane-edge px-4 py-2 text-[11px] text-pane-dim">
        <span>arrows / wasd — joystick</span>
        <span>space — cycle mode</span>
        <span>drag — rotate board</span>
        <span>drawings persist in EEPROM (localStorage)</span>
        <button
          onClick={() => setAngle({ rx: 48, rz: -14 })}
          className="ml-auto cursor-pointer border border-pane-edge px-2 py-0.5 text-pane-text/70 hover:border-clay hover:text-pane-text"
        >
          reset view
        </button>
      </div>

      <div
        ref={sceneRef}
        tabIndex={0}
        aria-label="SketchBoard breadboard. Use arrow keys to draw on the LCD."
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          drag.current = { x: e.clientX, y: e.clientY, rx: angle.rx, rz: angle.rz };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const d = drag.current;
          setAngle({
            rx: Math.min(80, Math.max(5, d.rx - (e.clientY - d.y) * 0.3)),
            rz: Math.min(75, Math.max(-75, d.rz - (e.clientX - d.x) * 0.3)),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="min-h-0 flex-1 touch-none overflow-auto outline-none focus-visible:ring-1 focus-visible:ring-clay"
        style={{
          perspective: "1400px",
          background: "radial-gradient(ellipse at 50% 30%, #33312e, #1f1e1c)",
          cursor: drag.current ? "grabbing" : "grab",
        }}
      >
        <div
          className="mx-auto my-10 h-[430px] w-[760px]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${angle.rx}deg) rotateZ(${angle.rz}deg)`,
            transition: drag.current ? "none" : "transform 200ms ease-out",
          }}
        >
          {/* breadboard */}
          <div
            className="absolute inset-0 rounded-md"
            style={{
              transformStyle: "preserve-3d",
              background:
                "radial-gradient(circle at 1px 1px, #b9b4a4 1.4px, transparent 1.6px) 0 0/14px 14px, linear-gradient(#dcd7c8, #cfcabb)",
              boxShadow: "0 30px 40px rgba(0,0,0,.5)",
              border: "1px solid #b5b0a1",
            }}
          >
            {/* power rails */}
            <div className="absolute left-0 right-0 top-2 h-[3px]" style={{ background: "#c0452f" }} />
            <div className="absolute left-0 right-0 top-5 h-[3px]" style={{ background: "#2f5ec0" }} />
            <div className="absolute bottom-5 left-0 right-0 h-[3px]" style={{ background: "#c0452f" }} />
            <div className="absolute bottom-2 left-0 right-0 h-[3px]" style={{ background: "#2f5ec0" }} />

            {/* wires */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 430" aria-hidden>
              <path d="M148 210 C 200 210, 220 180, 268 178" stroke="#c0452f" strokeWidth="3" fill="none" />
              <path d="M148 240 C 210 250, 230 196, 268 192" stroke="#e0a12f" strokeWidth="3" fill="none" />
              <path d="M392 150 C 430 140, 440 120, 466 112" stroke="#3f7d3f" strokeWidth="3" fill="none" />
              <path d="M392 170 C 436 166, 450 140, 470 130" stroke="#2f5ec0" strokeWidth="3" fill="none" />
              <path d="M330 232 C 330 280, 300 300, 262 322" stroke="#7d3f7d" strokeWidth="3" fill="none" />
              <text x="188" y="168" fontSize="11" fill="#6e6a60">ADC0/ADC1</text>
              <text x="420" y="106" fontSize="11" fill="#6e6a60">SPI → 5110</text>
              <text x="282" y="330" fontSize="11" fill="#6e6a60">PORTC → 16x02</text>
            </svg>

            {/* ATmega chip */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: 268, top: 148, width: 124, height: 88,
                background: "linear-gradient(#2c2b29, #1c1b1a)",
                transform: "translateZ(14px)", borderRadius: 4,
                boxShadow: "0 14px 10px rgba(0,0,0,.35)",
                border: "1px solid #444",
              }}
            >
              <span className="text-[10px] tracking-wider text-pane-dim">ATmega1284</span>
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i}>
                  <span className="absolute h-[6px] w-[10px] bg-[#8f8b82]" style={{ left: -10, top: 8 + i * 10 }} />
                  <span className="absolute h-[6px] w-[10px] bg-[#8f8b82]" style={{ right: -10, top: 8 + i * 10 }} />
                </span>
              ))}
            </div>

            {/* joystick module */}
            <div
              className="absolute"
              style={{
                left: 44, top: 168, width: 104, height: 104,
                background: "linear-gradient(#8c2f2f, #6e2222)", borderRadius: 8,
                transform: "translateZ(10px)", boxShadow: "0 12px 10px rgba(0,0,0,.35)",
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  left: 27, top: 27, width: 50, height: 50,
                  background: "radial-gradient(circle at 35% 30%, #4a4a4a, #111)",
                  transform: `translateZ(16px) translate(${stick.dx * 8}px, ${stick.dy * 8}px)`,
                  transition: "transform 120ms",
                  boxShadow: "0 10px 8px rgba(0,0,0,.45)",
                }}
              />
              {dpad.map((d) => (
                <button
                  key={d.label}
                  aria-label={`joystick ${d.label}`}
                  onClick={() => {
                    sceneRef.current?.focus();
                    move(d.dx, d.dy);
                  }}
                  className="absolute flex h-9 w-9 cursor-pointer items-center justify-center text-[11px] text-white/40 hover:text-white"
                  style={{ ...d.style, transform: "translateZ(18px)" }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Nokia 5110 LCD */}
            <div
              className="absolute"
              style={{
                left: 396, top: 50, width: W * SCALE + 24, height: H * SCALE + 34,
                background: "linear-gradient(#20304a, #16223a)", borderRadius: 8,
                transform: "translateZ(18px)", boxShadow: "0 16px 14px rgba(0,0,0,.4)",
                padding: 12,
              }}
            >
              <canvas
                ref={canvasRef}
                width={W * SCALE}
                height={H * SCALE}
                style={{ imageRendering: "pixelated", borderRadius: 3, display: "block" }}
              />
              <p className="mt-1 text-center text-[9px] tracking-widest text-white/35">NOKIA 5110 · 84×48</p>
            </div>

            {/* 16x02 LCD */}
            <div
              className="absolute px-3 py-2"
              style={{
                left: 96, top: 316, width: 230, height: 74,
                background: "linear-gradient(#123512, #0c260c)", borderRadius: 6,
                transform: "translateZ(12px)", boxShadow: "0 12px 10px rgba(0,0,0,.4)",
              }}
            >
              <div
                className="h-full w-full px-2 py-1 text-[13px] leading-6 tracking-[.18em]"
                style={{ background: "#7fae3f", color: "#12310a", borderRadius: 3, fontFamily: "var(--font-mono)" }}
              >
                <div>{lcdLine1}</div>
                <div>{lcdLine2}</div>
              </div>
            </div>

            {/* tactile buttons */}
            {(
              [
                { label: "MODE", fn: cycleMode },
                { label: "SLOT", fn: () => setSlot((s) => (s % 3) + 1) },
                { label: "SAVE", fn: save },
                { label: "LOAD", fn: load },
                { label: "CLR", fn: clearScreen },
              ] as const
            ).map((b, i) => (
              <button
                key={b.label}
                onClick={() => {
                  sceneRef.current?.focus();
                  b.fn();
                }}
                className="absolute cursor-pointer text-[9px] font-medium"
                style={{
                  left: 372 + i * 54, top: 330, width: 44, height: 44,
                  background: "linear-gradient(#3a3835, #262624)", color: "#ebe8e0",
                  borderRadius: 6, transform: "translateZ(12px)",
                  boxShadow: "0 8px 6px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)",
                  border: "1px solid #4a4844",
                }}
              >
                <span className="block h-3 w-3 rounded-full bg-[#c15f3c] mx-auto mb-1" style={{ boxShadow: "inset 0 -1px 2px rgba(0,0,0,.5)" }} />
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-pane-edge px-4 py-2 text-[11px] text-pane-dim">
        <span>
          mode: <span className="text-clay">{mode}</span>
        </span>
        <span>slot: {slot}/3</span>
        <span>cursor: {cursor.x},{cursor.y}</span>
        <span className="ml-auto">the real one ran on an ATmega1284 in Atmel Studio — this one runs in your browser</span>
      </div>
    </div>
  );
}
