import { useEffect, useRef, useState } from "react";
import { Bot, Brain, Zap, Sparkles as _s, Wand2, Send, Square, Copy, Check, Gauge } from "lucide-react";
import { streamChat, lastCodeBlock, type Mode, type Msg } from "@/lib/ai";

export const FOCUSES = [
  { id: "frida", label: "Frida / Root mods" },
  { id: "apk", label: "APK mods (no root)" },
  { id: "both", label: "Both" },
  { id: "fixing", label: "Fixing / adding / changing / removing" },
];
const MODES: { id: Mode; label: string; icon: typeof Zap; hint: string }[] = [
  { id: "fast", label: "Fast", icon: Zap, hint: "Quick answers" },
  { id: "think", label: "Think", icon: Brain, hint: "Reasons first" },
  { id: "auto", label: "Auto", icon: Gauge, hint: "Switches Fast/Think/Genius" },
  { id: "genius", label: "Genius", icon: Wand2, hint: "Max reasoning, full projects" },
];
void _s;

function Rendered({ text, onApply }: { text: string; onApply?: ((code: string) => void) | undefined }) {
  const parts = text.split(/(```[\w+#-]*\n[\s\S]*?(?:```|$))/g);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {parts.map((p, i) => {
        const m = p.match(/^```([\w+#-]*)\n([\s\S]*?)(?:```)?$/);
        if (m) return <CodeBlock key={i} lang={m[1] ?? ""} code={m[2] ?? ""} onApply={onApply} />;
        return p.trim() ? <p key={i} className="whitespace-pre-wrap">{p.trim()}</p> : null;
      })}
    </div>
  );
}

function CodeBlock({ lang, code, onApply }: { lang: string; code: string; onApply?: ((c: string) => void) | undefined }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/80">
      <div className="flex items-center justify-between border-b border-border px-3 py-1 text-xs text-muted-foreground">
        <span className="font-mono">{lang || "code"}</span>
        <div className="flex gap-3">
          {onApply && <button className="text-primary hover:underline" onClick={() => onApply(code)}>Apply to editor</button>}
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto p-3 font-mono text-xs"><code>{code}</code></pre>
    </div>
  );
}

export function AIChat({ initialPrompt, code, filename, onCode, autoApply = true, className = "" }: {
  initialPrompt?: string | undefined; code?: string | undefined; filename?: string | undefined; onCode?: ((c: string, lang: string) => void) | undefined; autoApply?: boolean; className?: string;
}) {
  const [focus, setFocus] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState("");
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (initialPrompt) setInput(initialPrompt); }, [initialPrompt]);
  useEffect(() => end.current?.scrollIntoView({ block: "nearest" }), [msgs, thinking]);

  async function send() {
    if (!input.trim() || busy || !focus) return;
    setError("");
    const next: Msg[] = [...msgs, { role: "user", content: input.trim() }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setThinking("");
    ctrl.current = new AbortController();
    let acc = "";
    try {
      const used = await streamChat(
        { messages: next, mode, focus, code, filename, signal: ctrl.current.signal },
        (d) => {
          acc += d;
          setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
          if (autoApply && onCode) {
            const cb = lastCodeBlock(acc);
            if (cb) onCode(cb.code, cb.lang);
          }
        },
        (r) => setThinking((t) => (t + r).slice(-400)),
      );
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc, mode: used }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
        setMsgs((m) => (acc ? m : m.slice(0, -1)));
      }
    } finally {
      setBusy(false);
      setThinking("");
    }
  }

  return (
    <div className={`glass flex flex-col overflow-hidden rounded-xl ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Mestro AI</span>
        <div className="ml-auto flex gap-1">
          {MODES.map((m) => (
            <button key={m.id} title={m.hint} onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${mode === m.id ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              <m.icon className="h-3 w-3" /> {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!focus ? (
          <div className="mx-auto max-w-md py-6 text-center">
            <Bot className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 font-medium">Hey! What kind of modding are we doing?</p>
            <p className="text-sm text-muted-foreground">Pick one to start.</p>
            <div className="mt-4 grid gap-2">
              {FOCUSES.map((f) => (
                <button key={f.id} onClick={() => setFocus(f.id)} className="glass rounded-lg px-4 py-2.5 text-sm hover:border-primary hover:shadow-glow">{f.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="text-center text-xs text-muted-foreground">
              Focus: <b className="text-foreground">{FOCUSES.find((f) => f.id === focus)?.label}</b> ·{" "}
              <button className="text-primary hover:underline" onClick={() => setFocus(null)}>change</button>
            </div>
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">{m.content}</div>
              ) : (
                <div key={i} className="max-w-full">
                  {m.mode && <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{m.mode} mode</div>}
                  {m.content ? <Rendered text={m.content} onApply={onCode ? (c) => onCode(c, "") : undefined} /> : (
                    <div className="text-sm text-muted-foreground animate-pulse">{thinking ? `Thinking… ${thinking.slice(-140)}` : "Working…"}</div>
                  )}
                </div>
              ),
            )}
            {error && <div className="rounded-lg border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</div>}
          </>
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={!focus}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={focus ? "Ask for a mod menu, a VR menu, a website, a fix…" : "Choose a focus above first"}
            rows={2} className="min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary" />
          {busy ? (
            <button onClick={() => ctrl.current?.abort()} className="grid h-11 w-11 place-items-center rounded-lg bg-destructive text-destructive-foreground" aria-label="Stop"><Square className="h-4 w-4" /></button>
          ) : (
            <button onClick={send} disabled={!focus || !input.trim()} className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-primary-foreground disabled:opacity-40" aria-label="Send"><Send className="h-4 w-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
