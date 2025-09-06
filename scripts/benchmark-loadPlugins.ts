import { mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import { createHook } from "async_hooks";

const COUNT = parseInt(process.argv[2] ?? "1000", 10);
const BASE_DIR = path.join("packages", ".bench-plugins");

async function createDummyPlugins(count: number) {
  await rm(BASE_DIR, { recursive: true, force: true });
  for (let i = 0; i < count; i++) {
    const dir = path.join(BASE_DIR, `plugin-${i}`);
    await mkdir(path.join(dir, "dist"), { recursive: true });
    const pkg = {
      name: `dummy-plugin-${i}`,
      version: "0.0.1",
      type: "module",
      main: "dist/index.js",
    };
    await writeFile(path.join(dir, "package.json"), JSON.stringify(pkg));
    const code = `export default { id: \"dummy-plugin-${i}\", name: \"Dummy Plugin ${i}\" };`;
    await writeFile(path.join(dir, "dist/index.js"), code);
  }
}

async function run() {
  await createDummyPlugins(COUNT);
  const ioCounts = new Map<string, number>();
  const hook = createHook({
    init(_id, type) {
      if (type.startsWith("FS")) {
        ioCounts.set(type, (ioCounts.get(type) ?? 0) + 1);
      }
    },
  });
  const originalEval = global.eval;
  global.eval = (code) => {
    if (code === "import.meta.url") return import.meta.url;
    return originalEval(code);
  };
  const { loadPlugins } = await import(
    "../packages/platform-core/dist/plugins.js"
  );
  hook.enable();
  const start = performance.now();
  const plugins = await loadPlugins({ directories: [BASE_DIR] });
  const duration = performance.now() - start;
  hook.disable();
  global.eval = originalEval;
  console.log(
    `Loaded ${plugins.length} plugins in ${duration.toFixed(2)} ms`
  );
  console.log(
    `IO counts: ${JSON.stringify(Object.fromEntries(ioCounts))}`
  );
  const threshold = 500;
  if (duration > threshold) {
    console.log(
      `Runtime exceeded ${threshold} ms; consider parallelizing directory reads.`
    );
  }
  await rm(BASE_DIR, { recursive: true, force: true });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
