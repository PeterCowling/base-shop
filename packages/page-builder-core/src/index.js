"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreBlockDescriptors = exports.exportComponentsFromHistory = exports.exportComponents = exports.scaffoldPageFromTemplate = exports.cloneTemplateComponents = exports.parsePageDiffHistory = exports.mergeDefined = exports.diffPage = exports.redo = exports.undo = exports.commit = exports.pageComponentSchema = exports.historyStateSchema = exports.pageSchema = exports.version = void 0;
// Public surface for page‑builder core logic.
// New shared schemas, history helpers, and registry APIs should be exported
// from this file (and optionally src/public/**) so apps never import from
// deep src/** paths.
exports.version = "0.0.0-dev";
// Page and history types/schemas re-exported from @acme/types.
var types_1 = require("@acme/types");
Object.defineProperty(exports, "pageSchema", { enumerable: true, get: function () { return types_1.pageSchema; } });
Object.defineProperty(exports, "historyStateSchema", { enumerable: true, get: function () { return types_1.historyStateSchema; } });
// Re-exporting the component schema keeps callers independent of
// the underlying @acme/types layout.
Object.defineProperty(exports, "pageComponentSchema", { enumerable: true, get: function () { return types_1.pageComponentSchema; } });
// Shared history reducers and helpers.
var history_1 = require("./history");
Object.defineProperty(exports, "commit", { enumerable: true, get: function () { return history_1.commit; } });
Object.defineProperty(exports, "undo", { enumerable: true, get: function () { return history_1.undo; } });
Object.defineProperty(exports, "redo", { enumerable: true, get: function () { return history_1.redo; } });
var pageHistory_1 = require("./pageHistory");
Object.defineProperty(exports, "diffPage", { enumerable: true, get: function () { return pageHistory_1.diffPage; } });
Object.defineProperty(exports, "mergeDefined", { enumerable: true, get: function () { return pageHistory_1.mergeDefined; } });
Object.defineProperty(exports, "parsePageDiffHistory", { enumerable: true, get: function () { return pageHistory_1.parsePageDiffHistory; } });
var templates_1 = require("./templates");
Object.defineProperty(exports, "cloneTemplateComponents", { enumerable: true, get: function () { return templates_1.cloneTemplateComponents; } });
Object.defineProperty(exports, "scaffoldPageFromTemplate", { enumerable: true, get: function () { return templates_1.scaffoldPageFromTemplate; } });
var exportComponents_1 = require("./runtime/exportComponents");
Object.defineProperty(exports, "exportComponents", { enumerable: true, get: function () { return exportComponents_1.exportComponents; } });
Object.defineProperty(exports, "exportComponentsFromHistory", { enumerable: true, get: function () { return exportComponents_1.exportComponentsFromHistory; } });
// Shared block registry contracts used by CMS and runtime apps.
__exportStar(require("./blocks/registry"), exports);
var core_blocks_1 = require("./blocks/core-blocks");
Object.defineProperty(exports, "coreBlockDescriptors", { enumerable: true, get: function () { return core_blocks_1.coreBlockDescriptors; } });
