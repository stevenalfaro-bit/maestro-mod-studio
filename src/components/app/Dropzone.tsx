import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export function Dropzone({ accept, multiple, onFiles, label, folder }: { accept?: string; multiple?: boolean; folder?: boolean; onFiles: (f: File[]) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); }}
      className={`glass cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${over ? "border-primary shadow-glow" : "border-border hover:border-primary/60"}`}
    >
      <Upload className="mx-auto h-8 w-8 text-primary" />
      <div className="mt-2 font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">Drag & drop or click to choose</div>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        {...(folder ? ({ webkitdirectory: "" } as Record<string, string>) : {})}
        onChange={(e) => { onFiles([...(e.target.files || [])]); e.target.value = ""; }} />
    </div>
  );
}

export function Btn({ children, variant = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const v = variant === "primary"
    ? "bg-brand text-primary-foreground shadow-glow hover:brightness-110"
    : "glass text-foreground hover:bg-accent";
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${v} ${p.className ?? ""}`}>{children}</button>;
}

export function Field({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input {...p} className={`w-full rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-sm outline-none focus:border-primary ${p.className ?? ""}`} />
    </label>
  );
}
