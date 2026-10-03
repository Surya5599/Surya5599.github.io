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
<p><a href="/about/">About ${esc(profile.name)}</a> · <a href="${profile.github}" rel="me">GitHub</a> · <a href="${profile.linkedin}" rel="me">LinkedIn</a> · <a href="mailto:${profile.email}">Email</a></p>
</main>`;
}

type PageOpts = { url: string; title: string; description: string; ogType: string; lds: object[]; body: string };

function shell(o: PageOpts): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}" />
<link rel="canonical" href="${o.url}" />
<meta property="og:type" content="${o.ogType}" />
<meta property="og:title" content="${esc(o.title)}" />
<meta property="og:description" content="${esc(o.description)}" />
<meta property="og:url" content="${o.url}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
${o.lds.map(ld).join("\n")}
</head>
<body style="background:#f4efe6">
<main style="${pageStyle}">
<p><a href="/">← ${esc(profile.name)}, ${esc(profile.role)}</a></p>
${o.body}
</main>
</body>
</html>
`;
}

const crumbs = (...items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
});

function aboutPage(): string {
  const url = `${SITE}/about/`;
  const current = experience[0];
  return shell({
    url,
    title: `About ${profile.name} — ${profile.role} in ${profile.location}`,
    description: `About ${profile.name}: a ${profile.role.toLowerCase()} in ${profile.location} who builds Claude agents, ETL pipelines, and BI dashboards at ${current.company}.`,
    ogType: "profile",
    lds: [
      { "@context": "https://schema.org", "@type": "ProfilePage", url, name: `About ${profile.name}`, mainEntity: { "@id": `${SITE}/#person` } },
      crumbs({ name: profile.name, url: `${SITE}/` }, { name: "About", url }),
      personLd,
    ],
    body: `<img src="/surya.jpg" alt="${esc(profile.name)}, ${esc(profile.role.toLowerCase())} in ${esc(profile.location)}" width="120" height="120" style="border-radius:50%;object-fit:cover" />
<h1>About ${esc(profile.name)}</h1>
<p>${esc(profile.name)} is a ${esc(profile.role.toLowerCase())} based in ${esc(profile.location)}. He currently works at ${esc(current.company)}, where he builds agentic data tooling, and has spent more than five years in ETL, data architecture, and business intelligence.</p>
${profile.about.map((x) => `<p>${esc(x)}</p>`).join("\n")}
<h2>Where to find ${esc(profile.name)}</h2>
<ul>
<li><a href="${SITE}/">Portfolio: ${SITE.replace("https://", "")}</a></li>
<li><a href="${profile.github}" rel="me">GitHub: Surya5599</a></li>
<li><a href="${profile.linkedin}" rel="me">LinkedIn: ${esc(profile.name)}</a></li>
<li><a href="mailto:${profile.email}">${esc(profile.email)}</a></li>
</ul>
<h2>Education</h2>
<p>${esc(education)}</p>
<h2>Projects</h2>
<ul>${skills.map((s) => `<li><a href="/projects/${s.slug}/">${esc(s.name)}</a></li>`).join("")}</ul>`,
  });
}

function projectPage(s: (typeof skills)[number]): string {
  const url = `${SITE}/projects/${s.slug}/`;
  const links = [...(s.repo ? [{ label: "source code", url: s.repo }] : []), ...(s.links ?? [])];
  return shell({
    url,
    title: `${s.name} — a project by ${profile.name}, ${profile.role}`,
    description: `${s.description} Built by ${profile.name}.`,
    ogType: "article",
    lds: [
      {
        "@context": "https://schema.org",
        "@type": s.repo ? "SoftwareSourceCode" : "CreativeWork",
        name: s.name,
        description: s.description,
        url,
        author: { "@id": `${SITE}/#person` },
        ...(s.repo ? { codeRepository: s.repo, programmingLanguage: s.tools } : { keywords: s.tools.join(", ") }),
      },
      crumbs({ name: profile.name, url: `${SITE}/` }, { name: s.name, url }),
      personLd,
    ],
    body: `<h1>${esc(s.name)}</h1>
<p>${esc(s.description)}</p>
<p>${esc(s.detail)}</p>
<p><strong>Built with:</strong> ${esc(s.tools.join(", "))}</p>
<p><strong>Status:</strong> ${esc(s.status)}</p>
${links.length ? `<ul>${links.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>` : ""}
<p>Built by <a href="/about/">${esc(profile.name)}</a>, a ${esc(profile.role.toLowerCase())} in ${esc(profile.location)}.</p>`,
  });
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
      const urls = [`${SITE}/`, `${SITE}/about/`, ...skills.map((s) => `${SITE}/projects/${s.slug}/`)];
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
      this.emitFile({ type: "asset", fileName: "about/index.html", source: aboutPage() });
      for (const s of skills) {
        this.emitFile({ type: "asset", fileName: `projects/${s.slug}/index.html`, source: projectPage(s) });
      }
    },
  };
}
