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
import noNegativeMargins from "./rules/no-negative-margins.js";
import noMarginsOnAtoms from "./rules/no-margins-on-atoms.js";
import enforceLayoutPrimitives from "./rules/enforce-layout-primitives.js";
import containerWidthsOnlyAt from "./rules/container-widths-only-at.js";
import requireMinW0InFlex from "./rules/require-min-w-0-in-flex.js";
import forbidFixedHeightsOnText from "./rules/forbid-fixed-heights-on-text.js";
import requireBreakpointModifiers from "./rules/require-breakpoint-modifiers.js";
import noHardcodedCopy from "./rules/no-hardcoded-copy.js";
import noPhysicalDirectionClassesInRtl from "./rules/no-physical-direction-classes-in-rtl.js";
import enforceFocusRingToken from "./rules/enforce-focus-ring-token.js";
import minTapSize from "./rules/min-tap-size.js";
import noMisusedSrOnly from "./rules/no-misused-sr-only.js";

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
  "no-negative-margins": noNegativeMargins,
  "no-margins-on-atoms": noMarginsOnAtoms,
  "enforce-layout-primitives": enforceLayoutPrimitives,
  "container-widths-only-at": containerWidthsOnlyAt,
  "require-min-w-0-in-flex": requireMinW0InFlex,
  "forbid-fixed-heights-on-text": forbidFixedHeightsOnText,
  "require-breakpoint-modifiers": requireBreakpointModifiers,
  "no-hardcoded-copy": noHardcodedCopy,
  "no-physical-direction-classes-in-rtl": noPhysicalDirectionClassesInRtl,
  "enforce-focus-ring-token": enforceFocusRingToken,
  "min-tap-size": minTapSize,
  "no-misused-sr-only": noMisusedSrOnly,
};

const plugin = { rules };
export default plugin;
