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
    --bg: #060a12;
    --panel: rgba(11, 18, 32, 0.8);
    --edge: #1c2c44;
    --text: #e6f2f8;
    --dim: #7d93a8;
    --cyan: #58e6ff;
    --violet: #9d8cff;
    --amber: #ffc76a;
    --green: #6ef2b0;
    --font-display: "Rajdhani", "Avenir Next Condensed", "Trebuchet MS", sans-serif;
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
  ::-webkit-scrollbar-thumb { background: var(--edge); border-radius: 4px; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}
