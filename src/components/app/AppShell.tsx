import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Bot, Cpu, FileArchive, FolderOpen, Gamepad2, Hammer, Home, Layers, PackageOpen, User, Wrench, Menu } from "lucide-react";
import { Starfield } from "./Starfield";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/studio", label: "AI Studio", icon: Bot },
  { to: "/modding", label: "Modding Lab", icon: Gamepad2 },
  { group: "Tools" },
  { to: "/decompile", label: "Decompile APK", icon: PackageOpen },
  { to: "/build", label: "Build & Sign APK", icon: Hammer },
  { to: "/libs", label: "Make Libs", icon: Layers },
  { to: "/cpp-to-so", label: "C++ → .so", icon: Cpu },
  { to: "/zip", label: "Zip Files", icon: FileArchive },
  { to: "/unzip", label: "Unzip", icon: Boxes },
  { group: "You" },
  { to: "/projects", label: "Projects", icon: FolderOpen },
  { to: "/profile", label: "Profile & Status", icon: User },
] as const;

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { apk, apkName } = useStore();
  const [name, setName] = useState("Modder");
  const [open, setOpen] = useState(false);
  useEffect(() => setName(localStorage.getItem("mestro_user") || "Modder"), [path]);
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="relative flex min-h-screen">
      <Starfield />
      <button onClick={() => setOpen(!open)} className="glass fixed left-3 top-3 z-40 rounded-lg p-2 lg:hidden" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <Link to="/" className="flex items-center gap-2 px-5 pb-4 pt-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">mestro<span className="text-gradient">_ac</span></span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3">
          {NAV.map((n, i) =>
            "group" in n ? (
              <div key={i} className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{n.group}</div>
            ) : (
              <Link key={n.to} to={n.to}
                className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${path === n.to ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`}>
                <n.icon className={`h-4 w-4 ${path === n.to ? "text-primary" : ""}`} />
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="m-3 rounded-xl glass p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-primary-foreground">{name[0]?.toUpperCase()}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online
              </div>
            </div>
          </div>
          <div className="mt-2 truncate font-mono text-[11px] text-muted-foreground">workspace: {apk ? apkName : "empty"}</div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand shadow-glow">
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
