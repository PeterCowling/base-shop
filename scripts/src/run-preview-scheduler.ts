import { createRequire } from "node:module";
// Defer requiring the JS module to avoid TS resolving external TS sources

async function main() {
  // Use CommonJS require to avoid TS attempting to include external TS files
  // for type-checking. The .d.ts provides types at dev time, and runtime loads JS.
  const require = createRequire(import.meta.url);
  const sched = require("../../functions/src/previewScheduler.js").default as {
    scheduled(): Promise<void>;
  };
  await sched.scheduled();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
