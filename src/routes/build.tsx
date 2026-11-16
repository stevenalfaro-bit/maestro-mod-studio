import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Hammer, Download, ShieldCheck, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { LogPanel } from "@/components/app/LogPanel";
import { Dropzone, Btn, Field } from "@/components/app/Dropzone";
import { signAndBuild } from "@/lib/apk";
import JSZip from "jszip";
import { store, useStore, log, cleanName, downloadBlob, addProject } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/build")({
  head: () => meta("Build & Sign APK", "Rebuild your workspace into a real, signed .apk file you can download and install."),
  component: Build,
});

function Build() {
  const { apk, apkName } = useStore();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ blob: Blob; file: string } | null>(null);

  async function loadFolder(fs: File[]) {
    if (!fs.length) return;
    store.clearLogs();
    const z = new JSZip();
    const single = fs.length === 1 && /\.(apk|zip)$/i.test(fs[0].name);
    if (single) {
      log.step(`Loading ${fs[0].name}`);
      const loaded = await JSZip.loadAsync(fs[0]);
      store.set({ apk: loaded, apkName: fs[0].name });
      log.ok(`${Object.keys(loaded.files).length} entries loaded`);
      return;
    }
    log.step(`Loading folder with ${fs.length} files`);
    for (const f of fs) {
      const rel = (f.webkitRelativePath || f.name).split("/").slice(f.webkitRelativePath ? 1 : 0).join("/");
      z.file(rel, await f.arrayBuffer());
    }
    if (!z.file("AndroidManifest.xml")) log.warn("No AndroidManifest.xml at the folder root — the APK will not install");
    if (!Object.keys(z.files).some((n) => /^classes\d*\.dex$/.test(n))) log.warn("No classes.dex found");
    store.set({ apk: z, apkName: fs[0].webkitRelativePath?.split("/")[0] || "folder" });
    log.ok("Folder loaded into workspace");
  }

  async function build() {
    if (!apk) return;
    setBusy(true); setOut(null);
    try {
      log.step("=== Build & sign started ===");
      const blob = await signAndBuild(apk, { cn: name || "mestro_ac" });
      const file = cleanName(name || apkName.replace(/\.(apk|zip)$/i, "") + "_signed", "apk");
      setOut({ blob, file });
      log.ok(`Ready: ${file}`);
      addProject({ name: file, kind: "Signed APK" });
      downloadBlob(blob, file);
    } catch (e) { log.err((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader icon={Hammer} title="Build & Sign APK" desc="Packs everything into one .apk file (not a folder), signs it and downloads it." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 text-sm">
            <div className="font-medium">Workspace</div>
            <div className="font-mono text-xs text-muted-foreground">{apk ? `${apkName} · ${Object.keys(apk.files).length} entries` : "Empty — decompile an APK, or load an APK / unpacked folder below"}</div>
          </div>
          {!apk && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Dropzone accept=".apk,.zip" label="Load APK / ZIP" onFiles={loadFolder} />
              <Dropzone folder label="Load unpacked folder" onFiles={loadFolder} />
            </div>
          )}
          <Field label="Output APK name" placeholder="my_mod" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Btn disabled={!apk || busy} onClick={build}><ShieldCheck className="h-4 w-4" />{busy ? "Building…" : "Build & Sign APK"}</Btn>
            {out && <Btn variant="ghost" onClick={() => downloadBlob(out.blob, out.file)}><Download className="h-4 w-4" />Download {out.file}</Btn>}
            {apk && <Btn variant="ghost" onClick={() => store.set({ apk: null, apkName: "" })}>Clear workspace</Btn>}
          </div>
          <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground"><Smartphone className="h-4 w-4 text-primary" />Installing</div>
            Open the downloaded .apk on your phone and allow "Install unknown apps". If an older copy of the app is installed, uninstall it first (signatures differ).
            Signed with APK Signature v1 (JAR). Phones on Android 11+ only accept v1-only APKs when the app targets SDK 29 or lower — for newer targets, run <code className="font-mono">apksigner sign</code> once on PC.
          </div>
        </div>
        <LogPanel className="h-[520px]" />
      </div>
    </div>
  );
}
