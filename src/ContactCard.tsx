import { useState } from "react";
import { profile } from "./data/profile";
import { LinkedinIcon } from "./icons";

// This site is deployed to GitHub Pages, which has no server to accept a POST,
// so out of the box the form composes the message and hands it to the visitor's
// mail client. Nothing is ever silently swallowed, which is the worst thing a
// contact form can do.
//
// To make submissions arrive without a mail client, put a form endpoint here
// (Formspree, Web3Forms, Basin — any of them will do, all have a free tier) and
// the same form POSTs to it instead. That is the only change needed.
const FORM_ENDPOINT = "";

type Status = { kind: "idle" | "sending" | "sent" | "handed-off" | "error"; detail?: string };

export function ContactCard({ compact = false }: { compact?: boolean }) {
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

  const valid = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(from.trim()) && message.trim().length > 2;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setStatus({ kind: "error", detail: "Couldn't reach the clipboard — the address is above." });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setStatus({ kind: "error", detail: "An email I can reply to, and a line or two, and it's away." });
      return;
    }

    if (FORM_ENDPOINT) {
      setStatus({ kind: "sending" });
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email: from.trim(), message: message.trim(), source: "surya-singh.com" }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus({ kind: "sent" });
        setMessage("");
        return;
      } catch {
        setStatus({ kind: "error", detail: "That didn't go through. The address above always works." });
        return;
      }
    }

    const subject = encodeURIComponent("Hello from your site");
    const body = encodeURIComponent(`${message.trim()}\n\n— reply to: ${from.trim()}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setStatus({ kind: "handed-off" });
  };

  const field =
    "w-full rounded-xl border-2 border-ink bg-linen px-3 py-2 text-sm font-semibold placeholder:text-faded/70 focus:outline-none";

  return (
    <div className={`hud ${compact ? "p-4" : "p-5"}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-clay-deep">contact me</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          title="Copy to clipboard"
          className="pill cursor-pointer bg-linen px-3 py-1.5 text-[13px] font-extrabold"
        >
          {copied ? "copied ✓" : profile.email}
        </button>
        <a
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
          className="pill inline-flex cursor-pointer items-center gap-1.5 bg-linen px-3 py-1.5 text-[13px] font-extrabold"
        >
          <LinkedinIcon className="h-4 w-4" />
          LinkedIn
        </a>
      </div>

      <form onSubmit={submit} className="mt-3.5 grid gap-2">
        <label className="sr-only" htmlFor="contact-email">
          Your email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="your@email.com"
          className={field}
        />
        <label className="sr-only" htmlFor="contact-message">
          Your message
        </label>
        <textarea
          id="contact-message"
          rows={compact ? 2 : 3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          className={`${field} resize-y`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status.kind === "sending"}
            className="pill cursor-pointer bg-clay px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {status.kind === "sending" ? "sending…" : "send it →"}
          </button>
          <p aria-live="polite" className="min-h-[1rem] text-[11px] font-semibold leading-snug text-faded">
            {status.kind === "sent" && "Got it — I'll reply to that address."}
            {status.kind === "handed-off" && "Your mail app should be open. If it isn't, copy the address above."}
            {status.kind === "error" && status.detail}
          </p>
        </div>
      </form>
    </div>
  );
}
