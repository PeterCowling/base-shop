"use strict";
// packages/zod-utils/src/initZod.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.initZod = initZod;
/* istanbul ignore file */
const zod_1 = require("zod");
const zodErrorMap_js_1 = require("./zodErrorMap.js");
// Avoid double‑installation during hot module reloading
let __installed = false;
function initZod() {
    if (__installed)
        return;
    // Allow disabling the custom error map in dev to isolate issues
    const off = process.env.ZOD_ERROR_MAP_OFF === "1";
    if (!off) {
        zod_1.z.setErrorMap((issue, ctx) => {
            try {
                return (0, zodErrorMap_js_1.friendlyErrorMap)(issue, ctx);
            }
            catch (e) {
                console.error("[zod-utils] errorMap threw; falling back", e); // i18n-exempt: developer-only log, not user-facing UI copy
                return { message: ctx.defaultError };
            }
        });
    }
    __installed = true;
}
// Initialize immediately when this module is imported.
initZod();
