import noRawColor from "./rules/no-raw-color.js";
import noRawFont from "./rules/no-raw-font.js";
import noRawTailwindColor from "./rules/no-raw-tailwind-color.js";
import noHslVarInTests from "./rules/no-hsl-var-in-tests.js";

export const rules = {
  "no-raw-color": noRawColor,
  "no-raw-font": noRawFont,
  "no-raw-tailwind-color": noRawTailwindColor,
  "no-hsl-var-in-tests": noHslVarInTests,
};

const plugin = { rules };
export default plugin;
