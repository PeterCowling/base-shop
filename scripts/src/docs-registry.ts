/* i18n-exempt file -- DOCS-2102 CLI-only docs registry loader; developer messaging only [ttl=2026-12-31] */
import { promises as fs } from "fs";
import path from "path";

export interface DocRegistryEntry {
  path: string;
  type: string;
  status: string | null;
  domain: string | null;
}

export type DocRegistry = DocRegistryEntry[];

function resolveRegistryPath(baseDir: string): string {
  const normalizedBase = path.resolve(baseDir || ".");
  const docsRoot = path.join(normalizedBase, "docs");
  const docsRootWithSep = `${docsRoot}${path.sep}`;
  const registryPath = path.join(docsRoot, "registry.json");
  if (
    registryPath !== docsRoot &&
    !registryPath.startsWith(docsRootWithSep)
  ) {
    throw new Error(`[docs-registry] Registry path escapes docs/: ${registryPath}`);
  }
  return registryPath;
}

/**
 * Load the documentation registry produced by docs-lint.
 *
 * By default this reads docs/registry.json from the current working directory.
 */
export async function loadDocsRegistry(
  baseDir: string = process.cwd(),
): Promise<DocRegistry> {
  const registryPath = resolveRegistryPath(baseDir);
   
  const buf = await fs.readFile(registryPath, "utf8");
  const data = JSON.parse(buf) as unknown;
  if (!Array.isArray(data)) {
    throw new TypeError(
      `docs/registry.json is not an array; got ${typeof data}`,
    );
  }
  return data.map((entry) => {
    const typed = entry as Partial<DocRegistryEntry>;
    return {
      path: String(typed.path ?? ""),
      type: String(typed.type ?? ""),
      status: typed.status ?? null,
      domain: typed.domain ?? null,
    };
  });
}

export function docsByDomain(
  registry: DocRegistry,
  domain: string,
): DocRegistry {
  return registry.filter((entry) => entry.domain === domain);
}

export function docsByType(
  registry: DocRegistry,
  type: string,
): DocRegistry {
  return registry.filter((entry) => entry.type === type);
}

export function charterForDomain(
  registry: DocRegistry,
  domain: string,
): DocRegistryEntry | undefined {
  return registry.find(
    (entry) => entry.domain === domain && entry.type === "Charter",
  );
}

export function contractsForDomain(
  registry: DocRegistry,
  domain: string,
): DocRegistry {
  return registry.filter(
    (entry) => entry.domain === domain && entry.type === "Contract",
  );
}

export function plansForDomain(
  registry: DocRegistry,
  domain: string,
): DocRegistry {
  return registry.filter(
    (entry) => entry.domain === domain && entry.type === "Plan",
  );
}

export function activeDocs(registry: DocRegistry): DocRegistry {
  return registry.filter(
    (entry) =>
      entry.status === "Canonical" ||
      entry.status === "Active" ||
      entry.type === "ADR",
  );
}
