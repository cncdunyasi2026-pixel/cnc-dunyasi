const STORAGE_KEY = "gd:dismissed-notifications";

type DismissedStore = Record<string, string[]>;

function readStore(): DismissedStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DismissedStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: DismissedStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* yoksay */
  }
}

export function getDismissedNotificationIds(userId: string): Set<string> {
  const ids = readStore()[userId];
  return new Set(Array.isArray(ids) ? ids : []);
}

export function dismissNotificationIds(userId: string, ids: string[]): void {
  if (!userId || ids.length === 0) return;
  const store = readStore();
  const current = new Set(store[userId] ?? []);
  for (const id of ids) current.add(id);
  store[userId] = [...current];
  writeStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gd:notifications-dismissed"));
  }
}

export function isNotificationDismissed(userId: string, id: string): boolean {
  return getDismissedNotificationIds(userId).has(id);
}
