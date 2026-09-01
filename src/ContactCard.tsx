import { useState } from "react";
import { profile } from "./data/profile";
import { LinkedinIcon } from "./icons";

// This site is deployed to GitHub Pages, which has no server to accept a POST,
// so submissions go to Web3Forms, which relays them to my inbox. The access key
// is public by design — it only ever permits delivery to the address it was
// issued for. If the relay is down or the request is blocked, the form falls
// back to composing the message in the visitor's mail client: nothing is ever
// silently swallowed, which is the worst thing a contact form can do.
const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "5a1eef11-d95b-44e5-af3e-4461a4dcf92e";

type Status = { kind: "idle" | "sending" | "sent" | "handed-off" | "error"; detail?: string };

export function ContactCard({ compact = false }: { compact?: boolean }) {
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  // honeypot: hidden from people, irresistible to scripts that fill every field
  const [hp, setHp] = useState(false);

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

  const handOff = () => {
    const subject = encodeURIComponent("Hello from your site");
    const body = encodeURIComponent(`${message.trim()}\n\n— reply to: ${from.trim()}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setStatus({ kind: "handed-off" });
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
          body: JSON.stringify({
            access_key: ACCESS_KEY,
            subject: `${from.trim()} wrote from your site`,
            from_name: "surya-singh.com",
            email: from.trim(),
            message: message.trim(),
            botcheck: hp,
          }),
        });
        // Web3Forms answers 200 with { success: false } for a rejected key or a
        // caught bot, so the body decides, not the status alone.
        const out = await res.json().catch(() => null);
        if (!res.ok || !out?.success) throw new Error(String(res.status));
        setStatus({ kind: "sent" });
        setMessage("");
        return;
      } catch {
        // Hand the visitor their mail client rather than lose what they wrote.
        handOff();
        return;
      }
    }

    handOff();
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
        <input
          type="checkbox"
          name="botcheck"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          checked={hp}
          onChange={(e) => setHp(e.target.checked)}
          className="hidden"
        />
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
