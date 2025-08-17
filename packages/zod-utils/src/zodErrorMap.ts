import { z, ZodErrorMap, ZodIssueCode } from "zod";

export const friendlyErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return { message: "Required" };
      }
      return { message: `Expected ${issue.expected}` };
    case ZodIssueCode.invalid_enum_value:
      return { message: `Invalid value` };
    case ZodIssueCode.too_small:
      if (issue.type === "string") {
        return { message: `Must be at least ${issue.minimum} characters` };
      }
      if (issue.type === "array") {
        return { message: `Must have at least ${issue.minimum} items` };
      }
      return { message: ctx.defaultError };
    case ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: `Must be at most ${issue.maximum} characters` };
      }
      if (issue.type === "array") {
        return { message: `Must have at most ${issue.maximum} items` };
      }
      return { message: ctx.defaultError };
    default:
      return { message: issue.message ?? ctx.defaultError };
  }
};

export function applyFriendlyZodMessages(): void {
  z.setErrorMap(friendlyErrorMap);
}
