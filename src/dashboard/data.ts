import { skills, experience, toolbox, type Skill, type Job } from "../data/profile";

// Derived datasets for the dashboard. Everything is computed from
// src/data/profile.ts — update that file and every chart follows.

export const KPIS = [
  { label: "years in data engineering", value: 4, suffix: "+" },
  { label: "daily dashboard users", value: 10000, suffix: "+" },
  { label: "reports migrated off legacy", value: 500, suffix: "+" },
  { label: "data retrieval speedup", value: 16, suffix: "×" },
];

// career timeline (fractional years for the gantt)
export type Span = { job: Job; start: number; end: number };
export const CAREER_START = 2021;
export const CAREER_END = 2026.75;
export const SPANS: Span[] = [
  { job: experience[2], start: 2021.25, end: 2021.95 }, // ETL Developer
  { job: experience[1], start: 2022.0, end: 2024.95 }, // Data Engineer, Infosys
  { job: experience[0], start: 2024.92, end: CAREER_END }, // Data Engineer, Oliver Wight
];

// projects by status
export const STATUS_ORDER = ["active", "building", "shipped", "college project"] as const;
export type Status = (typeof STATUS_ORDER)[number];
export const STATUS_COLOR: Record<Status, string> = {
  active: "var(--color-moss)",
  building: "var(--color-amber)",
  shipped: "var(--color-clay)",
  "college project": "var(--color-violet)",
};
export const statusCounts = STATUS_ORDER.map((s) => ({
  status: s,
  count: skills.filter((k) => k.status === s).length,
})).filter((s) => s.count > 0);

// technology frequency across personal projects
export const techFrequency = (() => {
  const map = new Map<string, { count: number; projects: string[] }>();
  for (const s of skills) {
    for (const t of s.tools) {
      const cur = map.get(t) ?? { count: 0, projects: [] };
      cur.count += 1;
      cur.projects.push(s.name);
      map.set(t, cur);
    }
  }
  return [...map.entries()]
    .map(([tech, v]) => ({ tech, ...v }))
    .sort((a, b) => b.count - a.count);
})();

// toolbox size by category (for the overview coverage chart)
export const categoryCounts = Object.entries(toolbox).map(([category, items]) => ({
  category,
  count: items.length,
}));

// every technology, for the projects filter
export const allTechs = techFrequency.map((t) => t.tech);

export { skills, experience, toolbox };
export type { Skill, Job };
