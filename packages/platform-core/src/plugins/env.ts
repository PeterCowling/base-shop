import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

import type { LoadPluginsOptions } from "../plugins";

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function findPluginsDir(start: string): string {
  let dir = start;
  while (true) {
    const candidate = path.join(dir, "packages", "plugins");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-0001 Candidate is derived path within repo tree
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return candidate;
    dir = parent;
  }
}

export async function resolvePluginEnvironment({
  directories = [],
  plugins = [],
  configFile,
}: LoadPluginsOptions = {}) {
  const workspaceDir = findPluginsDir(process.cwd());

  const envDirs = process.env.PLUGIN_DIRS
    ? process.env.PLUGIN_DIRS.split(path.delimiter).filter(Boolean)
    : [];

  const configDirs: string[] = [];
  const configPlugins: string[] = [];
  const configPaths = [
    configFile,
    process.env.PLUGIN_CONFIG,
    path.join(process.cwd(), "plugins.config.json"),
  ].filter(Boolean) as string[];

  for (const cfgPath of configPaths) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-0001 Config path from env/arg; JSON-only read
      const cfg = JSON.parse(await readFile(cfgPath, "utf8"));
      if (Array.isArray(cfg.directories)) configDirs.push(...cfg.directories);
      if (Array.isArray(cfg.plugins)) configPlugins.push(...cfg.plugins);
      break;
    } catch {
      /* ignore invalid config */
    }
  }

  const searchDirs = unique([
    workspaceDir,
    ...envDirs,
    ...configDirs,
    ...directories,
  ]);

  const pluginDirs = [...configPlugins, ...plugins].map((p) => path.resolve(p));

  return { searchDirs, pluginDirs };
}
