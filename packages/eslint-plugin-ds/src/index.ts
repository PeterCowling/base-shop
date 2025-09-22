import noRawColor from "./rules/no-raw-color.js";
import noRawFont from "./rules/no-raw-font.js";
import noRawTailwindColor from "./rules/no-raw-tailwind-color.js";
import noHslVarInTests from "./rules/no-hsl-var-in-tests.js";
import noHeroPrimaryForeground from "./rules/no-hero-primary-foreground.js";

export const rules = {
  "no-raw-color": noRawColor,
  "no-raw-font": noRawFont,
  "no-raw-tailwind-color": noRawTailwindColor,
  "no-hsl-var-in-tests": noHslVarInTests,
  "no-hero-primary-foreground": noHeroPrimaryForeground,
};

const plugin = { rules };
export default plugin;
