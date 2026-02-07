const STORAGE_KEY = "pb:installed-apps";
const GLOBAL_KEY = "__global__";

export const INSTALLED_APPS_EVENT = "pb:installed-apps-change";

export interface InstalledAppsChangeDetail {
  shop: string | null;
  apps: string[];
}

type StorageShape = Record<string, string[]>;

type MaybeWindow = typeof window | undefined;

const getWindow = (): MaybeWindow => (typeof window !== "undefined" ? window : undefined);

const readStorage = (): StorageShape => {
  const w = getWindow();
  if (!w?.localStorage) return {};
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.keys(parsed as Record<string, unknown>).reduce<StorageShape>((acc, key) => {
      const value = (parsed as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        acc[key] = value.filter((item): item is string => typeof item === "string");
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const writeStorage = (data: StorageShape): void => {
  const w = getWindow();
  if (!w?.localStorage) return;
  try {
    if (Object.keys(data).length === 0) {
      w.localStorage.removeItem(STORAGE_KEY);
    } else {
      w.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore write failures (private mode, quota exceeded, etc.)
  }
};

const normalizeShop = (shop?: string | null): string => (shop ? shop : GLOBAL_KEY);

const dispatchChange = (shop: string | null, apps: string[]): void => {
  const w = getWindow();
  if (!w) return;
  try {
    const event = new CustomEvent<InstalledAppsChangeDetail>(INSTALLED_APPS_EVENT, {
      detail: { shop, apps: [...apps] },
    });
    w.dispatchEvent(event);
  } catch {
    // no-op if CustomEvent fails (older browsers)
  }
};

const saveApps = (shop: string | null, apps: string[]): void => {
  const key = normalizeShop(shop);
  const trimmed = apps.filter((appId) => typeof appId === "string" && appId.trim().length > 0);
  const deduped = Array.from(new Set(trimmed));
  const storage = readStorage();
  if (deduped.length === 0) {
    delete storage[key];
  } else {
    storage[key] = deduped;
  }
  writeStorage(storage);
  dispatchChange(shop, deduped);
};

export const listInstalledApps = (shop?: string | null): string[] => {
  const key = normalizeShop(shop ?? null);
  const storage = readStorage();
  return [...(storage[key] ?? [])];
};

export const setInstalledApps = (shop: string | null, apps: string[]): void => {
  saveApps(shop, apps);
};

export const installApp = (shop: string | null, appId: string): string[] => {
  const current = listInstalledApps(shop);
  if (!appId || current.includes(appId)) {
    return current;
  }
  const next = [...current, appId];
  saveApps(shop, next);
  return next;
};

export const uninstallApp = (shop: string | null, appId: string): string[] => {
  const current = listInstalledApps(shop);
  const next = current.filter((id) => id !== appId);
  saveApps(shop, next);
  return next;
};

export const subscribeInstalledApps = (
  shop: string | null,
  callback: (apps: string[]) => void,
): (() => void) => {
  const w = getWindow();
  if (!w) return () => {};

  const targetShop = shop ?? null;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<InstalledAppsChangeDetail>).detail;
    if (!detail) return;
    if ((detail.shop ?? null) !== targetShop) return;
    callback([...detail.apps]);
  };

  w.addEventListener(INSTALLED_APPS_EVENT, handler as EventListener);
  return () => w.removeEventListener(INSTALLED_APPS_EVENT, handler as EventListener);
};

export const clearInstalledApps = (shop?: string | null): void => {
  const key = normalizeShop(shop ?? null);
  const storage = readStorage();
  delete storage[key];
  writeStorage(storage);
  dispatchChange(shop ?? null, []);
};
