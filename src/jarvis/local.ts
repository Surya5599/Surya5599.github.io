import { profile, skills, experience, toolbox } from "../data/profile";
import type { Widget } from "./widgets";

// Offline brain: when the Gemini endpoint is unreachable (local dev without a
// key, or an outage), SAGE still answers common asks from the profile data.

export function localAnswer(q: string, persona: string | null): { reply: string; widgets: Widget[] } {
  const s = q.toLowerCase();
  const has = (...words: string[]) => words.some((w) => s.includes(w));

  if (has("experience", "career", "work history", "job", "resume", "background", "timeline", "dashboard of his career")) {
    return {
      reply: "Here's Surya's career at a glance — four-plus years from ETL developer to building agentic AI data tooling.",
      widgets: [
        { type: "stat", label: "years in data engineering", value: "5+" },
        { type: "stat", label: "daily users on his dashboards", value: "10,000+" },
        { type: "timeline" },
      ],
    };
  }
  if (has("ai", "agent", "claude", "langchain", "llm", "gemini")) {
    return {
      reply: "AI is Surya's current center of gravity — he builds Claude agents and skills, LangChain pipelines, and Gemini workflows in production.",
      widgets: [
        { type: "list", title: "agentic work at oliver wight", items: experience[0].bullets.slice(0, 4) },
        { type: "bars", title: "ai & agentic stack", items: toolbox["ai & agentic"].map((t, i) => ({ label: t, value: 92 - i * 8 })) },
      ],
    };
  }
  if (has("project", "built", "build", "apps", "portfolio", "show me")) {
    return {
      reply: "He ships end to end — here are the two products he's actively building, plus a playable systems project.",
      widgets: [
        { type: "project", slug: "gymshot" },
        { type: "project", slug: "habicard" },
        { type: "project", slug: "rshell" },
      ],
    };
  }
  if (has("stack", "skill", "tool", "tech", "language")) {
    return {
      reply: "Here's his toolbox, grouped the way he uses it.",
      widgets: Object.entries(toolbox).map(([g, items]) => ({ type: "list" as const, title: g, items })),
    };
  }
  if (has("contact", "reach", "email", "hire", "interview", "talk to")) {
    return {
      reply: "Here's how to reach him — email gets the fastest response.",
      widgets: [{ type: "contact" }, { type: "stat", label: "based in", value: "Los Angeles" }],
    };
  }
  if (has("demo", "play", "simulation", "shell", "hardware", "sketch")) {
    return {
      reply: "Two of his projects run right here in the browser — a C++ shell and an embedded-systems breadboard.",
      widgets: [
        { type: "project", slug: "rshell" },
        { type: "project", slug: "sketchboard" },
      ],
    };
  }
  return {
    reply: `I can tell you about Surya's experience, AI work, projects, or stack${persona ? ` — tailored for a ${persona}` : ""}. My full reasoning needs the live model, but the essentials are all here. Try "show me his projects" or "build me a career dashboard."`,
    widgets: [
      { type: "stat", label: "years in data", value: "5+" },
      { type: "stat", label: "personal builds", value: String(skills.length) },
      { type: "contact" },
    ],
  };
}

export function greetingFor(persona: string): { reply: string; widgets: Widget[] } {
  const intro: Record<string, string> = {
    recruiter: "Welcome. The headline: 5+ years in data engineering, currently building agentic AI tooling in production at Oliver Wight. Here's the summary a recruiter usually wants first — ask me anything deeper.",
    engineer: "Hey. Surya's an ETL-to-agents engineer — Claude agents and skills, LangChain, Airflow, Fabric. Two of his systems projects run live in this page. Ask me something technical.",
    curious: "Welcome in. Surya turns messy data into decisions, and lately builds AI that does it for him. Poke around — ask me anything, or try a live demo.",
  };
  const widgets: Record<string, Widget[]> = {
    recruiter: [
      { type: "stat", label: "years in data engineering", value: "5+" },
      { type: "stat", label: "daily dashboard users", value: "10,000+" },
      { type: "timeline" },
      { type: "contact" },
    ],
    engineer: [
      { type: "bars", title: "core stack", items: [
        { label: "Python", value: 95 }, { label: "SQL / PostgreSQL", value: 92 },
        { label: "Claude agents & skills", value: 90 }, { label: "Airflow / Fabric", value: 84 },
        { label: "LangChain", value: 80 }, { label: "TypeScript / React", value: 74 },
      ]},
      { type: "project", slug: "rshell" },
    ],
    curious: [
      { type: "stat", label: "reports migrated off legacy", value: "500+" },
      { type: "stat", label: "onboarding time, after his agents", value: "weeks → days" },
      { type: "project", slug: "gymshot" },
    ],
  };
  const key = persona in intro ? persona : "curious";
  return { reply: intro[key], widgets: widgets[key] };
}

export { profile };
