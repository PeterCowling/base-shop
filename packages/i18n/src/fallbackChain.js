"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackChain = fallbackChain;
/**
 * Return the fallback chain for a given locale.
 * - de → ["de", "en"]
 * - it → ["it", "en"]
 * - en → ["en"]
 */
function fallbackChain(locale) {
    switch (locale) {
        case "de":
            return ["de", "en"];
        case "it":
            return ["it", "en"];
        case "en":
        default:
            return ["en"];
    }
}
