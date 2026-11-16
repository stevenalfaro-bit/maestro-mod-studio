import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, ArrowLeftRight, BookOpen, Bot, Cpu, FolderSearch, Hammer, PackageOpen, Store } from "lucide-react";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Home", "Local APK and Unity project tools, Frida templates, APK comparison, and project workspace."),
  component: Index,
});

const TOOLS = [
  { to: "/unity-files", icon: FolderSearch, t: "Unity File Inspector", d: "Review local Unity files and labeled source offsets" },
  { to: "/apk-compare", icon: ArrowLeftRight, t: "Compare APKs", d: "Find files added, removed, or changed" },
  { to: "/frida-library", icon: BookOpen, t: "Frida Library", d: "Browse starter scripts for authorized testing" },
  { to: "/mod-store", icon: Store, t: "Mod Store", d: "Browse and save local resource listings" },
  { to: "/decompile", icon: PackageOpen, t: "Decompile APK", d: "Inspect the files in an APK archive" },
  { to: "/build", icon: Hammer, t: "Build & Sign", d: "Rebuild and sign an APK project" },
  { to: "/cpp-to-so", icon: Cpu, t: "C++ → Android .so", d: "Edit C++ and download an NDK build project" },
  { to: "/projects", icon: FolderSearch, t: "Saved Projects", d: "Manage local project records and backups" },
  { to: "/studio", icon: Bot, t: "Code Studio", d: "Draft and edit code with AI" },
] as const;

function Index() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const go = (p: string) => nav({ to: "/studio", search: { prompt: p } });
  return <div className="mx-auto max-w-6xl px-6 pb-20 pt-16"><div className="max-w-3xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">A practical workspace for APKs and Unity projects</div><h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Tools for your <span className="text-gradient">modding workflow</span></h1><p className="mt-4 max-w-2xl text-muted-foreground">Inspect your own game files, compare APK builds, keep useful scripts close, and organize local project notes.</p></div><form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q); }} className="glass mt-8 max-w-3xl rounded-xl p-3"><textarea value={q} onChange={(e) => setQ(e.target.value)} rows={2} placeholder="What are you working on?" className="w-full resize-none bg-transparent px-2 py-1 outline-none" /><div className="flex justify-end"><button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm text-primary-foreground">Open Code Studio <ArrowUp className="h-4 w-4" /></button></div></form><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TOOLS.map((t) => <Link key={t.to} to={t.to} className="glass rounded-xl p-4 transition-colors hover:bg-accent"><t.icon className="h-5 w-5 text-primary" /><h2 className="mt-3 text-sm font-semibold">{t.t}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.d}</p></Link>)}</div></div>;
}
