import { useEffect, useRef, useState } from "react";
import { profile } from "./data/profile";
import { NODES, STARTERS, TOTAL, type DialogueNode } from "./dialogue";
import SimModal from "./SimModal";
import { SIMS } from "./sims";

type Entry =
  | { kind: "q"; text: string }
  | { kind: "a"; node: DialogueNode }
  | { kind: "ai"; text: string }
  | { kind: "ai-thinking" };

function Answer({ node }: { node: DialogueNode }) {
  const [simOpen, setSimOpen] = useState(false);
  const sim = node.sim ? SIMS[node.sim] : undefined;
  return (
    <div className="relative pl-6 sm:pl-8">
      <span className="rule-grow absolute bottom-1 left-0 top-1 w-[2px] bg-clay" aria-hidden />
      {node.answer.map((p) => (
        <p key={p.slice(0, 24)} className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink/90 first:mt-0 sm:text-lg">
          {p}
        </p>
      ))}
      {(sim || node.repo) && (
        <div className="mt-5 flex flex-wrap gap-4">
          {sim && (
            <button
              onClick={() => setSimOpen(true)}
              className="cursor-pointer rounded-full bg-clay px-5 py-2 text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
            >
              ▶ Try it right here
            </button>
          )}
          {node.repo && (
            <a
              href={node.repo}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-hairline px-5 py-2 text-sm text-faded transition-colors hover:border-clay hover:text-ink"
            >
              See the code ↗
            </a>
          )}
        </div>
      )}
      {sim && simOpen && (
        <SimModal title={sim.title} onClose={() => setSimOpen(false)}>
          <sim.component />
        </SimModal>
      )}
    </div>
  );
}

export default function App() {
  const [thread, setThread] = useState<Entry[]>([]);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const started = thread.length > 0;

  useEffect(() => {
    if (started) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, started]);

  function ask(id: string) {
    const node = NODES[id];
    if (!node || busy) return;
    setThread((t) => [...t, { kind: "q", text: node.chip }, { kind: "a", node }]);
    setVisited((v) => new Set(v).add(id));
  }

  async function askAI(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setThread((t) => [...t, { kind: "q", text: q }, { kind: "ai-thinking" }]);
    try {
      const history = thread
        .filter((e): e is Extract<Entry, { kind: "q" | "ai" }> => e.kind === "q" || e.kind === "ai")
        .slice(-10)
        .map((e) => ({ role: e.kind === "q" ? "user" : "model", text: e.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", text: q }] }),
      });
      const data = await res.json();
      const text = res.ok
        ? (data.text as string)
        : `${data?.error ?? "The AI is unavailable right now."} You can still click any question — those answers are built in.`;
      setThread((t) => [...t.slice(0, -1), { kind: "ai", text }]);
    } catch {
      setThread((t) => [
        ...t.slice(0, -1),
        { kind: "ai", text: "The AI is unavailable right now. The clickable questions all work — they're built in." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // follow-ups from the last canned answer, else starters; hide visited unless few remain
  const lastNode = [...thread].reverse().find((e): e is Extract<Entry, { kind: "a" }> => e.kind === "a")?.node;
  const offered = (lastNode ? lastNode.followups : STARTERS).filter((id) => NODES[id]);
  const fresh = offered.filter((id) => !visited.has(id));
  const chips = (fresh.length >= 2 ? fresh : offered).slice(0, 4);
  const unexplored = Object.keys(NODES).filter((id) => !visited.has(id));

  return (
    <div className="flex min-h-dvh flex-col">
      {/* masthead */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between px-5 py-4">
          <span className="font-display text-lg">The {profile.name} Interview</span>
          <span className="text-xs text-faded">
            {visited.size === 0 ? "unlimited questions · no notes" : `${visited.size}/${TOTAL} questions asked`}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        {/* opening */}
        {!started && (
          <div className="pt-20 sm:pt-28">
            <p className="rise text-sm tracking-widest text-faded">PRESS KIT? NO. PORTFOLIO? SORT OF.</p>
            <h1 className="rise mt-6 font-display text-6xl leading-[1.02] sm:text-8xl" style={{ animationDelay: "80ms" }}>
              Interview
              <br />
              <em className="text-clay">me.</em>
            </h1>
            <p className="rise mt-8 max-w-xl text-lg leading-relaxed text-ink/85" style={{ animationDelay: "160ms" }}>
              I'm {profile.name} — a data engineer who builds AI agents by day and ships apps,
              shells, and circuit boards by night. Don't scroll a résumé. Ask questions. Click one
              to begin.
            </p>
          </div>
        )}

        {/* transcript */}
        <div className="space-y-10 pt-10">
          {thread.map((e, i) => {
            if (e.kind === "q")
              return (
                <p key={i} className="rise font-display text-2xl italic text-faded sm:text-3xl">
                  “{e.text}”
                </p>
              );
            if (e.kind === "a")
              return (
                <div key={i} className="rise">
                  <Answer node={e.node} />
                </div>
              );
            if (e.kind === "ai-thinking")
              return (
                <p key={i} className="caret pl-6 text-faded sm:pl-8">
                  thinking
                </p>
              );
            return (
              <div key={i} className="rise relative pl-6 sm:pl-8">
                <span className="absolute bottom-1 left-0 top-1 w-[2px] bg-violet" aria-hidden />
                <p className="max-w-2xl text-[17px] leading-relaxed text-ink/90 sm:text-lg">{e.text}</p>
                <p className="mt-2 text-xs text-faded">— answered live by my AI (Gemini), grounded in my real work</p>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </main>

      {/* question dock */}
      <div className="sticky bottom-0 border-t border-hairline bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex flex-wrap gap-2.5">
            {chips.map((id, i) => (
              <button
                key={id + thread.length}
                onClick={() => ask(id)}
                className="rise cursor-pointer rounded-full border border-hairline px-4 py-2 text-sm text-ink/85 transition-all hover:border-clay hover:text-ink"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {NODES[id].chip}
                {visited.has(id) && <span className="ml-1.5 text-faded">✓</span>}
              </button>
            ))}
            {started && unexplored.length > 0 && chips.every((c) => visited.has(c)) && (
              <button
                onClick={() => ask(unexplored[0])}
                className="cursor-pointer rounded-full border border-hairline px-4 py-2 text-sm text-faded hover:border-clay hover:text-ink"
              >
                Surprise me
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askAI(input);
            }}
            className="mt-3 flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="…or ask in your own words (my AI answers)"
              aria-label="Ask your own question"
              className="w-full rounded-full border border-hairline bg-linen px-4 py-2.5 text-sm placeholder:text-faded focus:border-clay focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="cursor-pointer rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
            >
              Ask
            </button>
          </form>
          <p className="mt-2 flex justify-between text-[11px] text-faded">
            <span>
              {profile.location} · <a className="hover:text-ink" href={`mailto:${profile.email}`}>{profile.email}</a> ·{" "}
              <a className="hover:text-ink" href={profile.github} target="_blank" rel="noreferrer">github</a>
            </span>
            {visited.size >= TOTAL && <span className="text-clay">full interview complete — thanks for asking everything</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
