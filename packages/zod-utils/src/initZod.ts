// packages/zod-utils/src/initZod.ts

/* istanbul ignore file */
import { z } from "zod";
import { friendlyErrorMap } from "./zodErrorMap.js";

// Avoid double‑installation during hot module reloading
let __installed = false;

export function initZod(): void {
  if (__installed) return;

  // Allow disabling the custom error map in dev to isolate issues
  const off = process.env.ZOD_ERROR_MAP_OFF === "1";
  if (!off) {
    z.setErrorMap((issue, ctx) => {
      try {
        return friendlyErrorMap(issue, ctx);
      } catch (e) {
        console.error("[zod-utils] errorMap threw; falling back", e); // i18n-exempt: developer-only log, not user-facing UI copy
        return { message: ctx.defaultError };
      }
    });
  }

  __installed = true;
}

// Initialize immediately when this module is imported.
initZod();
