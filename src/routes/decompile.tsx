import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PackageOpen, FileText, Download, Save } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { LogPanel } from "@/components/app/LogPanel";
import { Dropzone, Btn } from "@/components/app/Dropzone";
import { decompile } from "@/lib/apk";
import { store, useStore, log, addProject, downloadBlob, fmtBytes } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/decompile")({
  head: () => meta("Decompile APK", "Open an APK, see every file, detect Unity/IL2CPP and edit files before rebuilding."),
  component: Decompile,
});

const TEXT_RE = /\.(txt|json|xml|smali|js|html|css|properties|cfg|ini|lua|cs|java|kt|md|yml|yaml)$/i;

function Decompile() {
  const { apk, apkName, version } = useStore();
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const files = useMemo(() => (apk ? Object.values(apk.files).filter((f) => !f.dir) : []), [apk, version]);
  const shown = files.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase())).slice(0, 400);

  async function onFiles(fs: File[]) {
    const f = fs[0]; if (!f) return;
    store.clearLogs();
    try {
      const { zip } = await decompile(f);
      store.set({ apk: zip, apkName: f.name });
      addProject({ name: f.name, kind: "Decompiled APK" });
    } catch (e) { log.err(`Could not open: ${(e as Error).message}`); }
  }
  async function open(name: string) {
    setSel(name);
    setText(TEXT_RE.test(name) ? await apk!.file(name)!.async("string") : "");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader icon={PackageOpen} title="Decompile APK" desc="Unpack an APK into the workspace. Edit, replace or add files, then rebuild." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Dropzone accept=".apk,.xapk,.apks" label="Drop an APK" onFiles={onFiles} />
          <LogPanel />
        </div>
        <div className="glass flex h-[640px] flex-col rounded-xl">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <input placeholder="Search files…" value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1 rounded-lg bg-background/60 px-3 py-1.5 text-sm outline-none" />
            {apk && <Link to="/build"><Btn>Rebuild →</Btn></Link>}
          </div>
          {!apk ? <div className="grid flex-1 place-items-center text-sm text-muted-foreground">No APK loaded yet</div> : sel && (TEXT_RE.test(sel)) ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2 font-mono text-xs">
                <button onClick={() => setSel(null)} className="text-primary">← files</button><span className="truncate">{sel}</span>
                <Btn variant="ghost" className="ml-auto !py-1" onClick={() => { apk.file(sel, text); store.set({}); log.ok(`Saved ${sel}`); }}><Save className="h-3 w-3" />Save</Btn>
              </div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="flex-1 resize-none bg-background/60 p-3 font-mono text-xs outline-none" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
              <div className="px-2 pb-2 text-muted-foreground">{apkName} · {files.length} files</div>
              {shown.map((f) => (
                <div key={f.name} className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-accent">
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <button onClick={() => open(f.name)} className="flex-1 truncate text-left">{f.name}</button>
                  <button className="opacity-0 group-hover:opacity-100" aria-label="Download file"
                    onClick={async () => { const b = await f.async("blob"); downloadBlob(b, f.name.split("/").pop()!); log.info(`Extracted ${f.name} (${fmtBytes(b.size)})`); }}>
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
