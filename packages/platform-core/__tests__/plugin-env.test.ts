import fs from "node:fs";
import * as fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { findPluginsDir, resolvePluginEnvironment } from "../src/plugins/env";

describe("findPluginsDir", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns discovered plugins directory", () => {
    const start = "/root/a/b";
    const found = "/root/a/packages/plugins";

    jest
      .spyOn(fs, "existsSync")
      .mockImplementation((p: any) => p === found);

    jest.spyOn(path, "dirname").mockImplementation((p: string) => {
      const map: Record<string, string> = {
        "/root/a/b": "/root/a",
        "/root/a": "/root",
        "/root": "/",
        "/": "/",
      };
      return map[p];
    });

    expect(findPluginsDir(start)).toBe(found);
  });

  it("returns final candidate when directory not found", () => {
    const start = "/root/a/b";

    jest.spyOn(fs, "existsSync").mockReturnValue(false);

    jest.spyOn(path, "dirname").mockImplementation((p: string) => {
      const map: Record<string, string> = {
        "/root/a/b": "/root/a",
        "/root/a": "/root",
        "/root": "/",
        "/": "/",
      };
      return map[p];
    });

    expect(findPluginsDir(start)).toBe("/packages/plugins");
  });
});

describe("resolvePluginEnvironment", () => {
  const cwd = process.cwd();

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.PLUGIN_DIRS;
    delete process.env.PLUGIN_CONFIG;
    process.chdir(cwd);
  });

  it("merges env vars, config file and options", async () => {
    const root = await fsPromises.mkdtemp(path.join(os.tmpdir(), "ws-"));
    const realRoot = await fsPromises.realpath(root);
    const workspaceDir = path.join(realRoot, "packages", "plugins");
    await fsPromises.mkdir(workspaceDir, { recursive: true });
    const start = path.join(realRoot, "a", "b");
    await fsPromises.mkdir(start, { recursive: true });
    process.chdir(start);

    process.env.PLUGIN_DIRS = ["/env/one", "/env/two"].join(path.delimiter);

    const cfgPath = path.join(realRoot, "plugins.config.json");
    await fsPromises.writeFile(
      cfgPath,
      JSON.stringify({
        directories: ["/cfg/dir"],
        plugins: ["/cfg/plugin"],
      })
    );

    const result = await resolvePluginEnvironment({
      directories: ["/opt/extra"],
      plugins: ["/opt/plugin"],
      configFile: cfgPath,
    });

    expect(result).toEqual({
      searchDirs: [
        workspaceDir,
        "/env/one",
        "/env/two",
        "/cfg/dir",
        "/opt/extra",
      ],
      pluginDirs: ["/cfg/plugin", "/opt/plugin"],
    });
  });

  it("ignores invalid config files", async () => {
    const root = await fsPromises.mkdtemp(path.join(os.tmpdir(), "ws-"));
    const realRoot = await fsPromises.realpath(root);
    const workspaceDir = path.join(realRoot, "packages", "plugins");
    await fsPromises.mkdir(workspaceDir, { recursive: true });
    const start = path.join(realRoot, "a", "b");
    await fsPromises.mkdir(start, { recursive: true });
    process.chdir(start);

    const badCfg = path.join(realRoot, "bad-config.json");
    await fsPromises.writeFile(badCfg, "not json");

    process.env.PLUGIN_DIRS = "/env/one";

    const result = await resolvePluginEnvironment({
      directories: ["/opt/extra"],
      plugins: ["/opt/plugin"],
      configFile: badCfg,
    });

    expect(result).toEqual({
      searchDirs: [workspaceDir, "/env/one", "/opt/extra"],
      pluginDirs: ["/opt/plugin"],
    });
  });
});

