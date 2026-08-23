// A faithful-in-spirit browser recreation of RShell (C++ shell coursework):
// connectors && || ;, parentheses precedence, pipes, redirection, and
// # comments — executed against an in-memory filesystem. Alongside output it
// exposes the parse tree using the real project's class names
// (SingleCommand, MultipleCommands, ParenthesisCommand, SymbolsCommand).

export type Ast =
  | { kind: "single"; argv: string[] }
  | { kind: "multi"; parts: Ast[]; ops: ("&&" | "||" | ";")[] }
  | { kind: "pipe"; parts: Ast[] }
  | { kind: "redir"; child: Ast; redirs: { op: ">" | ">>" | "<"; file: string }[] }
  | { kind: "paren"; child: Ast };

export type Fs = Map<string, string>;

export function defaultFs(): Fs {
  return new Map([
    ["README.md", "RShell: a Unix-style shell in C++.\nBuilt from fork(), execvp() and waitpid() up.\nTry the connectors: && runs on success, || runs on failure.\n"],
    ["notes.txt", "composite pattern\nparse, then execute\n"],
  ]);
}

const TOKEN_RE = /"[^"]*"|&&|\|\||>>|[;|<>()]|[^\s;|<>()&"]+|&/g;

function tokenize(line: string): string[] {
  // '#' starts a comment unless inside quotes — same rule as the original
  let cut = line.length;
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuote = !inQuote;
    if (line[i] === "#" && !inQuote) {
      cut = i;
      break;
    }
  }
  return line.slice(0, cut).match(TOKEN_RE) ?? [];
}

class Parser {
  private pos = 0;
  constructor(private toks: string[]) {}

  parse(): Ast {
    const node = this.sequence();
    if (this.pos < this.toks.length) throw new Error(`unexpected token '${this.toks[this.pos]}'`);
    return node;
  }

  private sequence(): Ast {
    const parts = [this.pipeline()];
    const ops: ("&&" | "||" | ";")[] = [];
    while (["&&", "||", ";"].includes(this.peek() ?? "")) {
      ops.push(this.next() as "&&" | "||" | ";");
      if (this.peek() === undefined || this.peek() === ")") {
        if (ops[ops.length - 1] === ";") {
          ops.pop();
          break;
        }
        throw new Error(`expected a command after '${ops[ops.length - 1]}'`);
      }
      parts.push(this.pipeline());
    }
    return parts.length === 1 ? parts[0] : { kind: "multi", parts, ops };
  }

  private pipeline(): Ast {
    const parts = [this.redirected()];
    while (this.peek() === "|") {
      this.next();
      parts.push(this.redirected());
    }
    return parts.length === 1 ? parts[0] : { kind: "pipe", parts };
  }

  private redirected(): Ast {
    const child = this.primary();
    const redirs: { op: ">" | ">>" | "<"; file: string }[] = [];
    while ([">", ">>", "<"].includes(this.peek() ?? "")) {
      const op = this.next() as ">" | ">>" | "<";
      const file = this.next();
      if (!file || ["&&", "||", ";", "|", "(", ")", ">", ">>", "<"].includes(file))
        throw new Error(`expected a filename after '${op}'`);
      redirs.push({ op, file: unquote(file) });
    }
    return redirs.length ? { kind: "redir", child, redirs } : child;
  }

  private primary(): Ast {
    if (this.peek() === "(") {
      this.next();
      const inner = this.sequence();
      if (this.next() !== ")") throw new Error("missing ')'");
      return { kind: "paren", child: inner };
    }
    const argv: string[] = [];
    while (
      this.peek() !== undefined &&
      !["&&", "||", ";", "|", "(", ")", ">", ">>", "<"].includes(this.peek()!)
    ) {
      argv.push(unquote(this.next()));
    }
    if (argv.length === 0) throw new Error("expected a command");
    return { kind: "single", argv };
  }

  private peek() {
    return this.toks[this.pos];
  }
  private next() {
    return this.toks[this.pos++];
  }
}

function unquote(t: string): string {
  return t.startsWith('"') && t.endsWith('"') && t.length >= 2 ? t.slice(1, -1) : t;
}

type Result = { status: number; out: string };

const HELP = `rshell (browser edition) — supported today:
  echo, cat, ls, grep, wc, pwd, whoami, true, false, help
  cmd1 && cmd2     run cmd2 only if cmd1 succeeds
  cmd1 || cmd2     run cmd2 only if cmd1 fails
  cmd1 ;  cmd2     run both
  (a ; b) && c     parentheses set precedence
  cmd > file       write output   (>> appends, < reads)
  cmd1 | cmd2      pipe
  # anything after a hash is a comment`;

function runSingle(argv: string[], stdin: string, fs: Fs): Result {
  const [cmd, ...args] = argv;
  switch (cmd) {
    case "echo":
      return { status: 0, out: args.join(" ") + "\n" };
    case "pwd":
      return { status: 0, out: "/home/guest\n" };
    case "whoami":
      return { status: 0, out: "guest\n" };
    case "true":
      return { status: 0, out: "" };
    case "false":
      return { status: 1, out: "" };
    case "help":
      return { status: 0, out: HELP + "\n" };
    case "ls":
      return { status: 0, out: [...fs.keys()].sort().join("\n") + "\n" };
    case "cat": {
      if (args.length === 0) return { status: 0, out: stdin };
      let out = "";
      for (const f of args) {
        const body = fs.get(f);
        if (body === undefined) return { status: 1, out: `cat: ${f}: no such file\n` };
        out += body;
      }
      return { status: 0, out };
    }
    case "grep": {
      if (args.length === 0) return { status: 1, out: "grep: usage: grep pattern [file]\n" };
      const [pat, file] = args;
      const src = file !== undefined ? fs.get(file) : stdin;
      if (src === undefined) return { status: 1, out: `grep: ${file}: no such file\n` };
      const hits = src.split("\n").filter((l) => l.includes(pat));
      return { status: hits.length ? 0 : 1, out: hits.length ? hits.join("\n") + "\n" : "" };
    }
    case "wc": {
      const src = args[0] !== undefined ? fs.get(args[0]) : stdin;
      if (src === undefined) return { status: 1, out: `wc: ${args[0]}: no such file\n` };
      const lines = src === "" ? 0 : src.split("\n").length - (src.endsWith("\n") ? 1 : 0);
      const words = src.split(/\s+/).filter(Boolean).length;
      return { status: 0, out: `${lines} lines  ${words} words  ${src.length} chars\n` };
    }
    default:
      return { status: 127, out: `rshell: ${cmd}: command not found\n` };
  }
}

function exec(node: Ast, stdin: string, fs: Fs): Result {
  switch (node.kind) {
    case "single":
      return runSingle(node.argv, stdin, fs);
    case "paren":
      return exec(node.child, stdin, fs);
    case "multi": {
      let out = "";
      let status = 0;
      for (let i = 0; i < node.parts.length; i++) {
        if (i > 0) {
          const op = node.ops[i - 1];
          if (op === "&&" && status !== 0) continue;
          if (op === "||" && status === 0) continue;
        }
        const r = exec(node.parts[i], stdin, fs);
        out += r.out;
        status = r.status;
      }
      return { status, out };
    }
    case "pipe": {
      let data = stdin;
      let status = 0;
      for (const part of node.parts) {
        const r = exec(part, data, fs);
        data = r.out;
        status = r.status;
      }
      return { status, out: data };
    }
    case "redir": {
      let input = stdin;
      for (const r of node.redirs) {
        if (r.op === "<") {
          const body = fs.get(r.file);
          if (body === undefined) return { status: 1, out: `rshell: ${r.file}: no such file\n` };
          input = body;
        }
      }
      const res = exec(node.child, input, fs);
      let consumed = false;
      for (const r of node.redirs) {
        if (r.op === ">") {
          fs.set(r.file, res.out);
          consumed = true;
        } else if (r.op === ">>") {
          fs.set(r.file, (fs.get(r.file) ?? "") + res.out);
          consumed = true;
        }
      }
      return { status: res.status, out: consumed ? "" : res.out };
    }
  }
}

export function renderTree(node: Ast, indent = ""): string[] {
  switch (node.kind) {
    case "single":
      return [`${indent}SingleCommand [${node.argv.join(" ")}]`];
    case "multi": {
      const lines = [`${indent}MultipleCommands (${node.ops.join(" ")})`];
      node.parts.forEach((p) => lines.push(...renderTree(p, indent + "  ")));
      return lines;
    }
    case "pipe": {
      const lines = [`${indent}SymbolsCommand (pipe |)`];
      node.parts.forEach((p) => lines.push(...renderTree(p, indent + "  ")));
      return lines;
    }
    case "redir": {
      const ops = node.redirs.map((r) => `${r.op} ${r.file}`).join(", ");
      return [`${indent}SymbolsCommand (${ops})`, ...renderTree(node.child, indent + "  ")];
    }
    case "paren":
      return [`${indent}ParenthesisCommand ( )`, ...renderTree(node.child, indent + "  ")];
  }
}

export function runLine(line: string, fs: Fs): { result: Result; tree: string[] } | { error: string } {
  const toks = tokenize(line);
  if (toks.length === 0) return { result: { status: 0, out: "" }, tree: [] };
  try {
    const ast = new Parser(toks).parse();
    return { result: exec(ast, "", fs), tree: renderTree(ast) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "parse error" };
  }
}
