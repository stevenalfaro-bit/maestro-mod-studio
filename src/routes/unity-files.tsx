import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FolderSearch, Search } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { meta } from "@/lib/meta";

type Finding = { file: string; line: number; text: string; offset: string };

export const Route = createFileRoute("/unity-files")({
  head: () => meta("Unity File Inspector", "Inspect Unity game files and source declarations for projects you own or have permission to analyze."),
  component: UnityFiles,
});

function UnityFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [busy, setBusy] = useState(false);

  async function inspect() {
    setBusy(true);
    const found: Finding[] = [];
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) continue;
        if (!/\.(h|hpp|c|cc|cpp|cs|txt|json)$/i.test(file.name)) continue;
        const text = await file.text();
        text.split(/\r?\n/).forEach((line, index) => {
          const match = line.match(/(?:offset|fieldoffset|rva)\s*(?:=|\(|:)?\s*(0x[\da-f]+)/i);
          if (match) found.push({ file: file.name, line: index + 1, text: line.trim().slice(0, 180), offset: match[1] });
        });
      }
      setFindings(found);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader icon={FolderSearch} title="Unity File Inspector" desc="Review local game files and explicit offset declarations in source or dump text." />
      <p className="mb-5 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">For files from games you own or are authorized to analyze. This is a static local-file inspector: it does not attach to a running game or discover live memory offsets. It only reports hex values explicitly labeled offset, FieldOffset, or RVA in text files.</p>
      <section className="glass rounded-xl p-5">
        <label className="block text-sm font-medium">Choose local files
          <input className="mt-3 block w-full text-sm" type="file" multiple onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setFindings([]); }} />
        </label>
        <div className="mt-3 text-xs text-muted-foreground">{files.length} file(s) selected · text/source files up to 20 MB are scanned in your browser.</div>
        <button disabled={!files.length || busy} onClick={inspect} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><Search className="h-4 w-4" />{busy ? "Scanning…" : "Inspect selected files"}</button>
      </section>
      <section className="mt-5 space-y-2">
        <h2 className="font-semibold">Explicit offset declarations ({findings.length})</h2>
        {findings.length ? findings.map((f, i) => <div key={`${f.file}-${f.line}-${i}`} className="glass rounded-lg p-3 font-mono text-xs"><div className="text-primary">{f.file}:{f.line} · {f.offset}</div><div className="mt-1 break-all text-muted-foreground">{f.text}</div></div>) : <p className="text-sm text-muted-foreground">No labeled hex offsets found yet. Select source or text files and inspect them.</p>}
      </section>
    </div>
  );
}
