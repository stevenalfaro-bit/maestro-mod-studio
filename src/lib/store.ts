import { useSyncExternalStore } from "react";
import type JSZip from "jszip";

export type LogLevel = "info" | "ok" | "warn" | "err" | "step";
export type Log = { t: number; level: LogLevel; msg: string };
export type Project = { id: string; name: string; kind: string; createdAt: number; note?: string };

type State = {
  apk: JSZip | null;
  apkName: string;
  logs: Log[];
  version: number;
};

let state: State = { apk: null, apkName: "", logs: [], version: 0 };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const store = {
  get: () => state,
  set(p: Partial<State>) {
    state = { ...state, ...p, version: state.version + 1 };
    emit();
  },
  log(level: LogLevel, msg: string) {
    state = { ...state, logs: [...state.logs, { t: Date.now(), level, msg }].slice(-800) };
    emit();
  },
  clearLogs() {
    state = { ...state, logs: [] };
    emit();
  },
};

export function useStore() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
    () => state,
  );
}

export const log = {
  step: (m: string) => store.log("step", m),
  info: (m: string) => store.log("info", m),
  ok: (m: string) => store.log("ok", m),
  warn: (m: string) => store.log("warn", m),
  err: (m: string) => store.log("err", m),
};

const PKEY = "mestro_projects";
export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; }
}
export function addProject(p: Omit<Project, "id" | "createdAt">) {
  const list = [{ ...p, id: crypto.randomUUID(), createdAt: Date.now() }, ...getProjects()].slice(0, 200);
  localStorage.setItem(PKEY, JSON.stringify(list));
}
export function removeProject(id: string) {
  localStorage.setItem(PKEY, JSON.stringify(getProjects().filter((p) => p.id !== id)));
}

export function cleanName(name: string, ext: string) {
  const base = (name || "output").trim().replace(/[^\w.\- ]+/g, "_").replace(/\.(apk|zip|so)$/i, "") || "output";
  return `${base}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(2)} MB`;
}
