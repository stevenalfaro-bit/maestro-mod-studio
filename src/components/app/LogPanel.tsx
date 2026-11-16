import { useEffect, useRef } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { store, useStore } from "@/lib/store";

const COLOR = { info: "text-muted-foreground", ok: "text-success", warn: "text-warning", err: "text-destructive", step: "text-primary" } as const;
const TAG = { info: "INFO", ok: " OK ", warn: "WARN", err: "FAIL", step: "STEP" } as const;

export function LogPanel({ className = "h-80" }: { className?: string }) {
  const { logs } = useStore();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: "nearest" }), [logs.length]);
  return (
    <div className="glass flex flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium"><Terminal className="h-4 w-4 text-primary" /> Logs</div>
        <button onClick={() => store.clearLogs()} className="text-muted-foreground hover:text-foreground" aria-label="Clear logs"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className={`overflow-y-auto p-4 font-mono text-xs leading-relaxed ${className}`}>
        {logs.length === 0 && <div className="text-muted-foreground">Every step will show up here…</div>}
        {logs.map((l, i) => (
          <div key={i} className={COLOR[l.level]}>
            <span className="opacity-50">{new Date(l.t).toLocaleTimeString()} </span>[{TAG[l.level]}] {l.msg}
          </div>
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}
