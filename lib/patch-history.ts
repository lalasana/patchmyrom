export type PatchHistoryEntry = {
  id: string;
  date: string;
  romFileName: string;
  patchFileName: string;
  format: string;
  outputFileName: string;
};

export const PATCH_HISTORY_STORAGE_KEY = "patchmyrom_patch_history";
export const PATCH_HISTORY_UPDATED_EVENT = "patchmyrom_patch_history_updated";
const MAX_HISTORY_ENTRIES = 10;

function isHistoryEntry(value: unknown): value is PatchHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.romFileName === "string" &&
    typeof entry.patchFileName === "string" &&
    typeof entry.format === "string" &&
    typeof entry.outputFileName === "string"
  );
}

function parseHistory(raw: string | null): PatchHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

// useSyncExternalStore requires getSnapshot to return a stable reference
// when the underlying value hasn't changed, so the raw string is cached
// alongside the parsed result (same pattern as lib/cookie-consent.ts).
let cachedRaw: string | null | undefined;
let cachedHistory: PatchHistoryEntry[] = [];

export function readStoredHistory(): PatchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PATCH_HISTORY_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedHistory = parseHistory(raw);
  }
  return cachedHistory;
}

export function addHistoryEntry(entry: Omit<PatchHistoryEntry, "id" | "date">) {
  if (typeof window === "undefined") return;
  const existing = readStoredHistory();
  const next: PatchHistoryEntry[] = [
    {
      ...entry,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      date: new Date().toISOString(),
    },
    ...existing,
  ].slice(0, MAX_HISTORY_ENTRIES);
  window.localStorage.setItem(PATCH_HISTORY_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PATCH_HISTORY_UPDATED_EVENT));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PATCH_HISTORY_STORAGE_KEY);
  window.dispatchEvent(new Event(PATCH_HISTORY_UPDATED_EVENT));
}

export function subscribeToStoredHistory(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PATCH_HISTORY_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PATCH_HISTORY_UPDATED_EVENT, callback);
  };
}
