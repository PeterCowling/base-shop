"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = void 0;
exports.POST = POST;
// apps/shop-abc/src/app/login/route.ts
require("@acme/zod-utils/initZod");
var server_1 = require("next/server");
var _auth_1 = require("@auth");
var mfa_1 = require("@auth/mfa");
var zod_1 = require("zod");
var argon2_1 = require("argon2");
var _shared_utils_1 = require("@shared-utils");
var middleware_1 = require("../../middleware");
var users_1 = require("@platform-core/users");
var ALLOWED_ROLES = ["customer", "viewer"];
exports.LoginSchema = zod_1.z
    .object({
    customerId: zod_1.z.string(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
})
    .strict();
function validateCredentials(customerId, password) {
    return __awaiter(this, void 0, void 0, function () {
        var record, match;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, users_1.getUserById)(customerId)];
                case 1:
                    record = _a.sent();
                    if (!record)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, argon2_1.default.verify(record.passwordHash, password)];
                case 2:
                    match = _a.sent();
                    if (!match)
                        return [2 /*return*/, null];
                    return [2 /*return*/, {
                            customerId: customerId,
                            role: record.role,
                            emailVerified: record.emailVerified,
                        }];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, csrfToken, _a, ip, rateLimited, valid, mfa;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, exports.LoginSchema, "1mb")];
                case 1:
                    parsed = _c.sent();
                    if (parsed.success === false) {
                        return [2 /*return*/, parsed.response];
                    }
                    csrfToken = req.headers.get("x-csrf-token");
                    _a = !csrfToken;
                    if (_a) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, _auth_1.validateCsrfToken)(csrfToken)];
                case 2:
                    _a = !(_c.sent());
                    _c.label = 3;
                case 3:
                    if (_a) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })];
                    }
                    ip = (_b = req.headers.get("x-forwarded-for")) !== null && _b !== void 0 ? _b : "unknown";
                    return [4 /*yield*/, (0, middleware_1.checkLoginRateLimit)(ip, parsed.data.customerId)];
                case 4:
                    rateLimited = _c.sent();
                    if (rateLimited)
                        return [2 /*return*/, rateLimited];
                    return [4 /*yield*/, validateCredentials(parsed.data.customerId, parsed.data.password)];
                case 5:
                    valid = _c.sent();
                    if (!valid) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid credentials" }, { status: 401 })];
                    }
                    if (!valid.emailVerified) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Email not verified" }, { status: 403 })];
                    }
                    if (!ALLOWED_ROLES.includes(valid.role)) {
                        // Ignore elevated roles by rejecting them
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized role" }, { status: 403 })];
                    }
                    return [4 /*yield*/, (0, mfa_1.isMfaEnabled)(valid.customerId)];
                case 6:
                    mfa = _c.sent();
                    if (mfa) {
                        return [2 /*return*/, server_1.NextResponse.json({ mfaRequired: true })];
                    }
                    return [4 /*yield*/, (0, _auth_1.createCustomerSession)(valid)];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, (0, middleware_1.clearLoginAttempts)(ip, parsed.data.customerId)];
                case 8:
                    _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
            }
        });
    });
}
