"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREVIEW_TOKENS_EVENT = exports.PREVIEW_TOKENS_KEY = void 0;
exports.savePreviewTokens = savePreviewTokens;
exports.loadPreviewTokens = loadPreviewTokens;
exports.PREVIEW_TOKENS_KEY = "cms-preview-tokens";
exports.PREVIEW_TOKENS_EVENT = "previewTokens:update";
function savePreviewTokens(tokens) {
    try {
        localStorage.setItem(exports.PREVIEW_TOKENS_KEY, JSON.stringify(tokens));
        window.dispatchEvent(new Event(exports.PREVIEW_TOKENS_EVENT));
    }
    catch (_a) {
        /* ignore */
    }
}
function loadPreviewTokens() {
    try {
        var json = localStorage.getItem(exports.PREVIEW_TOKENS_KEY);
        return json ? JSON.parse(json) : {};
    }
    catch (_a) {
        return {};
    }
}
