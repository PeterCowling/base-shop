"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSectionsOnlyFromEnv = resolveSectionsOnlyFromEnv;
exports.rootPlacementOptions = rootPlacementOptions;
exports.withDefaults = withDefaults;
function resolveSectionsOnlyFromEnv() {
    return process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY === "true";
}
function rootPlacementOptions(overrides) {
    return {
        parent: "ROOT",
        sectionsOnly: overrides?.sectionsOnly ?? resolveSectionsOnlyFromEnv(),
    };
}
function withDefaults(options) {
    const sectionsOnly = typeof options.sectionsOnly === "boolean" ? options.sectionsOnly : resolveSectionsOnlyFromEnv();
    return { ...options, sectionsOnly };
}
