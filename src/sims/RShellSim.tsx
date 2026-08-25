import { useEffect, useRef, useState } from "react";
import { defaultFs, runLine } from "./rshell";

type Entry = { cmd: string; out: string; status: number; tree: string[] };

const EXAMPLES = [
  "help",
  "echo hello && echo world",
  'false || echo "saved by the connector"',
  "(echo a; echo b) && echo c",
  "echo dear diary > diary.txt; ls",
  "cat README.md | grep connector | wc",
];

export default function RShellSim() {
  const [fs] = useState(defaultFs);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [showTree, setShowTree] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [entries]);

  // bridge for the site tour: lets the tour type commands into this shell
  const runRef = useRef<(line: string) => void>(() => {});
  useEffect(() => {
    (window as unknown as { __rshellRun?: (c: string) => void }).__rshellRun = (c) => runRef.current(c);
    return () => {
      delete (window as unknown as { __rshellRun?: (c: string) => void }).__rshellRun;
    };
  }, []);

  function run(line: string) {
    const cmd = line.trim();
    if (!cmd) return;
    setError(null);
    setInput("");
    if (cmd === "clear") {
      setEntries([]);
      return;
    }
    const res = runLine(cmd, fs);
    if ("error" in res) {
      setEntries((e) => [...e, { cmd, out: `rshell: syntax error: ${res.error}\n`, status: 2, tree: [] }]);
    } else {
      setEntries((e) => [...e, { cmd, out: res.result.out, status: res.result.status, tree: res.tree }]);
    }
    inputRef.current?.focus();
  }
  runRef.current = run;

  return (
    <div className="flex min-h-0 flex-1 flex-col font-mono text-[13px] leading-relaxed">
      <div className="flex flex-wrap items-center gap-2 border-b border-pane-edge px-4 py-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => run(ex)}
            className="border border-pane-edge px-2 py-0.5 text-[11px] text-pane-text/70 hover:border-clay hover:text-pane-text cursor-pointer"
          >
            {ex}
          </button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11px] text-pane-dim">
          <input
            type="checkbox"
            checked={showTree}
            onChange={(e) => setShowTree(e.target.checked)}
            className="accent-[#c15f3c]"
          />
          show parse tree
        </label>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {entries.length === 0 && (
          <p className="text-pane-dim">
            This is RShell, rebuilt in your browser. It parses commands into the same composite
            pattern the C++ original used — SingleCommand, MultipleCommands, ParenthesisCommand,
            SymbolsCommand — then executes the tree. Click an example above or type{" "}
            <span className="text-pane-text">help</span>.
          </p>
        )}
        {entries.map((e, i) => (
          <div key={i}>
            <p>
              <span className="text-clay">$</span> <span className="text-pane-text">{e.cmd}</span>
            </p>
            {e.out && <pre className="whitespace-pre-wrap text-pane-text/85">{e.out}</pre>}
            <p className={e.status === 0 ? "text-moss" : "text-clay"}>
              {e.status === 0 ? "✓ exit 0" : `✗ exit ${e.status}`}
            </p>
            {showTree && e.tree.length > 0 && (
              <pre className="mt-1 border-l border-pane-edge pl-3 text-[11px] text-pane-dim">
                {e.tree.join("\n")}
              </pre>
            )}
          </div>
        ))}
        {error && <p className="text-clay">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
        className="flex items-center gap-3 border-t border-pane-edge px-4 py-3"
      >
        <span className="text-clay" aria-hidden>
          $
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='try: (echo a; echo b) > out.txt && cat out.txt'
          aria-label="RShell command input"
          autoFocus
          className="w-full bg-transparent text-pane-text placeholder:text-pane-dim focus:outline-none"
        />
      </form>
    </div>
  );
}
