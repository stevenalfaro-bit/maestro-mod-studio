# Project notes

This repo is a local TanStack + Vite app.

- Keep secrets in `.env.local` and never commit them.
- The Groq key is read from `process.env.GROQ_API_KEY` in the server route.
- Keep the app build config stable when editing `vite.config.ts`.
- Reuse the existing modding/tooling structure instead of introducing unrelated app patterns.
