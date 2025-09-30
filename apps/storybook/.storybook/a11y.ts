const WCAG_RULESETS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "best-practice",
] as const;

export const a11yParameters = {
  a11y: {
    context: "body",
    config: {},
    options: {
      // Align with Storybook defaults and ensure best practice checks are run
      runOnly: [...WCAG_RULESETS],
    },
    test: "error",
  },
} as const satisfies Record<string, unknown>;

export const a11yGlobals = {
  a11y: {
    manual: false,
  },
} as const satisfies Record<string, unknown>;
