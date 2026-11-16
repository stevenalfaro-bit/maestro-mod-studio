import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import JSZip from "jszip";
import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { meta } from "@/lib/meta";

type Change = { path: string; kind: "Added" | "Removed" | "Changed" };

export const Route = createFileRoute("/apk-compare")({
  head: () => meta("APK Comparison", "Compare the file contents of two APK archives locally."),
  component: ApkCompare,
});

async function inventory(file: File) {
  const zip = await JSZip.loadAsync(file);
  const result = new Map<string, string>();
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  for (const entry of entries) {
    const bytes = await entry.async("uint8array");
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    result.set(entry.name, Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, "0")).join(""));
  }
  return result;
}

function ApkCompare() {
  const [left, setLeft] = useState<File>();
  const [right, setRight] = useState<File>();
  const [changes, setChanges] = useState<Change[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function compare() {
    if (!left || !right) return;
    setBusy(true); setError(""); setChanges([]);
    try {
      const [a, b] = await Promise.all([inventory(left), inventory(right)]);
      const paths = new Set([...a.keys(), ...b.keys()]);
      setChanges([...paths].sort().flatMap((path) => !a.has(path) ? [{ path, kind: "Added" as const }] : !b.has(path) ? [{ path, kind: "Removed" as const }] : a.get(path) !== b.get(path) ? [{ path, kind: "Changed" as const }] : []));
    } catch (e) {
      setError(e instanceof Error ? `Could not read one of these APK/ZIP archives: ${e.message}` : "Could not read one of these archives.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader icon={ArrowLeftRight} title="APK Comparison" desc="Compare two APK archives without uploading them to a server." />
      <p className="mb-5 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Choose APKs you own or are allowed to inspect. Comparison runs locally in this browser and lists archive paths that were added, removed, or changed.</p>
      <div className="glass grid gap-5 rounded-xl p-5 md:grid-cols-2">
        <label className="text-sm">Original APK<input className="mt-2 block w-full" type="file" accept=".apk,.zip,application/zip" onChange={(e) => setLeft(e.target.files?.[0])} /></label>
        <label className="text-sm">New APK<input className="mt-2 block w-full" type="file" accept=".apk,.zip,application/zip" onChange={(e) => setRight(e.target.files?.[0])} /></label>
        <button disabled={!left || !right || busy} onClick={compare} className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 md:col-span-2">{busy ? "Comparing archives…" : "Compare files"}</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {(changes.length > 0 || (left && right && !busy && !error)) && <section className="mt-6"><h2 className="font-semibold">Differences ({changes.length})</h2><div className="mt-3 max-h-[55vh] space-y-1 overflow-auto">{changes.length ? changes.map((item) => <div key={item.path} className="glass flex gap-3 rounded px-3 py-2 font-mono text-xs"><span className={item.kind === "Added" ? "text-success" : item.kind === "Removed" ? "text-destructive" : "text-warning"}>{item.kind}</span><span className="break-all">{item.path}</span></div>) : <p className="text-sm text-muted-foreground">The archive contents match.</p>}</div></section>}
    </div>
  );
}
