// CT shim for @cms/actions/shops.server
// Provides a simple in-memory implementation of updateSeo that returns
// warnings for long fields and errors for missing required fields.

export async function updateSeo(_shop: string, fd: FormData): Promise<{
  errors?: Record<string, string[]>;
  warnings?: string[];
}> {
  const title = String(fd.get('title') ?? '');
  const description = String(fd.get('description') ?? '');
  const warnings: string[] = [];
  const errors: Record<string, string[]> = {};

  if (!title.trim()) {
    errors.title = ['Required'];
  }
  if (title.length > 70) {
    warnings.push('Title exceeds recommended length (≤ 70)');
  }
  if (description.length > 160) {
    warnings.push('Description exceeds recommended length (≤ 160)');
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { warnings };
}

export default { updateSeo };

// Stub for revertSeo used by VersionTimeline
export async function revertSeo(shop: string, timestamp: string): Promise<void> {
  if (shop === 'fail' || String(timestamp).toLowerCase() === 'fail') {
    throw new Error('revert failed');
  }
  // Simulate pruning history entries at/after the timestamp
  const g = globalThis as any;
  const key = '__versions_history';
  const list = (g[key] as any[]) || [];
  const next = list.filter((e) => String(e.timestamp) < String(timestamp));
  g[key] = next;
  // Track call (optional)
  const callsKey = '__cms_actions_calls';
  g[callsKey] = (g[callsKey] as any[]) || [];
  g[callsKey].push({ fn: 'revertSeo', shop, timestamp });
}

// Stub for resetThemeOverride used in ConfigurationOverview
export async function resetThemeOverride(_shop: string, _token: string): Promise<void> {
  const g = globalThis as any;
  const callsKey = '__cms_actions_calls';
  g[callsKey] = (g[callsKey] as any[]) || [];
  g[callsKey].push({ fn: 'resetThemeOverride', token: _token });
}
