import { mkdir,mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { findPluginsDir,resolvePluginEnvironment } from "../env";

describe("resolvePluginEnvironment", () => {
  afterEach(() => {
    delete process.env.PLUGIN_DIRS;
    delete process.env.PLUGIN_CONFIG;
    jest.restoreAllMocks();
  });

  it("merges environment vars and config file", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "plugin-env-"));
    const envDir1 = path.join(tmp, "env1");
    const envDir2 = path.join(tmp, "env2");
    const cfgDir = path.join(tmp, "cfgDir");
    const cfgPlugin = path.join(tmp, "cfgPlugin");
    const optDir = path.join(tmp, "optDir");
    const optPlugin = path.join(tmp, "optPlugin");

    const configPath = path.join(tmp, "plugins.json");
    await writeFile(
      configPath,
      JSON.stringify({ directories: [cfgDir], plugins: [cfgPlugin] })
    );

    process.env.PLUGIN_DIRS = [envDir1, envDir2].join(path.delimiter);
    process.env.PLUGIN_CONFIG = configPath;

    const result = await resolvePluginEnvironment({
      directories: [optDir],
      plugins: [optPlugin],
    });

    const workspaceDir = findPluginsDir(process.cwd());

    expect(result.searchDirs).toEqual(
      expect.arrayContaining([workspaceDir, envDir1, envDir2, cfgDir, optDir])
    );

    expect(result.pluginDirs).toEqual(
      expect.arrayContaining([path.resolve(cfgPlugin), path.resolve(optPlugin)])
    );
  });

  it("reads directories and plugins from default config", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-env-"));
    await mkdir(path.join(root, "packages", "plugins"), { recursive: true });
    const pluginPath = path.join(root, "fromConfig");
    const config = {
      directories: ["relDir"],
      plugins: [pluginPath],
    };
    await writeFile(
      path.join(root, "plugins.config.json"),
      JSON.stringify(config)
    );

    jest.spyOn(process, "cwd").mockReturnValue(root);

    const result = await resolvePluginEnvironment();

    expect(result.searchDirs).toEqual([
      path.join(root, "packages", "plugins"),
      ...config.directories,
    ]);

    expect(result.pluginDirs).toEqual([path.resolve(pluginPath)]);
  });

  it("ignores invalid config file", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-env-"));
    await mkdir(path.join(root, "packages", "plugins"), { recursive: true });
    const badCfg = path.join(root, "bad.json");
    await writeFile(badCfg, "{invalid json");

    jest.spyOn(process, "cwd").mockReturnValue(root);

    const result = await resolvePluginEnvironment({ configFile: badCfg });

    expect(result.searchDirs).toEqual([
      path.join(root, "packages", "plugins"),
    ]);
    expect(result.pluginDirs).toEqual([]);
  });
});
