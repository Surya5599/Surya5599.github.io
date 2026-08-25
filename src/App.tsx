import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "./data/profile";
import Orb, { type OrbState } from "./Orb";
import { WidgetGrid, type Widget } from "./jarvis/widgets";
import { localAnswer, greetingFor } from "./jarvis/local";
import { buildDashboardDoc } from "./jarvis/frame";
import { skills } from "./data/profile";
import SimModal from "./SimModal";
import { SIMS } from "./sims";

type Mode = "chat" | "voice";
type Phase = "asleep" | "mode" | "persona" | "live";
type Msg = { role: "user" | "model"; text: string };

const SUGGESTIONS = [
  "Build me a dashboard of his career",
  "Show his AI work",
  "What can I play with?",
  "What's his stack?",
  "How do I reach him?",
];

const PERSONAS = [
  { key: "recruiter", label: "I'm a recruiter" },
  { key: "engineer", label: "I'm an engineer" },
  { key: "curious", label: "Just curious" },
];

// minimal Web Speech typings (not in the default TS DOM lib)
type SpeechAlt = { transcript: string };
type SpeechResult = { isFinal: boolean; 0: SpeechAlt };
type SpeechEvent = { results: ArrayLike<SpeechResult> };
type Recognizer = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type Dash =
  | { kind: "gen"; html: string; demos: string[] }
  | { kind: "local"; widgets: Widget[] };

function DemoButtons({ slugs }: { slugs: string[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const valid = slugs.filter((sl) => SIMS[sl]);
  if (valid.length === 0) return null;
  const open = openSlug ? SIMS[openSlug] : null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-faded">live demos:</span>
      {valid.map((sl) => (
        <button
          key={sl}
          onClick={() => setOpenSlug(sl)}
          className="pill cursor-pointer bg-clay px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white"
        >
          ▶ run {skills.find((k) => k.slug === sl)?.name ?? sl} live
        </button>
      ))}
      {open && openSlug && (
        <SimModal title={open.title} onClose={() => setOpenSlug(null)}>
          <open.component />
        </SimModal>
      )}
    </div>
  );
}

function speechRecognitionCtor(): (new () => Recognizer) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as new () => Recognizer) ?? (w.webkitSpeechRecognition as new () => Recognizer) ?? null;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("asleep");
  const [mode, setMode] = useState<Mode>("chat");
  const [orb, setOrb] = useState<OrbState>("asleep");
  const [persona, setPersona] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [dash, setDash] = useState<Dash>({ kind: "local", widgets: [] });
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const voiceOK = speechRecognitionCtor() !== null;

  const speak = useCallback(
    (text: string) => {
      if (mode !== "voice" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.04;
      u.onstart = () => setOrb("speaking");
      u.onend = () => setOrb("idle");
      window.speechSynthesis.speak(u);
    },
    [mode],
  );

  const deliver = useCallback(
    (reply: string, d: Dash) => {
      setReply(reply);
      setDash(d);
      setHistory((h) => [...h, { role: "model", text: reply }]);
      setOrb("idle");
      speak(reply);
    },
    [speak],
  );

  const ask = useCallback(
    async (q: string) => {
      const question = q.trim();
      if (!question || busy) return;
      setInput("");
      setInterim("");
      setBusy(true);
      setOrb("thinking");
      const msgs = [...history, { role: "user" as const, text: question }];
      setHistory(msgs);
      try {
        const res = await fetch("/api/jarvis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs.slice(-10), persona }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!data.reply || !data.html) throw new Error("empty");
        deliver(data.reply, { kind: "gen", html: data.html, demos: Array.isArray(data.demos) ? data.demos : [] });
        setOffline(false);
      } catch {
        setOffline(true);
        const local = localAnswer(question, persona);
        deliver(local.reply, { kind: "local", widgets: local.widgets });
      } finally {
        setBusy(false);
      }
    },
    [busy, history, persona, deliver],
  );

  const listen = useCallback(() => {
    const Ctor = speechRecognitionCtor();
    if (!Ctor || busy) return;
    window.speechSynthesis?.cancel();
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onstart = () => setOrb("listening");
    rec.onresult = (e: SpeechEvent) => {
      let final = "";
      let inter = "";
      for (const r of Array.from(e.results)) {
        if (r.isFinal) final += r[0].transcript;
        else inter += r[0].transcript;
      }
      setInterim(inter);
      if (final) {
        rec.stop();
        ask(final);
      }
    };
    rec.onerror = () => setOrb("idle");
    rec.onend = () => {
      setInterim("");
      setOrb((o) => (o === "listening" ? "idle" : o));
    };
    rec.start();
  }, [ask, busy]);

  function wake() {
    if (phase !== "asleep") return;
    setPhase("mode");
    setOrb("idle");
  }

  function chooseMode(m: Mode) {
    setMode(m);
    setPhase("persona");
    setReply("Online. Who am I speaking with?");
    if (m === "voice") {
      const u = new SpeechSynthesisUtterance("Online. Who am I speaking with?");
      u.onstart = () => setOrb("speaking");
      u.onend = () => setOrb("idle");
      window.speechSynthesis?.speak(u);
    }
  }

  function choosePersona(key: string, label: string) {
    setPersona(key);
    setPhase("live");
    setHistory([{ role: "user", text: label }]);
    const greet = greetingFor(key);
    deliver(greet.reply, { kind: "local", widgets: greet.widgets });
  }

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // drill-down requests arriving from generated dashboards (sandboxed iframes)
  const askRef = useRef(ask);
  askRef.current = ask;
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; query?: string };
      if (d?.type !== "sage-drill" || typeof d.query !== "string") return;
      const q = d.query.trim().slice(0, 200);
      if (q) askRef.current(q);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const live = phase === "live";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* HUD chrome */}
      <header className="flex items-center justify-between px-5 py-4 text-sm sm:px-8">
        <span className="font-display text-2xl font-black tracking-tight">
          SAGE<span className="text-clay-deep">.</span>
        </span>
        <span className="hidden font-mono text-[11px] text-faded sm:block">
          {live ? (offline ? "● offline brain" : "● gemini brain") : "● standby"}
        </span>
        <a className="font-bold underline decoration-2 underline-offset-4 hover:text-clay-deep" href={profile.github} target="_blank" rel="noreferrer">
          github ↗
        </a>
      </header>

      <main className={`mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-5 ${live ? "" : "justify-center"}`}>
        {/* the core */}
        <button
          onClick={wake}
          disabled={phase !== "asleep"}
          aria-label={phase === "asleep" ? "Wake SAGE" : "SAGE core"}
          className={`relative transition-all duration-700 ${phase === "asleep" ? "cursor-pointer hover:scale-105" : ""}`}
        >
          <Orb state={orb} size={live ? 170 : 280} />
          {phase === "asleep" && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold uppercase tracking-[0.35em] text-ink">
              wake
            </span>
          )}
        </button>

        {phase === "asleep" && (
          <div className="fadein mt-6 text-center">
            <h1 className="font-display text-5xl font-black tracking-tight">Meet <span className="text-clay-deep">SAGE</span>.</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-faded">
              Surya's Agentic Guide & Engineer. Ask it anything — it designs a fresh dashboard
              for every question and runs his demos. Click the core to wake it.
            </p>
          </div>
        )}

        {phase === "mode" && (
          <div className="fadein mt-8 flex flex-col items-center gap-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-faded">how do you want to talk?</p>
            <div className="flex gap-4">
              <button
                onClick={() => chooseMode("chat")}
                className="pill cursor-pointer bg-clay px-8 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white"
              >
                💬 Chat
              </button>
              <button
                onClick={() => chooseMode("voice")}
                disabled={!voiceOK}
                className="pill cursor-pointer bg-moss px-8 py-3.5 text-sm font-extrabold uppercase tracking-widest text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                🎙 Voice
              </button>
            </div>
            {!voiceOK && <p className="font-mono text-[11px] text-faded">voice needs a Chromium-based browser</p>}
          </div>
        )}

        {/* SAGE's spoken line */}
        {(phase === "persona" || live) && reply && (
          <p key={reply.slice(0, 24)} className="fadein mt-5 max-w-xl text-center text-[15px] leading-relaxed text-ink/90">
            <span className="text-clay-deep">✿ </span>
            {reply}
          </p>
        )}
        {interim && <p className="caret mt-2 font-mono text-sm text-moss">{interim}</p>}
        {busy && <p className="caret mt-2 font-mono text-xs text-faded">designing your dashboard</p>}

        {phase === "persona" && (
          <div className="fadein mt-6 flex flex-wrap justify-center gap-3">
            {PERSONAS.map((p) => (
              <button
                key={p.key}
                onClick={() => choosePersona(p.key, p.label)}
                className="pill cursor-pointer bg-linen px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-ink"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* the dashboard SAGE builds */}
        {live && (
          <div className="mt-6 w-full pb-44">
            {dash.kind === "gen" && <DemoButtons slugs={dash.demos} />}
            {dash.kind === "gen" ? (
              <div className="hud flyin overflow-hidden p-1.5" key={history.length}>
                <iframe
                  title="Dashboard generated by SAGE"
                  sandbox="allow-scripts"
                  srcDoc={buildDashboardDoc(dash.html)}
                  className="h-[56vh] min-h-[420px] w-full rounded-md"
                />
                <p className="px-3 pb-1.5 pt-2 text-right text-[10px] font-bold text-faded">
                  ✿ designed live by SAGE, just for this question
                </p>
              </div>
            ) : (
              <WidgetGrid key={history.length} widgets={dash.widgets} />
            )}
          </div>
        )}
      </main>

      {/* command dock */}
      {live && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper/95 backdrop-blur">
          <div className="mx-auto max-w-4xl px-5 py-3.5">
            <div className="flex flex-wrap gap-2 pb-2.5">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => ask(sug)}
                  className="pill cursor-pointer bg-oat px-3.5 py-1.5 text-[11px] font-bold text-ink"
                >
                  {sug}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {mode === "voice" ? (
                <button
                  onClick={listen}
                  disabled={busy}
                  className={`pill flex-1 cursor-pointer py-3 text-sm font-extrabold uppercase tracking-[0.25em] ${
                    orb === "listening" ? "bg-moss text-ink" : "bg-clay text-white"
                  } disabled:opacity-40`}
                >
                  {orb === "listening" ? "listening…" : "🎙 tap to speak"}
                </button>
              ) : (
                <form
                  className="flex flex-1 items-center gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(input);
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask SAGE anything about Surya"
                    aria-label="Ask SAGE"
                    className="w-full rounded-full border-2 border-ink bg-linen px-5 py-3 text-sm placeholder:text-faded focus:outline-none focus:ring-2 focus:ring-clay"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="pill cursor-pointer bg-clay px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white disabled:opacity-40"
                  >
                    run
                  </button>
                </form>
              )}
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setMode((m) => (m === "chat" ? "voice" : "chat"));
                }}
                disabled={!voiceOK}
                title="Switch chat/voice"
                className="pill cursor-pointer bg-linen px-3.5 py-3 text-sm disabled:opacity-30"
              >
                {mode === "chat" ? "🎙" : "💬"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
