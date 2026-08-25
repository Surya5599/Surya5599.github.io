import { profile, experience, skills, toolbox, education } from "./data/profile";

// One-page resume generated from the same data file that renders the site.
// Opens a print window — the browser's Save as PDF does the rest.

export function openResume() {
  const w = window.open("", "_blank", "width=850,height=1100");
  if (!w) return;
  const featured = skills.filter((s) => s.status !== "college project");
  const college = skills.filter((s) => s.status === "college project");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Surya Singh — Resume</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  body { font: 10.5pt/1.45 Helvetica, Arial, sans-serif; color: #1c1b1a; padding: 40px 48px; max-width: 820px; margin: 0 auto; }
  h1 { font: 800 24pt Georgia, serif; }
  .sub { color: #6e6e73; margin: 3px 0 14px; font-size: 9.5pt; }
  h2 { font: 800 10pt Helvetica; text-transform: uppercase; letter-spacing: 1.5px; color: #b06a5d; border-bottom: 1.5px solid #1c1b1a; padding-bottom: 3px; margin: 14px 0 7px; }
  .job { margin-bottom: 9px; }
  .job header { display: flex; justify-content: space-between; font-weight: 700; }
  .job .co { color: #6e6e73; font-weight: 600; font-size: 9.5pt; }
  ul { padding-left: 16px; margin-top: 3px; }
  li { margin-bottom: 2.5px; }
  .proj { margin-bottom: 6px; }
  .proj b { font-weight: 700; }
  .meta { color: #6e6e73; font-size: 9pt; }
  @media print { body { padding: 24px 32px; } }
</style></head><body>
<h1>Surya Singh</h1>
<p class="sub">${profile.role} · ${profile.location} · ${profile.email} · ${profile.github.replace("https://", "")} · live dashboard: this site</p>
<h2>Summary</h2>
<p>${profile.tagline}</p>
<h2>Experience</h2>
${experience
  .map(
    (j) => `<div class="job"><header><span>${j.role}</span><span class="meta">${j.period}</span></header>
<div class="co">${j.company}</div>
<ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>`,
  )
  .join("")}
<h2>Selected Projects</h2>
${featured
  .map((s) => `<p class="proj"><b>${s.name}</b> <span class="meta">(${s.tools.slice(0, 5).join(", ")})</span> — ${s.description}</p>`)
  .join("")}
<p class="proj"><b>College systems work</b> — ${college.map((s) => s.name).join(", ")}; all runnable as live demos on the dashboard.</p>
<h2>Skills</h2>
${Object.entries(toolbox)
  .map(([g, items]) => `<p class="proj"><b style="text-transform:capitalize">${g}:</b> ${items.join(", ")}</p>`)
  .join("")}
<h2>Education</h2>
<p>${education} · 2× Infosys Rising Star Award</p>
<script>window.onload = () => setTimeout(() => window.print(), 350);<\/script>
</body></html>`;
  w.document.write(html);
  w.document.close();
}
