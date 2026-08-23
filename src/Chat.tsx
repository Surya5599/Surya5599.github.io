import { useRef, useState } from "react";

type Msg = { role: "user" | "model"; text: string };

const SUGGESTIONS = [
  "What is Surya building right now?",
  "Has he worked with databases?",
  "What's the lowest-level thing he's built?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const history = [...messages, { role: "user", text: q } as Msg];
    setMessages(history);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { text: string };
      setMessages((m) => [...m, { role: "model", text: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setMessages((m) => m.slice(0, -1));
      setInput(q);
    } finally {
      setBusy(false);
      endRef.current?.scrollIntoView({ block: "nearest" });
    }
  }

  return (
    <div className="mt-8 border border-pane-edge bg-pane text-pane-text">
      <header className="flex items-center justify-between border-b border-pane-edge px-5 py-2 font-mono text-xs text-pane-dim">
        <span>surya-agent — interactive</span>
        <span>
          <span className={busy ? "text-clay" : "text-moss"}>●</span> {busy ? "thinking" : "ready"}
        </span>
      </header>

      <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-5 font-mono text-[13px] leading-relaxed">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-pane-dim">
              Ask anything about my projects or experience — answered by Gemini with my work as
              context.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="border border-pane-edge px-3 py-1 text-xs text-pane-text/80 hover:border-clay hover:text-pane-text cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i}>
            <span className={m.role === "user" ? "text-clay" : "text-moss"}>
              {m.role === "user" ? "> you" : "◆ agent"}
            </span>
            <p className="mt-1 whitespace-pre-wrap text-pane-text/90">{m.text}</p>
          </div>
        ))}
        {busy && <p className="caret text-pane-dim">thinking</p>}
        {error && <p className="text-clay">✗ {error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-3 border-t border-pane-edge px-5 py-3"
      >
        <span className="font-mono text-sm text-clay" aria-hidden>
          &gt;
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about my work"
          aria-label="Ask a question about Surya's work"
          className="w-full bg-transparent font-mono text-[13px] text-pane-text placeholder:text-pane-dim focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="font-mono text-xs text-pane-dim hover:text-pane-text disabled:opacity-40 cursor-pointer"
        >
          send ⏎
        </button>
      </form>
    </div>
  );
}
