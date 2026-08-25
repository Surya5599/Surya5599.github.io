import { useCallback, useEffect, useRef, useState } from "react";

// Recreation of the OCR equation solver: capture → OCR → regex → eval → click.
// The original used pytesseract against a math app; this one animates every
// stage of that pipeline against a generated equation.

type Stage = "idle" | "capture" | "ocr" | "regex" | "eval" | "click" | "done";

const STAGES: { key: Stage; label: string }[] = [
  { key: "capture", label: "capture screen" },
  { key: "ocr", label: "OCR (pytesseract)" },
  { key: "regex", label: "validate with regex" },
  { key: "eval", label: "evaluate" },
  { key: "click", label: "click the answer" },
];

const REGEX_SRC = String.raw`^\s*(\d+)\s*([+\-x])\s*(\d+)\s*=?\s*$`;

function makeProblem(seed: number) {
  const r = (n: number, salt: number) => Math.abs(Math.floor(Math.sin(seed * 971 + salt * 137.3) * 1e4)) % n;
  const a = r(90, 1) + 10;
  const b = r(90, 2) + 10;
  const op = (["+", "-", "x"] as const)[r(3, 3)];
  const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
  const wrongs = new Set<number>();
  let k = 4;
  while (wrongs.size < 3) {
    const w = ans + (r(21, k) - 10 || 7 + k);
    if (w !== ans) wrongs.add(w);
    k++;
  }
  const options = [...wrongs, ans].sort((x, y) => ((x * 7919) % 13) - ((y * 7919) % 13));
  return { a, b, op, ans, options, text: `${a} ${op} ${b} =` };
}

export default function OcrSim() {
  const [seed, setSeed] = useState(1);
  const [stage, setStage] = useState<Stage>("idle");
  const [ocrChars, setOcrChars] = useState(0);
  const [solved, setSolved] = useState(0);
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 105, down: false });
  const [log, setLog] = useState<string[]>(["ready — run the solver, or watch it loop"]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const problem = makeProblem(seed);

  const addLog = (m: string) => setLog((l) => [...l.slice(-6), m]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = useCallback(() => {
    if (stage !== "idle" && stage !== "done") return;
    const p = makeProblem(seed);
    setClickedIdx(null);
    setOcrChars(0);
    setCursor({ x: 50, y: 105, down: false });
    setStage("capture");
    addLog("▸ capturing app window…");
    later(() => {
      setStage("ocr");
      addLog("▸ pytesseract.image_to_string(img)");
    }, 550);
    // ocr reveals characters
    const chars = p.text.length;
    for (let i = 1; i <= chars; i++) later(() => setOcrChars(i), 550 + i * 90);
    later(() => {
      setStage("regex");
      addLog(`▸ re.match(r"${REGEX_SRC.slice(0, 24)}…") → groups('${p.a}', '${p.op}', '${p.b}')`);
    }, 700 + chars * 90);
    later(() => {
      setStage("eval");
      addLog(`▸ eval: ${p.a} ${p.op === "x" ? "*" : p.op} ${p.b} = ${p.ans}`);
    }, 1500 + chars * 90);
    later(() => {
      setStage("click");
      const idx = p.options.indexOf(p.ans);
      addLog(`▸ pyautogui.click(option ${idx + 1})`);
      setCursor({ x: 12.5 + idx * 25, y: 84, down: false });
      later(() => {
        setCursor({ x: 12.5 + idx * 25, y: 84, down: true });
        setClickedIdx(idx);
        setSolved((n) => n + 1);
      }, 750);
    }, 2200 + chars * 90);
    later(() => {
      setStage("done");
      addLog("✓ solved. next equation…");
      later(() => setSeed((v) => v + 1), 900);
      later(() => setStage("idle"), 950);
    }, 3400 + chars * 90);
  }, [stage, seed, later]);

  // gentle auto-loop after first run completes
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (auto && stage === "idle") {
      const t = setTimeout(run, 500);
      return () => clearTimeout(t);
    }
  }, [auto, stage, run]);

  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="flex min-h-0 flex-1 flex-col font-mono text-[13px]">
      <div className="flex flex-wrap items-center gap-3 border-b border-pane-edge px-4 py-2 text-[11px]">
        <button
          onClick={run}
          disabled={stage !== "idle" && stage !== "done"}
          className="cursor-pointer rounded-full border border-clay px-4 py-1 font-bold text-clay hover:bg-clay/10 disabled:opacity-40"
        >
          ▶ run solver
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 text-pane-dim">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[#c98d82]" />
          loop forever
        </label>
        <span className="ml-auto text-pane-dim">
          solved: <span className="text-moss">{solved}</span>
        </span>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-[3fr_2fr]">
        {/* the "math app" being solved */}
        <div className="relative select-none self-start rounded-xl border border-pane-edge bg-[#f5f2ea] p-5 text-ink" style={{ color: "#1c1b1a" }}>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a8579]">math practice app</p>
          <div className="relative mx-auto mt-4 w-fit rounded-lg bg-white px-8 py-4 text-4xl font-bold tracking-wider shadow-inner" style={{ fontFamily: "Georgia, serif" }}>
            {problem.text.split("").map((ch, i) => (
              <span key={i} style={{ opacity: stage === "ocr" ? (i < ocrChars ? 1 : 0.25) : 1, background: stage === "ocr" && i === ocrChars ? "#c98d82" : "transparent" }}>
                {ch}
              </span>
            ))}
            {stage === "capture" && <div className="absolute inset-0 animate-pulse rounded-lg bg-white/80" />}
            {stage === "ocr" && (
              <div
                className="absolute bottom-0 top-0 w-[3px] bg-[#c0685a] transition-all duration-100"
                style={{ left: `${(ocrChars / problem.text.length) * 100}%` }}
              />
            )}
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {problem.options.map((o, i) => (
              <div
                key={i}
                className="rounded-lg border-2 py-2.5 text-center text-lg font-bold transition-all"
                style={{
                  borderColor: clickedIdx === i ? "#4e8d6e" : "#1c1b1a",
                  background: clickedIdx === i ? "#8fbfa8" : "#fff",
                  transform: clickedIdx === i ? "scale(1.06)" : "none",
                }}
              >
                {o}
              </div>
            ))}
          </div>
          {/* fake cursor */}
          <div
            className="pointer-events-none absolute z-10 transition-all duration-700 ease-out"
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%`, transform: cursor.down ? "scale(0.8)" : "scale(1)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M4 2 L20 12 L12 13.5 L9 21 Z" fill="#1c1b1a" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* pipeline panel */}
        <div className="space-y-3 self-start">
          <div className="space-y-1.5">
            {STAGES.map((s, i) => {
              const state = stage === "done" ? "done" : i < stageIdx ? "done" : i === stageIdx ? "now" : "wait";
              return (
                <div key={s.key} className={`flex items-center gap-2.5 rounded-md border px-3 py-1.5 text-[12px] ${
                  state === "now" ? "border-clay text-pane-text" : state === "done" ? "border-pane-edge text-moss" : "border-pane-edge text-pane-dim"
                }`}>
                  <span>{state === "done" ? "✓" : state === "now" ? "●" : "○"}</span>
                  {s.label}
                  {s.key === "ocr" && state === "now" && (
                    <span className="ml-auto text-clay">"{problem.text.slice(0, ocrChars)}"</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="rounded-md border border-pane-edge bg-black/25 p-3">
            <p className="text-[10px] uppercase tracking-widest text-pane-dim">solver log</p>
            <div className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-pane-text/80">
              {log.map((l, i) => <p key={i}>{l}</p>)}
            </div>
          </div>
          <p className="text-[10.5px] leading-relaxed text-pane-dim">
            The real one screenshotted a math app, read the equation with pytesseract, validated it
            with a regex, evaluated it, and auto-clicked the right answer —{" "}
            <a className="text-clay underline" href="https://youtu.be/SVFRD3A5OtA" target="_blank" rel="noreferrer">
              demo video ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
