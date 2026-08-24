import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "./data/profile";
import Orb, { type OrbState } from "./Orb";
import { WidgetGrid, type Widget } from "./jarvis/widgets";
import { localAnswer, greetingFor } from "./jarvis/local";

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
  const [widgets, setWidgets] = useState<Widget[]>([]);
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
    (r: { reply: string; widgets: Widget[] }) => {
      setReply(r.reply);
      setWidgets(r.widgets);
      setHistory((h) => [...h, { role: "model", text: r.reply }]);
      setOrb("idle");
      speak(r.reply);
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
        if (!data.reply) throw new Error("empty");
        deliver({ reply: data.reply, widgets: Array.isArray(data.widgets) ? data.widgets : [] });
        setOffline(false);
      } catch {
        setOffline(true);
        deliver(localAnswer(question, persona));
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
    deliver(greetingFor(key));
  }

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const live = phase === "live";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* HUD chrome */}
      <header className="flex items-center justify-between px-5 py-4 font-mono text-[11px] text-faded sm:px-8">
        <span>
          <span className="text-clay">SAGE</span> — {profile.name.toLowerCase()}'s ai
        </span>
        <span className="hidden sm:block">sys: {live ? (offline ? "local core" : "gemini core") : "standby"}</span>
        <a className="transition-colors hover:text-ink" href={profile.github} target="_blank" rel="noreferrer">
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
            <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-semibold uppercase tracking-[0.35em] text-ink/90">
              wake
            </span>
          )}
        </button>

        {phase === "asleep" && (
          <div className="fadein mt-6 text-center">
            <h1 className="font-display text-4xl font-bold tracking-wide">S.A.G.E.</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-faded">
              Surya's Agentic Guide & Engineer. It knows his work, builds dashboards on request,
              and runs his demos. Click the core.
            </p>
          </div>
        )}

        {phase === "mode" && (
          <div className="fadein mt-8 flex flex-col items-center gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-faded">choose interface</p>
            <div className="flex gap-4">
              <button
                onClick={() => chooseMode("chat")}
                className="hud cursor-pointer px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-clay transition-transform hover:scale-105"
              >
                💬 Chat
              </button>
              <button
                onClick={() => chooseMode("voice")}
                disabled={!voiceOK}
                className="hud cursor-pointer px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-moss transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
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
            <span className="text-clay">◆ </span>
            {reply}
          </p>
        )}
        {interim && <p className="caret mt-2 font-mono text-sm text-moss">{interim}</p>}
        {busy && <p className="caret mt-2 font-mono text-xs text-faded">assembling</p>}

        {phase === "persona" && (
          <div className="fadein mt-6 flex flex-wrap justify-center gap-3">
            {PERSONAS.map((p) => (
              <button
                key={p.key}
                onClick={() => choosePersona(p.key, p.label)}
                className="hud cursor-pointer px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-ink/90 transition-transform hover:scale-105"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* the dashboard SAGE builds */}
        {live && (
          <div className="mt-8 w-full pb-40">
            <WidgetGrid key={history.length} widgets={widgets} />
          </div>
        )}
      </main>

      {/* command dock */}
      {live && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/90 backdrop-blur">
          <div className="mx-auto max-w-4xl px-5 py-3.5">
            <div className="flex flex-wrap gap-2 pb-2.5">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => ask(sug)}
                  className="cursor-pointer rounded-full border border-hairline px-3 py-1.5 font-mono text-[11px] text-faded transition-colors hover:border-clay hover:text-ink"
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
                  className={`flex-1 cursor-pointer rounded-lg py-3 font-display text-sm font-bold uppercase tracking-[0.25em] transition-colors ${
                    orb === "listening" ? "bg-moss/20 text-moss" : "bg-clay/15 text-clay hover:bg-clay/25"
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
                    className="w-full rounded-lg border border-hairline bg-linen px-4 py-3 text-sm placeholder:text-faded focus:border-clay focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="cursor-pointer rounded-lg bg-clay px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-paper disabled:opacity-40"
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
                className="cursor-pointer rounded-lg border border-hairline px-3.5 py-3 text-sm text-faded transition-colors hover:border-clay hover:text-ink disabled:opacity-30"
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
