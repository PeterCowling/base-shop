// packages/platform-core/createShop/utils/copyTemplate.ts
import { cpSync } from "fs";

/**
 * Copy a template application into a new shop directory.
 *
 * `node_modules` folders are skipped during the copy.
 */
export function copyTemplate(source: string, destination: string): void {
  cpSync(source, destination, {
    recursive: true,
    filter: (src) => !/node_modules/.test(src),
  });
}
