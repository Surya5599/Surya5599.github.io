import type { Handler } from "@netlify/functions";
import { profile, skills, experience, toolbox, education } from "../../src/data/profile";

// SAGE's generative core: Gemini AUTHORS a complete dashboard (HTML/CSS/JS)
// per query — artifacts-style. The frontend renders it in a sandboxed,
// CSP-locked iframe, so the generated code can animate but never reach out.

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Spoken answer, max 45 words, first person as SAGE" },
    html: {
      type: "string",
      description: "Complete dashboard markup: HTML with one inline <style> block and optional one inline <script>. No <html>/<head>/<body> wrapper.",
    },
    demos: {
      type: "array",
      items: { type: "string" },
      description: "Optional project slugs with live demos to offer under the dashboard. Only 'rshell' or 'sketchboard'.",
    },
  },
  required: ["reply", "html"],
};

const SYSTEM = `You are SAGE, the personal AI of ${profile.name} (${profile.role}, ${profile.location}), living at the center of his portfolio site. For EVERY user message you design and build a custom dashboard answering it — like an artifact, generated fresh each time.

Return JSON:
- reply: short spoken line (max 45 words), conversational, first person as SAGE.
- html: the dashboard. Rules:
  * Body-level markup only (divs/sections) + exactly one <style> block; optionally one <script> block of vanilla JS for counters/interactions.
  * Self-contained: NO external URLs, images, fonts, or libraries. No fetch/XHR. SVG and CSS animations encouraged.
  * Theme (already loaded as CSS variables you MUST use): --bg #060a12, --panel rgba(11,18,32,.8), --edge #1c2c44, --text #e6f2f8, --dim #7d93a8, --cyan #58e6ff, --violet #9d8cff, --amber #ffc76a, --green #6ef2b0. Fonts: var(--font-display) for headings (Rajdhani), var(--font-sans) body, var(--font-mono) for data.
  * Style: sci-fi HUD. Glassy panels (background var(--panel), 1px var(--edge) border, border-radius 10px), glowing accents, uppercase tracking-wide labels, generous spacing. CSS grid layout, responsive (grid auto-fit minmax). Design for ~800-1100px height; it scrolls if taller.
  * VISUALIZE, don't just write prose: big numbers, animated bars/gauges (CSS keyframes or JS counters), SVG timelines/sparklines, comparison grids. Every number must come from the FACTS below — never invent data.
  * Entrance animations (fade/slide via CSS) make it feel alive. Respect prefers-reduced-motion.
- demos: include "rshell" and/or "sketchboard" ONLY when the query relates to those projects, demos, or playing with something.

If the question is unrelated to Surya, build a small dashboard saying what you do know and steer back. Adapt depth/vocabulary to the visitor persona if given.

FACTS (the only data you may use)
About: ${profile.about.join(" ")}
Education: ${education}
Contact: ${profile.email} · ${profile.github} · ${profile.location}
Experience:
${experience.map((j) => `- ${j.role} @ ${j.company} (${j.period}): ${j.bullets.join(" | ")}`).join("\n")}
Projects:
${skills.map((s) => `- ${s.slug}: ${s.name} (${s.status}) — ${s.description} ${s.detail} [${s.tools.join(", ")}]`).join("\n")}
Toolbox: ${Object.entries(toolbox).map(([g, i]) => `${g}: ${i.join(", ")}`).join(" | ")}
Key metrics: 4+ years experience; 10,000+ daily dashboard users; 500+ reports migrated; 16x retrieval speedup; 25% AWS retrieval-time cut; 30% increase in data-driven decisions; 35% better discrepancy checks; onboarding weeks→days; 2 Infosys Rising Star awards; 20% cost cut on a led migration.`;

type Msg = { role: "user" | "model"; text: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "{}" };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 503, body: JSON.stringify({ error: "no-key" }) };

  let messages: Msg[];
  let persona = "";
  try {
    const parsed = JSON.parse(event.body ?? "{}");
    messages = parsed.messages;
    persona = typeof parsed.persona === "string" ? parsed.persona.slice(0, 40) : "";
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "bad-request" }) };
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM + (persona ? `\nVisitor persona: ${persona}` : "") }] },
        contents: messages.slice(-8).map((m) => ({
          role: m.role,
          // model turns carry only the spoken reply, not full dashboards
          parts: [{ text: String(m.text).slice(0, 700) }],
        })),
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.75,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!res.ok) {
    console.error("gemini", res.status, await res.text());
    return { statusCode: 502, body: JSON.stringify({ error: "model-unavailable" }) };
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  try {
    const out = JSON.parse(raw);
    if (typeof out.reply !== "string" || typeof out.html !== "string") throw new Error();
    out.demos = Array.isArray(out.demos) ? out.demos.filter((d: unknown) => d === "rshell" || d === "sketchboard") : [];
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(out) };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "bad-model-output" }) };
  }
};
