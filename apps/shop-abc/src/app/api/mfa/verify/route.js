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
exports.POST = POST;
// apps/shop-abc/src/app/api/mfa/verify/route.ts
require("@acme/zod-utils/initZod");
var server_1 = require("next/server");
var zod_1 = require("zod");
var _auth_1 = require("@auth");
var users_1 = require("@platform-core/users");
var middleware_1 = require("../../../../middleware");
var _shared_utils_1 = require("@shared-utils");
var schema = zod_1.z
    .object({ token: zod_1.z.string(), customerId: zod_1.z.string().optional() })
    .strict();
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var headerToken, valid, parsed, _a, token, customerId, session, id, ip, rateLimited, ok, user;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    headerToken = req.headers.get("x-csrf-token");
                    return [4 /*yield*/, (0, _auth_1.validateCsrfToken)(headerToken)];
                case 1:
                    valid = _d.sent();
                    if (!valid)
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })];
                    return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, schema, "1mb")];
                case 2:
                    parsed = _d.sent();
                    if (!parsed.success)
                        return [2 /*return*/, parsed.response];
                    _a = parsed.data, token = _a.token, customerId = _a.customerId;
                    if (!token)
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Token required" }, { status: 400 })];
                    return [4 /*yield*/, (0, _auth_1.getCustomerSession)()];
                case 3:
                    session = _d.sent();
                    id = (_b = session === null || session === void 0 ? void 0 : session.customerId) !== null && _b !== void 0 ? _b : customerId;
                    if (!id)
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                    ip = (_c = req.headers.get("x-forwarded-for")) !== null && _c !== void 0 ? _c : "unknown";
                    return [4 /*yield*/, (0, middleware_1.checkMfaRateLimit)(ip, id)];
                case 4:
                    rateLimited = _d.sent();
                    if (rateLimited)
                        return [2 /*return*/, rateLimited];
                    return [4 /*yield*/, (0, _auth_1.verifyMfa)(id, token)];
                case 5:
                    ok = _d.sent();
                    if (!ok) return [3 /*break*/, 10];
                    return [4 /*yield*/, (0, middleware_1.clearMfaAttempts)(ip, id)];
                case 6:
                    _d.sent();
                    if (!!session) return [3 /*break*/, 10];
                    return [4 /*yield*/, (0, users_1.getUserById)(id)];
                case 7:
                    user = _d.sent();
                    if (!user)
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                    return [4 /*yield*/, (0, _auth_1.createCustomerSession)({ customerId: id, role: user.role })];
                case 8:
                    _d.sent();
                    return [4 /*yield*/, (0, middleware_1.clearLoginAttempts)(ip, id)];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10: return [2 /*return*/, server_1.NextResponse.json({ verified: ok })];
            }
        });
    });
}
