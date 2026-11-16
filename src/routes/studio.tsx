import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Download, Eye, Code2 } from "lucide-react";
import { AIChat } from "@/components/app/AIChat";
import { PageHeader } from "@/components/app/AppShell";
import { downloadBlob, addProject } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/studio")({
  validateSearch: (s: Record<string, unknown>) => ({ prompt: typeof s["prompt"] === "string" ? s["prompt"] : undefined }),
  head: () => meta("AI Studio", "Chat with Mestro AI to code mod menus, VR menus, .so libs, Frida scripts and websites with live edits."),
  component: Studio,
});

const EXT: Record<string, string> = { cpp: "cpp", "c++": "cpp", c: "c", html: "html", js: "js", javascript: "js", ts: "ts", java: "java", kotlin: "kt", smali: "smali", cs: "cs", csharp: "cs", python: "py", json: "json", css: "css" };

function Studio() {
  const { prompt } = Route.useSearch();
  const [code, setCode] = useState("// Ask the AI to build something — code appears here live.\n");
  const [file, setFile] = useState("main.cpp");
  const [tab, setTab] = useState<"code" | "preview">("code");
  const isHtml = file.endsWith(".html") || /^\s*<!doctype|^\s*<html/i.test(code);

  const onCode = (c: string, lang: string) => {
    setCode(c);
    const ext = EXT[lang.toLowerCase()];
    if (ext) setFile((f) => (f.endsWith("." + ext) ? f : `main.${ext}`));
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader icon={Bot} title="AI Studio" desc="Like bolt.new for modders — the AI writes code straight into the editor." />
      <div className="grid gap-4 lg:grid-cols-2">
        <AIChat className="h-[72vh]" initialPrompt={prompt} code={code} filename={file} onCode={onCode} />
        <div className="glass flex h-[72vh] flex-col overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <input value={file} onChange={(e) => setFile(e.target.value)} className="w-40 rounded bg-background/60 px-2 py-1 font-mono text-xs outline-none" />
            <button onClick={() => setTab("code")} className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${tab === "code" ? "bg-accent" : "text-muted-foreground"}`}><Code2 className="h-3 w-3" />Code</button>
            <button onClick={() => setTab("preview")} disabled={!isHtml} className={`flex items-center gap-1 rounded px-2 py-1 text-xs disabled:opacity-40 ${tab === "preview" ? "bg-accent" : "text-muted-foreground"}`}><Eye className="h-3 w-3" />Preview</button>
            <button onClick={() => { downloadBlob(new Blob([code], { type: "text/plain" }), file); addProject({ name: file, kind: "AI code" }); }}
              className="ml-auto flex items-center gap-1 rounded bg-brand px-2 py-1 text-xs font-semibold text-primary-foreground"><Download className="h-3 w-3" />Download</button>
          </div>
          {tab === "preview" && isHtml ? (
            <iframe title="preview" sandbox="allow-scripts" srcDoc={code} className="flex-1 bg-foreground" />
          ) : (
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
              className="flex-1 resize-none bg-background/70 p-4 font-mono text-xs leading-relaxed outline-none" />
          )}
        </div>
      </div>
    </div>
  );
}
