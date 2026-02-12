import { dirname, join } from "path";
import { fileURLToPath } from "url";

/** Root of packages/mcp-server/data/ — resolved from the compiled file location. */
export const DATA_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data"
);

/** Root of apps/brikette/src/ — resolved from the compiled file location. */
export const BRIKETTE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "apps",
  "brikette",
  "src"
);
