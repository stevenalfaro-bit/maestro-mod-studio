import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { meta } from "@/lib/meta";

const SCRIPTS = [
  { title: "List loaded modules", category: "Android / native", description: "Print module names in an app you own while debugging it.", code: "Process.enumerateModules().forEach(module => {\n  console.log(`${module.name} @ ${module.base}`);\n});" },
  { title: "List Java classes", category: "Android / Java", description: "List loaded class names for your own app during a test session.", code: "Java.perform(() => {\n  Java.enumerateLoadedClasses({\n    onMatch: name => console.log(name),\n    onComplete: () => console.log('Class listing complete')\n  });\n});" },
  { title: "Trace an app-owned Java method", category: "Android / Java", description: "Example template: replace the package, class, and method with one from an app you own or are authorized to test.", code: "Java.perform(() => {\n  const Target = Java.use('com.example.app.Target');\n  Target.exampleMethod.implementation = function (...args) {\n    console.log('exampleMethod called');\n    return this.exampleMethod(...args);\n  };\n});" },
];

export const Route = createFileRoute("/frida-library")({
  head: () => meta("Frida Script Library", "A small library of safe Frida templates for debugging apps you own or are authorized to test."),
  component: FridaLibrary,
});

function FridaLibrary() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => SCRIPTS.filter((s) => `${s.title} ${s.category} ${s.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); toast.success("Copied script"); }
    catch { toast.error("Clipboard access was denied by your browser"); }
  }
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader icon={BookOpen} title="Frida Script Library" desc="Small, editable templates for authorized app debugging." />
      <p className="mb-5 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Use only on apps you own or have explicit permission to test. These starter examples inspect app structure and method behavior; they do not steal data, bypass protections, or target other users.</p>
      <label className="glass mb-5 flex items-center gap-2 rounded-lg px-3"><Search className="h-4 w-4 text-muted-foreground" /><input className="w-full bg-transparent py-3 text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter scripts…" /></label>
      <div className="space-y-4">{visible.map((script) => <article key={script.title} className="glass rounded-xl p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs text-primary">{script.category}</div><h2 className="mt-1 font-semibold">{script.title}</h2><p className="mt-1 text-sm text-muted-foreground">{script.description}</p></div><button onClick={() => copy(script.code)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"><Copy className="h-3.5 w-3.5" />Copy</button></div><pre className="mt-4 overflow-auto rounded-lg bg-background/70 p-4 text-xs leading-relaxed"><code>{script.code}</code></pre></article>)}</div>
      {!visible.length && <p className="text-sm text-muted-foreground">No scripts match that search.</p>}
    </div>
  );
}
