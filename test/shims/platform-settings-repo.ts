// CT shim for @acme/platform-core/repositories/settings.server
// Provides an in-memory diffHistory that reads from a global list.

export type SettingsDiffEntry = { timestamp: string; diff: unknown };

type VersionsHistoryState = {
  __versions_history?: SettingsDiffEntry[];
  __versions_fail_on_fetch?: boolean;
};

function init() {
  const g = globalThis as unknown as VersionsHistoryState;
  if (!g.__versions_history) {
    g.__versions_history = [
      { timestamp: '2024-01-01T00:00:00.000Z', diff: { seo: { title: 'Old' } } },
      { timestamp: '2024-02-01T00:00:00.000Z', diff: { seo: { title: 'New' } } },
    ] as SettingsDiffEntry[];
  }
}

export async function diffHistory(_shop: string): Promise<SettingsDiffEntry[]> {
  init();
  const g = globalThis as unknown as VersionsHistoryState;
  if (g.__versions_fail_on_fetch) {
    throw new Error('diffHistory failed');
  }
  return [...(g.__versions_history as SettingsDiffEntry[])];
}

export type { SettingsDiffEntry as default };
