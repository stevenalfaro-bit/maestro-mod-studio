import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clipboard, Download, Hammer, Package, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { LogPanel } from "@/components/app/LogPanel";
import { PageHeader } from "@/components/app/AppShell";
import { CPP_TEMPLATE, makeNdkProject } from "@/lib/ndk";
import { addProject, downloadBlob, log, store } from "@/lib/store";
import { meta } from "@/lib/meta";

const ABIS = ["arm64-v8a", "armeabi-v7a", "x86_64"] as const;

export const Route = createFileRoute("/cpp-to-so")({
  head: () => meta("C++ to Android .so", "Create and download an Android NDK project for building a native shared library from C++ source."),
  component: CppToSo,
});

function CppToSo() {
  const [name, setName] = useState("native");
  const [code, setCode] = useState(CPP_TEMPLATE);
  const [abis, setAbis] = useState<string[]>(["arm64-v8a", "armeabi-v7a"]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggleAbi(abi: string) {
    setAbis((current) => current.includes(abi) ? current.filter((item) => item !== abi) : [...current, abi]);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Full C++ source copied");
      window.setTimeout(() => setCopied(false), 1800);
      log.ok("Copied the complete main.cpp source to the clipboard");
    } catch {
      toast.error("Clipboard access was denied by your browser");
      log.err("Could not copy source: clipboard permission was denied");
    }
  }

  async function createProject() {
    if (!code.trim()) {
      toast.error("Add your C++ source first");
      return;
    }
    if (!abis.length) {
      toast.error("Choose at least one Android ABI");
      return;
    }

    setBusy(true);
    store.clearLogs();
    try {
      log.step("Preparing Android NDK project from the editor source");
      log.info(`Selected Android ABIs: ${abis.join(", ")}`);
      const project = await makeNdkProject(name, code, abis);
      const filename = `lib${project.name}-android-ndk.zip`;
      log.ok("Added main.cpp, CMakeLists.txt, build script, and GitHub Actions workflow");
      log.step(`Downloading ${filename}`);
      downloadBlob(project.blob, filename);
      addProject({ name: filename, kind: "Android NDK build project", note: "Run the included workflow or build with Android NDK to produce the .so." });
      log.ok("Project ZIP downloaded. Follow its README / Actions instructions to compile the actual .so binary.");
      toast.success("NDK build project downloaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not package the NDK project";
      log.err(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function downloadCpp() {
    const safeName = name.trim().replace(/[^\w.-]+/g, "_").replace(/\.cpp$/i, "") || "main";
    downloadBlob(new Blob([code], { type: "text/x-c++src;charset=utf-8" }), `${safeName}.cpp`);
    log.ok(`Downloaded complete C++ source as ${safeName}.cpp`);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader icon={Hammer} title="C++ → Android .so" desc="Edit C++ source, copy the complete file, and download a ready-to-build Android NDK project." />
      <div className="mb-5 rounded-lg border border-warning/40 bg-card p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Important:</strong> A browser cannot compile a native Android .so by itself. This tool downloads the full source and build project; use its included GitHub Actions workflow or Android NDK build script to compile and download the actual .so artifact.
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section className="glass flex min-h-[620px] flex-col overflow-hidden rounded-xl">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
            <label className="text-xs text-muted-foreground">Library name
              <input value={name} onChange={(e) => setName(e.target.value)} className="ml-2 w-40 rounded border border-input bg-background px-2 py-1.5 font-mono text-sm text-foreground" placeholder="native" />
            </label>
            <div className="ml-auto flex flex-wrap gap-2">
              <button onClick={() => setCode(CPP_TEMPLATE)} className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:bg-accent"><RotateCcw className="h-3.5 w-3.5" />Reset template</button>
              <button onClick={downloadCpp} className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:bg-accent"><Download className="h-3.5 w-3.5" />Download .cpp</button>
              <button onClick={copyCode} className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:bg-accent">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? "Copied full code" : "Copy full code"}</button>
            </div>
          </div>
          <textarea aria-label="C++ source code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} className="min-h-[500px] flex-1 resize-y bg-background/70 p-4 font-mono text-xs leading-relaxed outline-none" />
          <div className="border-t border-border p-3 text-xs text-muted-foreground">The entire editor contents are copied or included as <code>src/main.cpp</code>.</div>
        </section>
        <div className="space-y-4">
          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold">Target Android ABIs</h2>
            <p className="mt-1 text-xs text-muted-foreground">Select the architectures to include in the build workflow.</p>
            <div className="mt-4 space-y-3">{ABIS.map((abi) => <label key={abi} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={abis.includes(abi)} onChange={() => toggleAbi(abi)} />{abi}</label>)}</div>
            <button disabled={busy || !code.trim() || !abis.length} onClick={createProject} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Package className="h-4 w-4" />{busy ? "Preparing project…" : "Create .so build project"}</button>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The ZIP contains your complete source, CMake configuration, a local build script, README steps, and a GitHub Actions workflow that can produce downloadable <code>.so</code> artifacts.</p>
          </section>
          <LogPanel className="h-[320px]" />
        </div>
      </div>
    </div>
  );
}
