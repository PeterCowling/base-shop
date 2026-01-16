// i18n-exempt file -- ROUTES-712 [ttl=2026-12-31] Build-time module glob patterns, not UI copy
type ModuleLike = Record<string, unknown>;

const JSON_LD_GLOB = import.meta.glob<ModuleLike>(
  [
    "../**/*.jsonld.ts",
    "../**/*.jsonld.tsx",
    "../**/*.schema.ts",
    "../**/*.schema.tsx",
    "../**/*JsonLd.ts",
    "../**/*JsonLd.tsx",
    "../**/*JsonLD.ts",
    "../**/*JsonLD.tsx",
    "../**/*StructuredData.ts",
    "../**/*StructuredData.tsx",
    "../**/*Meta.ts",
    "../**/*Meta.tsx",
    "../**/*MetaBridge.ts",
    "../**/*MetaBridge.tsx",
  ],
  { eager: true },
);

const SERVICE_SCHEMA_GLOB = import.meta.glob<ModuleLike>(
  ["../**/*.service.{ts,tsx}", "../**/*.service-data.{ts,tsx}"],
  { eager: true },
);

const GALLERY_GLOB = import.meta.glob<ModuleLike>(["../**/*.gallery.{ts,tsx}"], { eager: true });

const jsonLdModules = buildModuleMap(JSON_LD_GLOB, (key) => normalizeModuleKey(key));
const serviceSchemaModules = buildModuleMap(SERVICE_SCHEMA_GLOB, (key) => normalizeModuleKey(key));
const galleryModules = buildModuleMap(GALLERY_GLOB, (key) => normalizeGalleryKey(key));

export function getJsonLdModule(specifier: string): ModuleLike | undefined {
  if (!specifier) return undefined;
  const key = normalizeModuleSpecifier(specifier);
  return jsonLdModules.get(key);
}

export function getServiceSchemaModule(specifier: string | undefined): ModuleLike | undefined {
  if (!specifier) return undefined;
  const key = normalizeModuleSpecifier(specifier);
  return serviceSchemaModules.get(key);
}

export function getGalleryModule(source: string | undefined): ModuleLike | undefined {
  if (!source) return undefined;
  const normalized = normalizeGallerySpecifier(source);
  return galleryModules.get(normalized);
}

function buildModuleMap(
  modules: Record<string, ModuleLike>,
  normalizer: (key: string) => string,
): Map<string, ModuleLike> {
  const map = new Map<string, ModuleLike>();
  for (const [key, mod] of Object.entries(modules)) {
    const normalized = normalizer(key);
    if (!normalized) continue;
    map.set(normalized, mod);
  }
  return map;
}

function normalizeModuleSpecifier(value: string): string {
  return value
    .replace(/^\.\//, "")
    .replace(/^\.\.\//, "")
    .replace(/^@\/routes\/guides\//, "")
    .replace(/\.(cm)?jsx?$/i, "")
    .replace(/\.(t|j)sx?$/i, "");
}

function normalizeModuleKey(key: string): string {
  return key.replace(/^\.\.\//, "").replace(/^\.\//, "").replace(/\.(cm)?jsx?$/i, "").replace(/\.(t|j)sx?$/i, "");
}

function normalizeGalleryKey(key: string): string {
  return normalizeModuleKey(key).replace(/\.gallery$/, "");
}

function normalizeGallerySpecifier(value: string): string {
  return normalizeModuleSpecifier(value).replace(/\.gallery$/, "");
}
