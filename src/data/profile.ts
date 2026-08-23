// Single source of truth: rendered as SKILL.md cards in the UI and
// serialized into the Gemini system prompt by netlify/functions/chat.ts.

export type Skill = {
  slug: string;
  name: string;
  description: string;
  tools: string[];
  status: "active" | "shipped" | "archived";
  detail: string;
  repo?: string;
  link?: { label: string; url: string };
};

export const profile = {
  name: "Surya Singh",
  role: "Software Engineer",
  tagline:
    "I build consumer products end to end — mobile apps, web dashboards, browser extensions — and I'm comfortable all the way down to the shell, the compiler, and the microcontroller.",
  github: "https://github.com/Surya5599",
  email: "s@universalshelter.org",
  about: [
    "Most of my current work is shipping two products: HabiCard, a habit tracker that lives across web, a Chrome extension, and iOS; and GymShot, a daily progress-photo app built around small accountability pods.",
    "Before that: a Unix shell in C++, an Etch-a-Sketch on an AVR microcontroller, compilers coursework, and data analysis with scikit-learn. I like owning the whole stack — design, client, API, database, and store submission.",
  ],
};

export const skills: Skill[] = [
  {
    slug: "gymshot",
    name: "GymShot",
    description:
      "Daily body-progress-photo app where small pods of friends keep each other accountable.",
    tools: ["React Native", "Expo", "TypeScript", "local-first"],
    status: "active",
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
    repo: "https://github.com/Surya5599/habittracker",
  },
  {
    slug: "cruise-management",
    name: "Cruise Management System",
    description:
      "Booking and maintenance system for ship schedules, reservations, and crews.",
    tools: ["Java", "Swing", "PostgreSQL"],
    status: "shipped",
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
    status: "shipped",
    detail:
      "Pipeline: screen capture → OCR → regex validation of the parsed expression → evaluation → automated click on the matching option. There's a demo video on the repo.",
    repo: "https://github.com/Surya5599/OCR_equationSolver",
  },
  {
    slug: "rshell",
    name: "RShell",
    description: "A Unix-style shell written in C++ from fork() up.",
    tools: ["C++", "fork/execvp", "dup2", "composite pattern"],
    status: "archived",
    detail:
      "Command parsing with && || ; connectors, parenthesized precedence, input/output redirection, and pipes — modeled with a composite pattern over single, multiple, and symbol commands.",
    repo: "https://github.com/Surya5599/Shell",
  },
  {
    slug: "sketchboard",
    name: "SketchBoard",
    description: "An Etch-a-Sketch built on an AVR microcontroller.",
    tools: ["Embedded C", "ADC", "EEPROM", "Nokia 5110 LCD"],
    status: "archived",
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
    status: "archived",
    detail:
      "Exploratory analysis of demographics vs. voting outcomes, logistic regression to predict county winners, and k-means clustering with elbow detection.",
    repo: "https://github.com/Surya5599/Data_Analysis_Portfolio",
  },
];
