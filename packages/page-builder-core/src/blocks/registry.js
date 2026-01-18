"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBlockRegistry = buildBlockRegistry;
/**
 * Build descriptor and registry maps from shared descriptors and per‑app
 * registry entries.
 *
 * This keeps the block‑type vocabulary (descriptors) in one place while
 * allowing each app to provide its own rendering implementation.
 */
function buildBlockRegistry(descriptors, entries) {
    const descriptorMap = {};
    for (const descriptor of descriptors) {
        descriptorMap[descriptor.type] = descriptor;
    }
    const registry = {};
    for (const { type, entry } of entries) {
        registry[type] = entry;
    }
    return { descriptors: descriptorMap, registry };
}
