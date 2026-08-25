// Wraps model-generated dashboard markup in a locked shell:
// - CSP: no network at all (default-src 'none'), inline style/script only
// - theme tokens + base styles so every generated dashboard looks native
// Rendered into <iframe sandbox="allow-scripts"> — no cookies, no parent DOM.

export function buildDashboardDoc(html: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg: #fdfcf9;
    --panel: #ffffff;
    --edge: #1c1b1a;
    --text: #1c1b1a;
    --dim: #8a8579;
    --rose: #c98d82;
    --rose-deep: #b06a5d;
    --mint: #8fbfa8;
    --mauve: #b0a3c2;
    --amber: #d9a441;
    --cream: #f5f2ea;
    /* legacy aliases so older generations still render */
    --cyan: #b06a5d;
    --violet: #b0a3c2;
    --green: #8fbfa8;
    --font-display: "Playfair Display", Georgia, serif;
    --font-sans: "Inter", -apple-system, "Segoe UI", sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    background: transparent;
    color: var(--text);
    font-family: var(--font-sans);
    padding: 4px 2px 16px;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: #d8d3c6; border-radius: 4px; }
  .drillable, [onclick] { cursor: pointer; }
</style>
<script>
  // Drill-down bridge: generated dashboards call drill("question") to ask
  // SAGE for a deeper dashboard. postMessage is the only door out of this
  // sandbox — the parent validates shape and length before acting.
  window.drill = function (q) {
    try {
      parent.postMessage({ type: "sage-drill", query: String(q).slice(0, 200) }, "*");
    } catch (e) {}
  };
</script>
</head>
<body>
${html}
</body>
</html>`;
}
