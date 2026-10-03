import type { Plugin } from "vite";
import { profile, experience, skills, education, toolbox } from "./src/data/profile";

// Build-time SEO: the app is client-rendered, so crawlers would otherwise see
// an empty #root. This injects JSON-LD + readable HTML into index.html, emits a
// static page per project under /projects/<slug>/, plus sitemap.xml and robots.txt.
// All content comes from src/data/profile.ts so it can't drift from the UI.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SITE = profile.site;
const SAME_AS = [profile.github, profile.linkedin];

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE}/#person`,
  name: profile.name,
  jobTitle: profile.role,
  description: `${profile.name} is a ${profile.role.toLowerCase()} based in ${profile.location}, building Claude agents, ETL pipelines, and BI dashboards.`,
  url: `${SITE}/`,
  image: `${SITE}/surya.jpg`,
  email: `mailto:${profile.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressRegion: "CA", addressCountry: "US" },
  worksFor: { "@type": "Organization", name: "Oliver Wight" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "University of California, Riverside" },
  knowsAbout: Object.values(toolbox).flat(),
  sameAs: SAME_AS,
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: `${SITE}/`,
  name: `${profile.name} — ${profile.role}`,
  publisher: { "@id": `${SITE}/#person` },
};

const ld = (o: object) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

const pageStyle =
  "max-width:44rem;margin:0 auto;padding:2rem 1.25rem;font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#1c1b1a";

function homeBody(): string {
  return `<main style="${pageStyle}">
<h1>${esc(profile.name)} — ${esc(profile.role)} in ${esc(profile.location)}</h1>
<p>${esc(profile.tagline)}</p>
${profile.about.map((p) => `<p>${esc(p)}</p>`).join("\n")}
<h2>Experience</h2>
${experience
  .map(
    (j) =>
      `<h3>${esc(j.role)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`,
  )
  .join("\n")}
<h2>Projects</h2>
<ul>${skills
  .map((s) => `<li><a href="/projects/${s.slug}/">${esc(s.name)}</a> — ${esc(s.description)}</li>`)
  .join("")}</ul>
<h2>Skills</h2>
<ul>${Object.entries(toolbox)
  .map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v.join(", "))}</li>`)
  .join("")}</ul>
<h2>Education</h2>
<p>${esc(education)}</p>
<h2>Elsewhere</h2>
<p><a href="${profile.github}" rel="me">GitHub</a> · <a href="${profile.linkedin}" rel="me">LinkedIn</a> · <a href="mailto:${profile.email}">Email</a></p>
</main>`;
}

function projectPage(s: (typeof skills)[number]): string {
  const url = `${SITE}/projects/${s.slug}/`;
  const title = `${s.name} — a project by ${profile.name}, ${profile.role}`;
  const links = [...(s.repo ? [{ label: "source code", url: s.repo }] : []), ...(s.links ?? [])];
  const projectLd = {
    "@context": "https://schema.org",
    "@type": s.repo ? "SoftwareSourceCode" : "CreativeWork",
    name: s.name,
    description: s.description,
    url,
    author: { "@id": `${SITE}/#person` },
    ...(s.repo ? { codeRepository: s.repo, programmingLanguage: s.tools } : { keywords: s.tools.join(", ") }),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: profile.name, item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: s.name, item: url },
    ],
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(s.description)} Built by ${esc(profile.name)}." />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(s.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
${ld(projectLd)}
${ld(crumbs)}
${ld(personLd)}
</head>
<body style="background:#f4efe6">
<main style="${pageStyle}">
<p><a href="/">← ${esc(profile.name)}, ${esc(profile.role)}</a></p>
<h1>${esc(s.name)}</h1>
<p>${esc(s.description)}</p>
<p>${esc(s.detail)}</p>
<p><strong>Built with:</strong> ${esc(s.tools.join(", "))}</p>
<p><strong>Status:</strong> ${esc(s.status)}</p>
${links.length ? `<ul>${links.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>` : ""}
<p>Built by <a href="/">${esc(profile.name)}</a>, a ${esc(profile.role.toLowerCase())} in ${esc(profile.location)}.</p>
</main>
</body>
</html>
`;
}

export function seo(): Plugin {
  return {
    name: "seo",
    transformIndexHtml(html) {
      return html
        .replace("</head>", `${ld(personLd)}\n${ld(websiteLd)}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${homeBody()}</div>`);
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = [`${SITE}/`, ...skills.map((s) => `${SITE}/projects/${s.slug}/`)];
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
          .join("\n")}\n</urlset>\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`,
      });
      for (const s of skills) {
        this.emitFile({ type: "asset", fileName: `projects/${s.slug}/index.html`, source: projectPage(s) });
      }
    },
  };
}
