export type Msg = { role: "user" | "assistant"; content: string; mode?: string };
export type Mode = "fast" | "think" | "auto" | "genius";

export async function streamChat(
  opts: { messages: Msg[]; mode: Mode; focus: string; code?: string | undefined; filename?: string | undefined; signal?: AbortSignal | undefined },
  onDelta: (t: string) => void,
  onReason?: (t: string) => void,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal ?? null,
    body: JSON.stringify({ ...opts, messages: opts.messages.map(({ role, content }) => ({ role, content })), signal: undefined }),
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Request failed (${res.status})`);
  }
  const mode = res.headers.get("X-Mestro-Mode") || opts.mode;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return mode;
      try {
        const d = JSON.parse(data).choices?.[0]?.delta;
        if (d?.content) onDelta(d.content);
        if (d?.reasoning && onReason) onReason(d.reasoning);
      } catch { /* partial */ }
    }
  }
  return mode;
}

export function lastCodeBlock(text: string): { lang: string; code: string } | null {
  const re = /```(\w[\w+#-]*)?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null, last: { lang: string; code: string } | null = null;
  while ((m = re.exec(text))) last = { lang: m[1] || "", code: m[2] ?? "" };
  return last;
}
