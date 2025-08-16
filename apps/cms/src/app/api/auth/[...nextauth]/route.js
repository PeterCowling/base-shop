"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
// apps/cms/src/app/api/auth/[...nextauth]/route.ts
var options_1 = require("@cms/auth/options");
var next_auth_1 = require("next-auth");
var handler = (0, next_auth_1.default)(options_1.authOptions);
exports.GET = handler;
exports.POST = handler;
