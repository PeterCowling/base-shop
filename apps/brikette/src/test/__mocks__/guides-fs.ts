// Mock for @/locales/guides.fs in Jest tests
// The real module uses import.meta.url which Jest CJS mode can't parse

export function isNodeRuntime(): boolean {
  return true;
}

export async function loadGuidesModuleOverridesFromFs() {
  return undefined;
}

export function loadGuidesModuleOverridesFromFsSync() {
  return undefined;
}
