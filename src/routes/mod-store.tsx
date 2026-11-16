import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Store, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { downloadBlob } from "@/lib/store";
import { meta } from "@/lib/meta";

type Listing = { id: string; title: string; description: string; author: string; category: string; content?: string };
const KEY = "mestro_local_mod_listings";
const SEEDS: Listing[] = [
  { id: "sample-frida-log", title: "App module logger", description: "A small Frida snippet to list modules while debugging your own app.", author: "Maestro examples", category: "Debugging", content: "Process.enumerateModules().forEach(m => console.log(m.name));\n" },
  { id: "sample-unity-notes", title: "Unity project checklist", description: "A plain-text checklist for organizing a Unity project you own.", author: "Maestro examples", category: "Documentation", content: "1. Keep a clean backup.\n2. Record the Unity version.\n3. Test changes in an offline development build.\n" },
];
function readListings(): Listing[] {
  if (typeof window === "undefined") return SEEDS;
  try { const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as Listing[]; return [...saved, ...SEEDS]; } catch { return SEEDS; }
}

export const Route = createFileRoute("/mod-store")({
  head: () => meta("Mod Store", "Browse and share local modding resources and project notes."),
  component: ModStore,
});

function ModStore() {
  const [listings, setListings] = useState<Listing[]>(readListings);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Scripts & tools");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => listings.filter((x) => `${x.title} ${x.description} ${x.category}`.toLowerCase().includes(query.toLowerCase())), [listings, query]);
  function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const item: Listing = { id: crypto.randomUUID(), title: title.trim(), description: description.trim(), category, author: "Local user", ...(content.trim() ? { content } : {}) };
    const existing = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]") as Listing[]; } catch { return []; } })();
    const next = [item, ...existing].slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(next)); setListings([...next, ...SEEDS]); setTitle(""); setDescription(""); setContent("");
  }
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader icon={Store} title="Mod Store" desc="Browse sample resources or prepare a listing to share." />
      <div className="mb-5 rounded-lg border border-warning/40 bg-card p-4 text-sm text-muted-foreground"><strong className="text-foreground">Local demo only.</strong> Listings are saved in this browser and are not uploaded or visible to other users. A public store needs a backend, accounts, moderation, and file hosting.</div>
      <form onSubmit={publish} className="glass mb-7 grid gap-3 rounded-xl p-5 md:grid-cols-2"><h2 className="font-semibold md:col-span-2">Create a local listing</h2><input required value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm" placeholder="Name" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm"><option>Scripts & tools</option><option>Documentation</option><option>Project notes</option></select><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20 rounded border border-input bg-background px-3 py-2 text-sm md:col-span-2" placeholder="What does it do?" /><textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-24 rounded border border-input bg-background px-3 py-2 font-mono text-xs md:col-span-2" placeholder="Optional text or script contents" /><button className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm text-primary-foreground"><Upload className="h-4 w-4" />Save listing in this browser</button></form>
      <input value={query} onChange={(e) => setQuery(e.target.value)} className="mb-4 w-full rounded border border-input bg-background px-3 py-2 text-sm" placeholder="Search listings…" />
      <div className="grid gap-4 md:grid-cols-2">{filtered.map((item) => <article key={item.id} className="glass rounded-xl p-5"><div className="text-xs text-primary">{item.category} · {item.author}</div><h2 className="mt-2 font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.description}</p>{item.content && <button onClick={() => downloadBlob(new Blob([item.content ?? ""], { type: "text/plain" }), `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"><Download className="h-4 w-4" />Download text</button>}</article>)}</div>
      {!filtered.length && <p className="text-sm text-muted-foreground">No listings match that search.</p>}
    </div>
  );
}
