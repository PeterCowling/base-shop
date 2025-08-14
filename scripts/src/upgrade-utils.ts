import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

/**
 * Build a map of component file names to their exported component names by
 * walking the `packages/ui/src/components` barrel exports.
 */
export function buildComponentExportMap(componentsDir: string) {
  const map = new Map<string, string>();

  function parseIndex(indexPath: string) {
    const source = readFileSync(indexPath, "utf8");
    const sf = ts.createSourceFile(indexPath, source, ts.ScriptTarget.ESNext, true);

    sf.forEachChild((node) => {
      if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return;

      const spec = (node.moduleSpecifier as ts.StringLiteral).text;
      const modulePath = path.resolve(path.dirname(indexPath), spec);

      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        const file = resolveModuleFile(modulePath);
        if (!file) return;
        const base = path.basename(file);
        for (const el of node.exportClause.elements) {
          const name = el.name.getText();
          if (!name.endsWith("Props") && !map.has(base)) {
            map.set(base, name);
          }
        }
      } else {
        const idx = resolveModuleFile(modulePath + "/index");
        if (idx) parseIndex(idx);
      }
    });
  }

  function resolveModuleFile(mod: string) {
    const candidates = [".ts", ".tsx", "/index.ts", "/index.tsx"];
    for (const ext of candidates) {
      const p = mod.endsWith(ext) ? mod : mod + ext;
      if (existsSync(p)) return p;
    }
    return null;
  }

  parseIndex(path.join(componentsDir, "index.ts"));
  return map;
}

/** Resolve a component name for a given file path using the provided map. */
export function resolveComponentName(
  filePath: string,
  map: Map<string, string>,
) {
  return map.get(path.basename(filePath));
}

