import { profile, skills, toolbox, education } from "./data/profile";

// The site is an interview: every node is an answer Surya gives, plus the
// follow-up questions it opens. Adding a project or job = adding a node here.

export type DialogueNode = {
  id: string;
  chip: string; // the question, as the visitor clicks it
  answer: string[]; // paragraphs, spoken in first person
  followups: string[]; // node ids offered next
  sim?: string; // sims registry slug — renders a "try it" action
  repo?: string;
};

const gymshot = skills.find((s) => s.slug === "gymshot")!;
const habicard = skills.find((s) => s.slug === "habicard")!;
const rshell = skills.find((s) => s.slug === "rshell")!;
const sketchboard = skills.find((s) => s.slug === "sketchboard")!;
const others = skills.filter((s) => !["gymshot", "habicard", "rshell", "sketchboard"].includes(s.slug));

export const NODES: Record<string, DialogueNode> = {
  "what-do-you-do": {
    id: "what-do-you-do",
    chip: "What do you do?",
    answer: [
      `I'm a data engineer in ${profile.location}. Four-plus years across ETL, data architecture, and BI — and for the last while, building the agentic layer on top: Claude agents and skills, LangChain pipelines, AI workflows that do the data work themselves.`,
      "The short version with numbers: dashboards serving 10,000+ people daily, 500+ reports migrated off legacy systems, a 16× retrieval speedup, and client onboarding cut from weeks to days by an agent pipeline I built.",
    ],
    followups: ["current-role", "past-work", "show-projects"],
  },
  "current-role": {
    id: "current-role",
    chip: "What are you building right now?",
    answer: [
      "At Oliver Wight (since Dec 2024) I build agentic data tooling. The one I'm proudest of: a Claude agent/skills pipeline that takes a client's incoming data, categorizes it, runs the ETL to populate our product's data model, and flags quality issues for human review. Client onboarding used to take weeks; it takes days now.",
      "Also: Claude-based skills that let business advisors query client data in plain English, a Gemini-powered workflow that generates interactive demand/supply dashboards you can alter in natural language, and a LangChain + AgentScope help bot with persistent cross-session memory.",
    ],
    followups: ["past-work", "stack", "show-projects"],
  },
  "past-work": {
    id: "past-work",
    chip: "Where were you before?",
    answer: [
      "Infosys, almost four years. As a data engineer (2022–2024) I built Spotfire dashboards over SQL, Oracle, and Redshift serving 10,000+ daily users, migrated 500+ reports off legacy systems with Python and REST automation, and deployed Spotfire on AWS with a 25% retrieval-time cut.",
      "Two Rising Star awards along the way — one for leading a migration that cut costs 20%, one for client relationship work. Before that I was an ETL developer there: Oracle Data Integrator pipelines and a 16× data retrieval speedup from custom Python performance analysis.",
      education + ".",
    ],
    followups: ["current-role", "stack", "show-projects"],
  },
  "show-projects": {
    id: "show-projects",
    chip: "Show me what you've built",
    answer: [
      "Nights and weekends I ship products end to end — design, client, API, database, store submission. Two are live products, and two of the older systems projects you can actually play with right here.",
    ],
    followups: ["p-gymshot", "p-habicard", "p-rshell", "p-sketchboard", "p-more"],
  },
  "p-gymshot": {
    id: "p-gymshot",
    chip: "GymShot — what is it?",
    answer: [gymshot.description, gymshot.detail],
    followups: ["p-habicard", "p-rshell", "show-projects"],
    repo: gymshot.repo,
  },
  "p-habicard": {
    id: "p-habicard",
    chip: "Tell me about HabiCard",
    answer: [habicard.description, habicard.detail],
    followups: ["p-gymshot", "p-rshell", "show-projects"],
    repo: habicard.repo,
  },
  "p-rshell": {
    id: "p-rshell",
    chip: "You wrote a shell?",
    answer: [
      "In C++, from fork() up. Connectors like && and || with real short-circuit semantics, parentheses for precedence, pipes, redirection — parsed into a composite pattern and executed.",
      "I rebuilt it to run in your browser. Try the connectors and watch the parse tree it builds.",
    ],
    followups: ["p-sketchboard", "show-projects", "stack"],
    sim: "rshell",
    repo: rshell.repo,
  },
  "p-sketchboard": {
    id: "p-sketchboard",
    chip: "And hardware?",
    answer: [
      "An Etch-a-Sketch on an ATmega1284: analog joystick through the ADC, drawing on a Nokia 5110 LCD, menu on a 16x02 display, and saves written to EEPROM so they survive power-off.",
      "This one's also rebuilt in your browser — a 3D breadboard you can rotate, draw on, and save to (fake) EEPROM.",
    ],
    followups: ["p-rshell", "show-projects", "stack"],
    sim: "sketchboard",
    repo: sketchboard.repo,
  },
  "p-more": {
    id: "p-more",
    chip: "What else?",
    answer: [
      others.map((s) => `${s.name} — ${s.description}`).join(" "),
      `Everything is on GitHub: ${profile.github}`,
    ],
    followups: ["p-gymshot", "p-habicard", "stack"],
  },
  stack: {
    id: "stack",
    chip: "What's your stack?",
    answer: Object.entries(toolbox).map(([g, items]) => `${g[0].toUpperCase() + g.slice(1)}: ${items.join(", ")}.`),
    followups: ["current-role", "show-projects", "contact"],
  },
  contact: {
    id: "contact",
    chip: "How do I reach you?",
    answer: [
      `Email is best: ${profile.email}. Code lives at ${profile.github}. I'm in ${profile.location}.`,
    ],
    followups: ["what-do-you-do", "show-projects"],
  },
};

export const STARTERS = ["what-do-you-do", "show-projects", "p-rshell"];
export const TOTAL = Object.keys(NODES).length;
