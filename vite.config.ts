import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In production Netlify serves /api/* from netlify/functions. This plugin
// serves the same handler under plain `npm run dev`, so no Netlify CLI is
// needed locally. Put GEMINI_API_KEY in .env to enable live generation;
// without it the endpoint returns 503 and the app falls back to its local brain.
function localApi(env: Record<string, string>): Plugin {
  return {
    name: "local-netlify-functions",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/jarvis", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("{}");
          return;
        }
        if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", async () => {
          try {
            const mod = await server.ssrLoadModule("/netlify/functions/jarvis.ts");
            const out = await mod.handler({ httpMethod: "POST", body });
            res.statusCode = out.statusCode ?? 500;
            res.setHeader("Content-Type", "application/json");
            res.end(out.body ?? "{}");
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : "dev-api-error" }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), localApi(env)],
  };
});
