import noRawColor from "./rules/no-raw-color.js";
import noRawFont from "./rules/no-raw-font.js";
import noRawTailwindColor from "./rules/no-raw-tailwind-color.js";
import noHslVarInTests from "./rules/no-hsl-var-in-tests.js";
import noHeroPrimaryForeground from "./rules/no-hero-primary-foreground.js";
import iconButtonSize from "./rules/icon-button-size.js";
import noRawSpacing from "./rules/no-raw-spacing.js";
import noRawTypography from "./rules/no-raw-typography.js";
import noRawRadius from "./rules/no-raw-radius.js";
import noRawShadow from "./rules/no-raw-shadow.js";
import noRawZindex from "./rules/no-raw-zindex.js";
import noArbitraryTailwind from "./rules/no-arbitrary-tailwind.js";
import noImportant from "./rules/no-important.js";

export const rules = {
  "no-raw-color": noRawColor,
  "no-raw-font": noRawFont,
  "no-raw-tailwind-color": noRawTailwindColor,
  "no-hsl-var-in-tests": noHslVarInTests,
  "no-hero-primary-foreground": noHeroPrimaryForeground,
  "icon-button-size": iconButtonSize,
  "no-raw-spacing": noRawSpacing,
  "no-raw-typography": noRawTypography,
  "no-raw-radius": noRawRadius,
  "no-raw-shadow": noRawShadow,
  "no-raw-zindex": noRawZindex,
  "no-arbitrary-tailwind": noArbitraryTailwind,
  "no-important": noImportant,
};

const plugin = { rules };
export default plugin;
