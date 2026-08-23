# surya's personal site

Portfolio styled as a live agent session — projects rendered as `SKILL.md` cards, with an AI chat (Gemini) that answers questions about my work.

## Stack

- Vite + React 19 + TypeScript + Tailwind 4
- Netlify Functions — `netlify/functions/chat.ts` proxies Gemini so the API key stays server-side
- Supabase — chat questions logged to `portfolio_chat_logs` (optional; skipped if env vars are unset)

## Develop

```bash
npm install
npm run dev        # UI only
netlify dev        # UI + chat function (needs .env with GEMINI_API_KEY)
```

## Deploy (Netlify)

Set environment variables in Site settings → Environment variables:

- `GEMINI_API_KEY` — required for chat
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — optional, enables question logging

Build command `npm run build`, publish directory `dist` (already in `netlify.toml`).

Content lives in one place: `src/data/profile.ts` feeds both the skill cards and the chat's system prompt.

The previous GitHub Pages site is preserved in `legacy/`.
