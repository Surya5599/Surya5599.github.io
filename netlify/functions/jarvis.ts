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
- reply: short spoken line (max 45 words), conversational, first person as SAGE. When the user message starts with "Deep dive" or reads like a drill-down, acknowledge you are zooming in.
- html: the dashboard. Rules:
  * Body-level markup only (divs/sections) + exactly one <style> block; optionally one <script> block of vanilla JS for counters/interactions.
  * Self-contained: NO external URLs, images, fonts, or libraries. No fetch/XHR. SVG and CSS animations encouraged.
  * Theme (already loaded as CSS variables you MUST use): --bg #fdfcf9 (warm cream page), --panel #ffffff, --edge #1c1b1a (ink), --text #1c1b1a, --dim #8a8579, --rose #c98d82, --rose-deep #b06a5d, --mint #8fbfa8, --mauve #b0a3c2, --amber #d9a441, --cream #f5f2ea. Fonts: var(--font-display) = Playfair Display serif for big headings/numbers, var(--font-sans) body, var(--font-mono) for small data labels.
  * Style: SOFT NEO-BRUTALIST, warm and friendly (think pastel product sites). Cards: background var(--panel), border: 2px solid var(--edge), border-radius: 16-20px, box-shadow: 5px 5px 0 var(--edge). Pastel fills (--rose/--mint/--mauve/--cream) for chips, bars, and highlight blocks. Big serif numbers in --text or --rose-deep. Labels: 11px bold uppercase letter-spaced sans in --dim. NO glow, NO neon, NO dark backgrounds. Playful touches welcome (✿ ✦ bullets, two-tone headlines). CSS grid layout, responsive (auto-fit minmax). Design for ~800-1100px height; it scrolls if taller.
  * VISUALIZE, don't just write prose: big numbers, animated bars/gauges (CSS keyframes or JS counters), SVG timelines/sparklines, comparison grids. Every number must come from the FACTS below — never invent data.
  * MAKE IT A WORKING DASHBOARD, not a poster. Required in every dashboard:
    1. FILTERS/SELECTION: at least one control group — filter chips, tabs, or segmented toggles — that actually re-renders the view via your inline JS. Embed the relevant facts as a JS const and re-render from it (e.g. filter projects by status/technology, toggle experience by company, switch a chart between metrics). Style the active control with a pastel fill + ink border. Also make data points selectable: clicking a row/bar highlights it and updates a small detail pane inside the dashboard.
    2. DRILL-DOWN: a global function drill(question) is available. Attach it to elements that deserve a deeper look — e.g. onclick="drill('Deep dive into the HabiCard project')" on a project row, or drill('What did Surya do at Infosys in 2023?') on a timeline segment. Mark drillable elements with class="drillable", a subtle ↗ affordance, and a hover style. Calling drill() makes me (SAGE) generate a brand-new deeper dashboard, so phrase the question specifically. Include 2-5 drill points per dashboard.
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

  // model calls are occasionally flaky (overload, truncated JSON) — retry once
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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
      console.error("gemini", res.status, (await res.text()).slice(0, 300));
      continue;
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    try {
      const out = JSON.parse(raw);
      if (typeof out.reply !== "string" || typeof out.html !== "string") throw new Error();
      out.demos = Array.isArray(out.demos) ? out.demos.filter((d: unknown) => d === "rshell" || d === "sketchboard") : [];
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(out) };
    } catch {
      console.error("gemini bad output", data?.candidates?.[0]?.finishReason, raw.slice(0, 200));
      continue;
    }
  }
  return { statusCode: 502, body: JSON.stringify({ error: "model-unavailable" }) };
};
