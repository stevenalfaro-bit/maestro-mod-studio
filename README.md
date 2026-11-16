# Maestro Mod Studio

A local browser-based modding studio for APK workflows, C++/Android libs, zip tools, and AI-assisted coding.

## What this project includes

- APK decompile / rebuild / sign workflows
- C++ to .so compilation
- zip/unzip utilities
- modding lab and AI code studio
- Groq-powered chat for code generation and live edits

## Development

```bash
npm install
npm run dev
```

Create a local environment file in the project root before running the app:

```dotenv
GROQ_API_KEY=your_key_here
```

This file is intentionally local-only and should not be committed.
