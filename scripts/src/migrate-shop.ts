import { execSync } from "node:child_process";

import { mean as libMean } from "@acme/lib/math/statistics";

import { inlineStylesToTokens } from "./codemods/inline-styles-to-tokens";
import { tokensToCssVars } from "./codemods/tokens-to-css-vars";

export interface MigrationReport {
  coverage: number;
  unmapped: string[];
  manualActions: string[];
}

export function run({ apply }: { apply: boolean }): MigrationReport {
  const results = [
    tokensToCssVars({ apply }),
    inlineStylesToTokens({ apply }),
  ];
  const coverage = Math.round(libMean(results.map((result) => result.coverage)));
  const unmapped = results.flatMap((r) => r.unmapped);
  const manualActions = ["Review new theme tokens", "Adjust custom styles"];
  console.log(`Token coverage: ${coverage}%`);
  console.log(
    `Unmapped tokens: ${unmapped.length ? unmapped.join(", ") : "None"}`,
  );
  console.log(`Manual actions: ${manualActions.join(", ")}`);
  if (apply) {
    execSync("git checkout -b migration-branch");
  }
  return { coverage, unmapped, manualActions };
}
if (process.argv[1]?.includes("migrate-shop")) {
  run({ apply: process.argv.includes("--apply") });
}
