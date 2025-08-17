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
exports.runtime = void 0;
exports.GET = GET;
exports.PUT = PUT;
// apps/shop-abc/src/app/api/account/profile/route.ts
require("@acme/zod-utils/initZod");
var _auth_1 = require("@auth");
var customerProfiles_1 = require("@platform-core/customerProfiles");
var server_1 = require("next/server");
var zod_1 = require("zod");
var _shared_utils_1 = require("@shared-utils");
exports.runtime = "edge";
var schema = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
})
    .strict();
function GET() {
    return __awaiter(this, void 0, void 0, function () {
        var session, _a, profile;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, _auth_1.requirePermission)("view_profile")];
                case 1:
                    session = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                case 3: return [4 /*yield*/, (0, customerProfiles_1.getCustomerProfile)(session.customerId)];
                case 4:
                    profile = _b.sent();
                    if (!profile) {
                        return [2 /*return*/, server_1.NextResponse.json({
                                ok: true,
                                profile: { customerId: session.customerId, name: "", email: "" },
                            })];
                    }
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true, profile: profile })];
            }
        });
    });
}
function PUT(req) {
    return __awaiter(this, void 0, void 0, function () {
        var session, _a, token, _b, parsed, err_1, profile;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, _auth_1.requirePermission)("manage_profile")];
                case 1:
                    session = _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                case 3:
                    token = req.headers.get("x-csrf-token");
                    _b = !token;
                    if (_b) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, _auth_1.validateCsrfToken)(token)];
                case 4:
                    _b = !(_c.sent());
                    _c.label = 5;
                case 5:
                    if (_b) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })];
                    }
                    return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, schema, "1mb")];
                case 6:
                    parsed = _c.sent();
                    if (!parsed.success)
                        return [2 /*return*/, parsed.response];
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, (0, customerProfiles_1.updateCustomerProfile)(session.customerId, parsed.data)];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 10];
                case 9:
                    err_1 = _c.sent();
                    if (err_1 instanceof Error && err_1.message.startsWith("Conflict:")) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: err_1.message.replace("Conflict: ", "") }, { status: 409 })];
                    }
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Update failed" }, { status: 400 })];
                case 10: return [4 /*yield*/, (0, customerProfiles_1.getCustomerProfile)(session.customerId)];
                case 11:
                    profile = _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true, profile: profile })];
            }
        });
    });
}
