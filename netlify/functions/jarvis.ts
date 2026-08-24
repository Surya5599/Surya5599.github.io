import type { Handler } from "@netlify/functions";
import { profile, skills, experience, toolbox, education } from "../../src/data/profile";

// SAGE's brain: Gemini with structured output. Every answer is a short spoken
// reply plus dashboard widgets the frontend renders around the orb.

const WIDGET_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Spoken answer, max 55 words, first person as SAGE about Surya" },
    widgets: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["stat", "bars", "list", "text", "project", "timeline", "contact"] },
          label: { type: "string" },
          value: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          slug: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "number" },
                note: { type: "string" },
              },
            },
          },
          listItems: { type: "array", items: { type: "string" } },
        },
        required: ["type"],
      },
    },
  },
  required: ["reply", "widgets"],
};

const SYSTEM = `You are SAGE, the personal AI of ${profile.name} (${profile.role}, ${profile.location}). You live at the center of his portfolio site and answer visitors by BUILDING DASHBOARDS.

For every user message return JSON: a short conversational "reply" (max 55 words, speakable aloud) and 1-4 "widgets" that VISUALIZE the answer.

Widget types:
- stat: {label, value} — one big number/fact. Prefer real metrics.
- bars: {title, items:[{label, value 0-100, note?}]} — comparisons/proficiency. value is relative.
- list: {title, listItems:[...]} — use listItems (array of strings) for bullet lists.
- text: {title?, body} — short prose when nothing else fits.
- project: {slug} — a rich project card. Valid slugs: ${skills.map((s) => s.slug).join(", ")}. Slugs rshell and sketchboard include live playable demos.
- timeline: {} — his full career timeline (auto-rendered).
- contact: {} — his contact card.

Ground everything in these facts and NOTHING else. If asked something you can't support, say so in reply and suggest what you do know. Never invent metrics, employers, or skills.
${persona()}

FACTS
About: ${profile.about.join(" ")}
Education: ${education}
Experience: ${experience.map((j) => `${j.role} @ ${j.company} (${j.period}): ${j.bullets.join(" | ")}`).join("\n")}
Projects: ${skills.map((s) => `${s.slug}: ${s.name} (${s.status}) — ${s.description} ${s.detail} tools: ${s.tools.join(",")}`).join("\n")}
Toolbox: ${Object.entries(toolbox).map(([g, i]) => `${g}: ${i.join(", ")}`).join(" | ")}
Contact: ${profile.email}, ${profile.github}`;

function persona() {
  return "If a persona is given (recruiter/engineer/curious), tune vocabulary and which widgets you pick to what that audience cares about.";
}

type Msg = { role: "user" | "model"; text: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "{}" };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 503, body: JSON.stringify({ error: "no-key" }) };

  let messages: Msg[];
  let userPersona = "";
  try {
    const parsed = JSON.parse(event.body ?? "{}");
    messages = parsed.messages;
    userPersona = typeof parsed.persona === "string" ? parsed.persona.slice(0, 40) : "";
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
        systemInstruction: { parts: [{ text: SYSTEM + (userPersona ? `\nVisitor persona: ${userPersona}` : "") }] },
        contents: messages.slice(-10).map((m) => ({ role: m.role, parts: [{ text: String(m.text).slice(0, 800) }] })),
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: WIDGET_SCHEMA,
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
    // normalize: model uses listItems for list widgets; frontend expects items:string[]
    for (const w of out.widgets ?? []) {
      if (w.type === "list" && Array.isArray(w.listItems)) w.items = w.listItems;
      if (w.type === "bars" && !Array.isArray(w.items)) w.items = [];
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(out) };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "bad-model-output" }) };
  }
};
