import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, Boxes, Bot, Cpu, FileArchive, Gamepad2, Hammer, Layers, PackageOpen } from "lucide-react";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Home", "mestro_ac: decompile, rebuild and sign APKs, compile C++ to .so, zip/unzip and mod games with AI."),
  component: Index,
});

const TOOLS = [
  { to: "/decompile", icon: PackageOpen, t: "Decompile APK", d: "Open any APK and inspect every file" },
  { to: "/build", icon: Hammer, t: "Build & Sign", d: "Rebuild into a real signed .apk file" },
  { to: "/libs", icon: Layers, t: "Make Libs", d: "Inject .so libs into lib/<abi>/" },
  { to: "/cpp-to-so", icon: Cpu, t: "C++ → .so", d: "Turn C++ into working Android libs" },
  { to: "/zip", icon: FileArchive, t: "Zip", d: "Pack files & folders, any name" },
  { to: "/unzip", icon: Boxes, t: "Unzip", d: "Extract and download any file" },
  { to: "/modding", icon: Gamepad2, t: "Modding Lab", d: "Unity, VR & mobile game mods" },
  { to: "/studio", icon: Bot, t: "AI Studio", d: "Code mod menus, libs & websites" },
] as const;

const IDEAS = ["ImGui mod menu .so for a Unity game", "VR mod menu for Quest (OpenXR)", "Frida script to hook Il2Cpp", "A landing page for my mod"];

function Index() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const go = (p: string) => nav({ to: "/studio", search: { prompt: p } });
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-20">
      <div className="text-center">
        <div className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> APK toolkit + AI coder, right in your browser
        </div>
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">What do you want to <span className="text-gradient">mod</span> today?</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Decompile, build and sign APKs, make libs, compile C++ to .so and let the AI code mod menus, VR menus and websites.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q); }} className="glass mx-auto mt-10 max-w-2xl rounded-2xl p-3 shadow-glow">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} placeholder="Describe your mod, lib, app or website…"
          className="w-full resize-none bg-transparent px-2 py-1 outline-none" />
        <div className="flex items-center justify-between">
          <span className="px-2 text-xs text-muted-foreground">Opens in AI Studio</span>
          <button className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-primary-foreground" aria-label="Start"><ArrowUp className="h-4 w-4" /></button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {IDEAS.map((i) => <button key={i} onClick={() => go(i)} className="glass rounded-full px-3 py-1.5 text-xs hover:border-primary">{i}</button>)}
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className="glass group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-glow">
            <t.icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <div className="mt-3 font-semibold">{t.t}</div>
            <div className="text-sm text-muted-foreground">{t.d}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
