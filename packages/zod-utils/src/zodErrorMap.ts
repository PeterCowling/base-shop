// packages/zod-utils/src/zodErrorMap.ts
import { z, type ZodErrorMap, ZodIssueCode } from "zod";

export const friendlyErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return { message: "Required" }; // i18n-exempt: short validation label; UI layer translates/overrides
      }
      return { message: `Expected ${issue.expected}` }; // i18n-exempt: generic fallback for dev; translated at display time

    case ZodIssueCode.invalid_enum_value:
      return { message: "Invalid value" }; // i18n-exempt: generic fallback validation text; consumer handles i18n

    case ZodIssueCode.too_small:
      if (issue.type === "string") {
        return { message: `Must be at least ${issue.minimum} characters` }; // i18n-exempt: fallback; translate upstream if shown to users
      }
      if (issue.type === "array") {
        return { message: `Must have at least ${issue.minimum} items` }; // i18n-exempt: fallback; translate upstream if shown to users
      }
      return { message: ctx.defaultError };

    case ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: `Must be at most ${issue.maximum} characters` }; // i18n-exempt: fallback; translate upstream if shown to users
      }
      if (issue.type === "array") {
        return { message: `Must have at most ${issue.maximum} items` }; // i18n-exempt: fallback; translate upstream if shown to users
      }
      return { message: ctx.defaultError };

    default:
      return { message: issue.message ?? ctx.defaultError };
  }
};

export function applyFriendlyZodMessages(): void {
  z.setErrorMap(friendlyErrorMap);
}
