// Single source of truth: rendered as SKILL.md cards in the UI and
// serialized into the Gemini system prompt by netlify/functions/chat.ts.

export type Skill = {
  slug: string;
  name: string;
  description: string;
  tools: string[];
  status: "active" | "building" | "shipped" | "college project";
  detail: string;
  repo?: string;
  link?: { label: string; url: string };
};

export const profile = {
  name: "Surya Singh",
  role: "Data Engineer",
  location: "Los Angeles, CA",
  tagline:
    "Data engineer with 5+ years across ETL, data architecture, and BI — now building the agentic layer on top: Claude agents and skills, LangChain pipelines, and AI workflows that turn weeks of data onboarding into days.",
  github: "https://github.com/Surya5599",
  email: "surya.singhp59@gmail.com",
  about: [
    "At Oliver Wight I build agentic data tooling: Claude-based skills that let business advisors query client data directly, an agent pipeline that categorizes incoming client data, runs the ETL, and flags quality issues with human-in-the-loop review (client onboarding went from weeks to days), and a LangChain + AgentScope help bot with persistent cross-session memory.",
    "Before that, three years at Infosys: Spotfire dashboards over SQL/Oracle/Redshift serving 10,000+ daily users, 500+ reports migrated off legacy systems with Python and REST automation, and two Rising Star awards along the way.",
    "Nights and weekends I ship products end to end — UniversalShelter.org (a universal-housing platform: Supabase, Netlify, Cloudflare, PayPal, mail and Google APIs), HabiCard (web, Chrome extension, iOS), and GymShot (React Native) — and I'm comfortable all the way down to the shell, the compiler, and the microcontroller.",
  ],
};

export type Job = {
  company: string;
  role: string;
  period: string;
  bullets: string[];
};

export const experience: Job[] = [
  {
    company: "Oliver Wight",
    role: "Data Engineer",
    period: "dec 2024 – present",
    bullets: [
      "Claude-based AI skills that let business advisors query and interpret client data directly, reducing reliance on manual analyst support.",
      "Claude agent/skills pipeline that categorizes incoming client data, runs the ETL to populate the product's data model, and flags quality issues through human-in-the-loop review — client onboarding cut from weeks to days.",
      "Agentic Gemini workflow that curates a business's data hierarchy per IBP/S&OP practices and generates an interactive demand/supply/resource dashboard you can alter in natural language.",
      "In-app help bot on LangChain + AgentScope with persistent cross-session user memory, so answers personalize over time.",
      "End-to-end ETL infrastructure from scratch: Microsoft Fabric, Apache Airflow, SQL Server, PostgreSQL.",
    ],
  },
  {
    company: "Infosys",
    role: "Data Engineer",
    period: "jan 2022 – dec 2024",
    bullets: [
      "Spotfire dashboards over SQL, Oracle, and Redshift serving 10,000+ daily users across departments — a 30% increase in data-driven decision making.",
      "Migrated 500+ reports from legacy systems using custom Python workflows and REST automation.",
      "Deployed Spotfire on AWS, cutting data retrieval times 25%.",
      "Discrepancy-detection dashboard in IronPython and R for real-time validation during a data warehouse migration — 35% better discrepancy checks.",
      "Two Infosys Rising Star awards (2023, 2024) — for leading a migration that cut costs 20%, and for client relationship management.",
    ],
  },
  {
    company: "Infosys",
    role: "ETL Developer",
    period: "apr 2021 – dec 2021",
    bullets: [
      "Built and optimized ETL pipelines with Oracle Data Integrator, improving integration accuracy 25% and data retrieval speed 16x via custom Python performance analysis.",
    ],
  },
];

export const toolbox = {
  "ai & agentic": ["Claude agents & skills", "LangChain", "AgentScope", "Gemini API"],
  "data & bi": ["Microsoft Fabric", "Airflow", "Spotfire", "Power BI", "SQL Server", "PostgreSQL", "Oracle", "Redshift", "Hive"],
  languages: ["Python", "Java", "C", "C++", "C#", "JavaScript/TypeScript"],
  "cloud & tools": ["AWS", "Docker", "Git/GitHub", "JIRA"],
};

export const education = "B.S. Computer Science — University of California, Riverside (2021)";

export const skills: Skill[] = [
  {
    slug: "gymshot",
    name: "GymShot",
    description:
      "Daily body-progress-photo app where small pods of friends keep each other accountable.",
    tools: ["React Native", "Expo", "TypeScript", "local-first"],
    status: "building",
    detail:
      "Ghost-overlay camera for consistent angles, streak rings, invite-only pods over deep links, iMessage-style reaction thread, face blur for privacy. Local-first by design; personal timelapse playback built in.",
    repo: "https://github.com/Surya5599/gymshot",
  },
  {
    slug: "habicard",
    name: "HabiCard",
    description:
      "Habit tracking that lives where you already are: web dashboard, Chrome new-tab extension, and iOS.",
    tools: ["React 19", "Vite", "Capacitor", "Supabase", "Manifest V3"],
    status: "active",
    detail:
      "One Supabase backend behind three surfaces. Streaks, weekly targets, journaling, shareable progress cards generated client-side, i18n, and Excel export. The extension is published on the Chrome Web Store.",
    link: { label: "habicard.com", url: "https://habicard.com" },
  },
  {
    slug: "universalshelter",
    name: "UniversalShelter.org",
    description:
      "Actum — a platform building a global system of universal homes, so shelter can exist without rent, mortgage, or debt. Marketing site, donation flow, merch storefront, and a live transparency dashboard.",
    tools: ["React + TypeScript", "Supabase", "Netlify", "Cloudflare", "PayPal API", "Shopify API", "Resend + Gmail API", "SnapTrade"],
    status: "active",
    detail:
      "Built and operated end to end: React 18 + TypeScript + Vite frontend with Framer Motion; Supabase for auth, Postgres, Realtime, and Edge Functions; Netlify hosting and serverless functions; Cloudflare DNS/CDN. Donations run through the PayPal API with server-side webhooks that log transactions and auto-send IRS-style donor receipts via the Gmail API; the contact and careers flows email through Resend. A Shopify Storefront/Admin merch shop funds the mission, and a transparency dashboard shows real brokerage data synced nightly from Vanguard via SnapTrade on a GitHub Actions cron.",
    link: { label: "universalshelter.org", url: "https://universalshelter.org" },
  },
  {
    slug: "cruise-management",
    name: "Ship Management System",
    description:
      "Booking and maintenance system for ship schedules, reservations, and crews.",
    tools: ["Java", "Swing", "PostgreSQL"],
    status: "college project",
    detail:
      "Java GUI over a normalized PostgreSQL schema — ships, captains, cruises, customers, reservations, and maintenance requests, seeded from CSV fixtures.",
    repo: "https://github.com/Surya5599/ShipBookingSystem",
  },
  {
    slug: "ocr-equation-solver",
    name: "OCR Equation Solver",
    description:
      "Reads math equations off the screen with OCR, evaluates them, and clicks the right answer.",
    tools: ["Python", "pytesseract", "regex"],
    status: "college project",
    detail:
      "Pipeline: screen capture → OCR → regex validation of the parsed expression → evaluation → automated click on the matching option. There's a demo video on the repo.",
    repo: "https://github.com/Surya5599/OCR_equationSolver",
  },
  {
    slug: "rshell",
    name: "RShell",
    description: "A Unix-style shell written in C++ from fork() up.",
    tools: ["C++", "fork/execvp", "dup2", "composite pattern"],
    status: "college project",
    detail:
      "Command parsing with && || ; connectors, parenthesized precedence, input/output redirection, and pipes — modeled with a composite pattern over single, multiple, and symbol commands.",
    repo: "https://github.com/Surya5599/Shell",
  },
  {
    slug: "sketchboard",
    name: "SketchBoard",
    description: "An Etch-a-Sketch built on an AVR microcontroller.",
    tools: ["Embedded C", "ADC", "EEPROM", "Nokia 5110 LCD"],
    status: "college project",
    detail:
      "Analog joystick sketching via ADC, a button-driven menu on a 16x02 LCD, and drawings persisted to EEPROM so saves survive power-off.",
    repo: "https://github.com/Surya5599/SketchBoard_Embedded_Systems_Project",
  },
  {
    slug: "data-analysis",
    name: "Data Analysis Portfolio",
    description:
      "EDA and modeling of US county-level election and COVID data.",
    tools: ["pandas", "scikit-learn", "geopandas", "k-means"],
    status: "college project",
    detail:
      "Exploratory analysis of demographics vs. voting outcomes, logistic regression to predict county winners, and k-means clustering with elbow detection.",
    repo: "https://github.com/Surya5599/Data_Analysis_Portfolio",
  },
];
