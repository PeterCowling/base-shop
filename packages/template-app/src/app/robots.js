"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = robots;
var core_1 = require("@acme/config/env/core");
function robots() {
    var base = core_1.coreEnv.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return {
        rules: [
            { userAgent: "*", allow: "/" },
            { userAgent: "GPTBot", allow: "/" },
            { userAgent: "ClaudeBot", allow: "/" },
        ],
        sitemap: "".concat(base, "/sitemap.xml"),
        additionalSitemaps: ["".concat(base, "/ai-sitemap.xml")],
    };
}
