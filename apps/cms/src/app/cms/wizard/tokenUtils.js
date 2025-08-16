"use strict";
// apps/cms/src/app/cms/wizard/tokenUtils.ts
/* eslint-disable import/consistent-type-specifier-style */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadThemeTokens = exports.baseTokens = void 0;
var themeTokens_1 = require("@platform-core/themeTokens");
Object.defineProperty(exports, "baseTokens", { enumerable: true, get: function () { return themeTokens_1.baseTokens; } });
Object.defineProperty(exports, "loadThemeTokens", { enumerable: true, get: function () { return themeTokens_1.loadThemeTokensBrowser; } });
