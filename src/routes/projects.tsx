import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FolderOpen, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { addProject, downloadBlob, getProjects, removeProject, type Project } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/projects")({
  head: () => meta("Saved Projects", "Manage projects saved in this browser or export them as a backup."),
  component: Projects,
});

function Projects() {
  const [projects, setProjects] = useState<Project[]>(getProjects);
  function refresh() { setProjects(getProjects()); }
  function exportData() { downloadBlob(new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" }), "maestro-projects.json"); }
  async function importData(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of projects.");
      for (const p of parsed) if (p && typeof p.name === "string" && typeof p.kind === "string") addProject({ name: p.name, kind: p.kind, ...(typeof p.note === "string" ? { note: p.note } : {}) });
      refresh(); toast.success("Project backup imported");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not import that file"); }
  }
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader icon={FolderOpen} title="Saved Projects" desc="Your recent project records and backups." />
      <div className="mb-5 rounded-lg border border-warning/40 bg-card p-4 text-sm text-muted-foreground"><strong className="text-foreground">Browser storage, not an account.</strong> Projects currently stay in this browser's local storage. They are not synced across devices or backed by a login service. Export a backup before clearing browser data.</div>
      <div className="mb-5 flex flex-wrap gap-3"><button onClick={exportData} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Download className="h-4 w-4" />Export backup</button><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Upload className="h-4 w-4" />Import backup<input className="hidden" type="file" accept="application/json,.json" onChange={(e) => void importData(e.target.files?.[0])} /></label></div>
      <div className="space-y-2">{projects.map((p) => <article key={p.id} className="glass flex items-center justify-between gap-4 rounded-lg p-4"><div><h2 className="font-medium">{p.name}</h2><p className="text-xs text-muted-foreground">{p.kind} · {new Date(p.createdAt).toLocaleString()}{p.note ? ` · ${p.note}` : ""}</p></div><button onClick={() => { removeProject(p.id); refresh(); }} aria-label={`Delete ${p.name}`} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></article>)}{projects.length === 0 && <p className="text-sm text-muted-foreground">No saved projects yet. Use a tool to create or save a project record.</p>}</div>
    </div>
  );
}
