import { baseTokens } from "../../themeTokens";
import {
  assertValidThemeTokens,
  diffThemeTokenKeys,
  type ThemeContrastRequirement,
  ThemeTokenValidationError,
  validateThemeTokens,
} from "../index";

const BASIC_CONTRAST_REQUIREMENTS: readonly ThemeContrastRequirement[] = [
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-bg",
    minimumContrast: 4.5,
    label: "Body text",
  },
];

describe("themeValidation", () => {
  it("can validate the base theme token catalog without hard-failing unchanged debt", () => {
    const result = validateThemeTokens(baseTokens as Record<string, string>, {
      baselineTokens: baseTokens as Record<string, string>,
      changedTokenKeys: [],
    });
    expect(result.valid).toBe(true);
    expect(result.contrastChecksPerformed).toBeGreaterThan(0);
  });

  it("accepts valid token records", () => {
    const result = validateThemeTokens(
      {
        "--color-fg": "0 0% 10%",
        "--color-bg": "0 0% 100%",
      },
      { contrastRequirements: BASIC_CONTRAST_REQUIREMENTS },
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.contrastChecksPerformed).toBe(1);
  });

  it("rejects invalid token names", () => {
    const result = validateThemeTokens(
      {
        "color-fg": "0 0% 10%",
      } as unknown as Record<string, string>,
      { contrastRequirements: [] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.type === "invalid_token_name")).toBe(true);
  });

  it("flags new low-contrast regressions as errors", () => {
    const result = validateThemeTokens(
      {
        "--color-fg": "0 0% 70%",
        "--color-bg": "0 0% 100%",
      },
      {
        contrastRequirements: BASIC_CONTRAST_REQUIREMENTS,
        baselineTokens: {
          "--color-fg": "0 0% 10%",
          "--color-bg": "0 0% 100%",
        },
        changedTokenKeys: ["--color-fg"],
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.type === "low_contrast")).toBe(true);
  });

  it("downgrades pre-existing low contrast to warning when pair is unchanged", () => {
    const result = validateThemeTokens(
      {
        "--color-fg": "0 0% 70%",
        "--color-bg": "0 0% 100%",
        "--radius-md": "8px",
      },
      {
        contrastRequirements: BASIC_CONTRAST_REQUIREMENTS,
        baselineTokens: {
          "--color-fg": "0 0% 70%",
          "--color-bg": "0 0% 100%",
          "--radius-md": "6px",
        },
        changedTokenKeys: ["--radius-md"],
      },
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((issue) => issue.type === "low_contrast")).toBe(true);
  });

  it("warns when color references cannot be resolved", () => {
    const result = validateThemeTokens(
      {
        "--color-fg": "var(--missing-token)",
        "--color-bg": "0 0% 100%",
      },
      { contrastRequirements: BASIC_CONTRAST_REQUIREMENTS },
    );

    expect(result.valid).toBe(true);
    expect(
      result.warnings.some(
        (issue) =>
          issue.type === "unresolved_color_reference" ||
          issue.type === "unresolvable_contrast_pair",
      ),
    ).toBe(true);
  });

  it("does not report unresolvable contrast when only one token in a pair exists", () => {
    const result = validateThemeTokens(
      {
        "--color-fg": "0 0% 10%",
      },
      { contrastRequirements: BASIC_CONTRAST_REQUIREMENTS },
    );

    expect(
      result.issues.some((issue) => issue.type === "unresolvable_contrast_pair"),
    ).toBe(false);
  });

  it("supports escalating unresolved references to errors", () => {
    const result = validateThemeTokens(
      {
        "--color-fg": "var(--missing-token)",
        "--color-bg": "0 0% 100%",
      },
      {
        contrastRequirements: BASIC_CONTRAST_REQUIREMENTS,
        unresolvedColorReferenceSeverity: "error",
        unresolvableContrastPairSeverity: "error",
      },
    );

    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (issue) =>
          issue.type === "unresolved_color_reference" ||
          issue.type === "unresolvable_contrast_pair",
      ),
    ).toBe(true);
  });

  it("diffs changed token keys", () => {
    const changed = diffThemeTokenKeys(
      { "--a": "1", "--b": "2" },
      { "--a": "1", "--b": "3", "--c": "4" },
    );
    expect(changed.sort()).toEqual(["--b", "--c"]);
  });

  it("throws a typed validation error when assertions fail", () => {
    expect(() =>
      assertValidThemeTokens(
        {
          "invalid": "value",
        } as unknown as Record<string, string>,
        { context: "test tokens", contrastRequirements: [] },
      ),
    ).toThrow(ThemeTokenValidationError);
  });
});
