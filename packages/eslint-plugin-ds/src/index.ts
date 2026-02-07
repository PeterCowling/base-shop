import absoluteParentGuard from "./rules/absolute-parent-guard.js";
import containerWidthsOnlyAt from "./rules/container-widths-only-at.js";
import enforceFocusRingToken from "./rules/enforce-focus-ring-token.js";
import enforceLayoutPrimitives from "./rules/enforce-layout-primitives.js";
import forbidFixedHeightsOnText from "./rules/forbid-fixed-heights-on-text.js";
import iconButtonSize from "./rules/icon-button-size.js";
import minTapSize from "./rules/min-tap-size.js";
import noArbitraryTailwind from "./rules/no-arbitrary-tailwind.js";
import noHardcodedCopy from "./rules/no-hardcoded-copy.js";
import noHeroPrimaryForeground from "./rules/no-hero-primary-foreground.js";
import noHslVarInTests from "./rules/no-hsl-var-in-tests.js";
import noImportant from "./rules/no-important.js";
import noMarginsOnAtoms from "./rules/no-margins-on-atoms.js";
import noMisusedSrOnly from "./rules/no-misused-sr-only.js";
import noNakedImg from "./rules/no-naked-img.js";
import noNegativeMargins from "./rules/no-negative-margins.js";
import noNonlayeredZindex from "./rules/no-nonlayered-zindex.js";
import noOverflowHazards from "./rules/no-overflow-hazards.js";
import noPhysicalDirectionClassesInRtl from "./rules/no-physical-direction-classes-in-rtl.js";
import noRawColor from "./rules/no-raw-color.js";
import noRawFont from "./rules/no-raw-font.js";
import noRawRadius from "./rules/no-raw-radius.js";
import noRawShadow from "./rules/no-raw-shadow.js";
import noRawSpacing from "./rules/no-raw-spacing.js";
import noRawTailwindColor from "./rules/no-raw-tailwind-color.js";
import noRawTypography from "./rules/no-raw-typography.js";
import noRawZindex from "./rules/no-raw-zindex.js";
import noTransitionAll from "./rules/no-transition-all.js";
import noUnsafeViewportUnits from "./rules/no-unsafe-viewport-units.js";
import requireAspectRatioOnMedia from "./rules/require-aspect-ratio-on-media.js";
import requireBreakpointModifiers from "./rules/require-breakpoint-modifiers.js";
import requireDisableJustification from "./rules/require-disable-justification.js";
import requireMinW0InFlex from "./rules/require-min-w-0-in-flex.js";
import requireSectionPadding from "./rules/require-section-padding.js";

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
  "no-transition-all": noTransitionAll,
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
  "require-aspect-ratio-on-media": requireAspectRatioOnMedia,
  "no-naked-img": noNakedImg,
  "no-overflow-hazards": noOverflowHazards,
  "absolute-parent-guard": absoluteParentGuard,
  "no-nonlayered-zindex": noNonlayeredZindex,
  "no-unsafe-viewport-units": noUnsafeViewportUnits,
  "require-disable-justification": requireDisableJustification,
  "require-section-padding": requireSectionPadding,
};

const plugin = { rules };
export default plugin;
