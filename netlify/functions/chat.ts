import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { profile, skills, experience, toolbox, education } from "../../src/data/profile";

const SYSTEM_PROMPT = `You are the portfolio agent for ${profile.name}, a ${profile.role} in ${profile.location}.
Answer visitors' questions about Surya's work, skills, and experience — concisely (2-5 sentences), in a friendly, plain voice. Speak about Surya in the third person.
Only discuss Surya and his work. If asked about anything unrelated, briefly redirect to his projects. Never invent facts beyond this context; if you don't know, say so and point to ${profile.email}.
GitHub: ${profile.github}. Contact: ${profile.email}. Education: ${education}.

About: ${profile.about.join(" ")}

Experience:
${experience
  .map((j) => `${j.role} @ ${j.company} (${j.period}):\n${j.bullets.map((b) => `  - ${b}`).join("\n")}`)
  .join("\n")}

Toolbox: ${Object.entries(toolbox)
  .map(([g, items]) => `${g}: ${items.join(", ")}`)
  .join(" | ")}

Personal projects:
${skills
  .map(
    (s) =>
      `- ${s.name} (${s.status}) — ${s.description} Stack: ${s.tools.join(", ")}. ${s.detail} ${s.repo ?? ""}`,
  )
  .join("\n")}`;

type Msg = { role: "user" | "model"; text: string };

async function logQuestion(question: string, answered: boolean) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const supabase = createClient(url, key);
    await supabase.from("portfolio_chat_logs").insert({ question, answered });
  } catch {
    // stats are best-effort; never fail the chat over logging
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Chat isn't configured yet — GEMINI_API_KEY is missing." }),
    };
  }

  let messages: Msg[];
  try {
    const parsed = JSON.parse(event.body ?? "{}");
    messages = parsed.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) };
  }

  const question = messages[messages.length - 1]?.text ?? "";
  if (question.length > 1000) {
    return { statusCode: 400, body: JSON.stringify({ error: "Question is too long." }) };
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.slice(-12).map((m) => ({
          role: m.role,
          parts: [{ text: String(m.text).slice(0, 1000) }],
        })),
        generationConfig: { maxOutputTokens: 512, temperature: 0.6 },
      }),
    },
  );

  if (!res.ok) {
    await logQuestion(question, false);
    console.error("Gemini error", res.status, await res.text());
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "The model is unavailable right now — try again shortly." }),
    };
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
    "";

  await logQuestion(question, text.length > 0);

  if (!text) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "The model returned no answer — try rephrasing." }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  };
};
