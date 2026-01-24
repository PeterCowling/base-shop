import { readFileSync } from "fs";
import { join } from "path";

import { tokens } from "../../../packages/themes/base/src/tokens";

describe("design tokens CSS", () => {
  const staticCss = readFileSync(
    join(__dirname, "../../../packages/themes/base/tokens.static.css"),
    "utf8"
  );
  const dynamicCss = readFileSync(
    join(__dirname, "../../../packages/themes/base/tokens.dynamic.css"),
    "utf8"
  );

  it("contains all token keys in both CSS outputs", () => {
    for (const name of Object.keys(tokens)) {
      expect(staticCss).toContain(`${name}:`);
      expect(dynamicCss).toContain(`${name}:`);
    }
  });
});
