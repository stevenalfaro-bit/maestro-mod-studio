import { createFileRoute } from "@tanstack/react-router";

const MODES = {
  fast: { model: "openai/gpt-oss-20b", effort: "low" },
  think: { model: "openai/gpt-oss-120b", effort: "medium" },
  genius: { model: "openai/gpt-oss-120b", effort: "high" },
} as const;

const FOCUS: Record<string, string> = {
  frida: "Frida / root mods: Frida JS scripts, frida-gadget injection, Il2Cpp hooks, root-only tooling.",
  apk: "APK mods (non-root): smali edits, lib injection, mod menus loaded via System.loadLibrary, repacking.",
  both: "Both Frida/root and APK (non-root) mods.",
  fixing: "Fixing, adding, changing and removing features in existing code or mods.",
};

function pickAuto(text: string): keyof typeof MODES {
  const t = text.toLowerCase();
  if (t.length > 600 || /(full|complete|entire|whole) (mod menu|app|website|project)|vr mod menu|architecture/.test(t)) return "genius";
  if (t.length > 160 || /why|debug|fix|error|crash|hook|il2cpp|offset|explain/.test(t)) return "think";
  return "fast";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GROQ_API_KEY;
        if (!key) return Response.json({ error: "AI key is not configured" }, { status: 500 });
        const body = (await request.json()) as {
          messages: { role: "user" | "assistant"; content: string }[];
          mode: "fast" | "think" | "auto" | "genius";
          focus: string;
          code?: string;
          filename?: string;
        };
        const last = body.messages.at(-1)?.content ?? "";
        const resolved = body.mode === "auto" ? pickAuto(last) : body.mode;
        const cfg = MODES[resolved] ?? MODES.fast;
        const system = `You are Mestro AI, the built-in assistant of mestro_ac — a web toolkit for Android/Unity/VR modding and app building.
User focus: ${FOCUS[body.focus] ?? body.focus}
You write complete, compilable code: C++ for Android NDK .so libs (JNI_OnLoad, Dobby/And64InlineHook hooks, ImGui mod menus, OpenXR/Oculus VR mod menus), Frida scripts, smali patches, Unity Il2Cpp/BepInEx/MelonLoader mods, and full websites (single-file HTML with inline CSS/JS).
Rules:
- When you write or change code, output the COMPLETE file in ONE fenced code block with the language tag (e.g. \`\`\`cpp). The app applies it live to the editor.
- Before the code, one or two short sentences. After the code, short build/usage steps.
- For .so libs explain they can be built with the mestro_ac "C++ → .so" section and added to the APK with "Make Libs".
- Only help modify games/apps the user owns or has permission to modify; for online multiplayer games, refuse cheats that harm other players and offer offline/single-player alternatives.
${body.code ? `\nCurrent editor file (${body.filename || "main"}):\n\`\`\`\n${body.code.slice(0, 24000)}\n\`\`\`` : ""}`;

        const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          signal: request.signal,
          body: JSON.stringify({
            model: cfg.model,
            reasoning_effort: cfg.effort,
            stream: true,
            messages: [{ role: "system", content: system }, ...body.messages.slice(-20)],
          }),
        });
        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          let msg = `AI error (${upstream.status})`;
          try { msg = JSON.parse(text).error?.message ?? msg; } catch { /* keep default */ }
          return Response.json({ error: msg }, { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Mestro-Mode": resolved },
        });
      },
    },
  },
});
