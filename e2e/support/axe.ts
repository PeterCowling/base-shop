import type { Page } from "@playwright/test";
import type { AxeResults } from "axe-core";
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const axePath: string = require.resolve("axe-core/axe.min.js");
// Path is resolved via require.resolve, so user input cannot influence the fs read.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const axeSource: string = readFileSync(axePath, "utf8");

export async function runAxe(page: Page): Promise<AxeResults> {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: () => Promise<AxeResults> } }).axe;
    return axe.run();
  });
}

export function formatViolations(violations: AxeResults["violations"]): string {
  return violations
    .map(
      ({ id, impact, help, nodes }) =>
        `${impact?.toUpperCase() || "UNKNOWN"} – ${id}: ${help}\n  affected nodes: ${nodes.length}`,
    )
    .join("\n\n");
}