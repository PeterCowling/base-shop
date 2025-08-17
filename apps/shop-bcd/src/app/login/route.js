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
// apps/shop-bcd/src/app/login/route.ts
require("@acme/zod-utils/initZod");
var server_1 = require("next/server");
var _auth_1 = require("@auth");
var zod_1 = require("zod");
var _shared_utils_1 = require("@shared-utils");
// Mock customer store. In a real application this would be a database or external identity provider.
var CUSTOMER_STORE = {
    cust1: { password: "pass1", role: "customer" },
    viewer1: { password: "view", role: "viewer" },
    admin1: { password: "admin", role: "admin" },
};
var ALLOWED_ROLES = ["customer", "viewer"];
exports.LoginSchema = zod_1.z
    .object({
    customerId: zod_1.z.string(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
})
    .strict();
function validateCredentials(customerId, password) {
    return __awaiter(this, void 0, void 0, function () {
        var record;
        return __generator(this, function (_a) {
            record = CUSTOMER_STORE[customerId];
            if (!record || record.password !== password) {
                return [2 /*return*/, null];
            }
            return [2 /*return*/, { customerId: customerId, role: record.role }];
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, csrfToken, _a, valid;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, _shared_utils_1.parseJsonBody)(req, exports.LoginSchema, "1mb")];
                case 1:
                    parsed = _b.sent();
                    if (parsed.success === false) {
                        return [2 /*return*/, parsed.response];
                    }
                    csrfToken = req.headers.get("x-csrf-token");
                    _a = !csrfToken;
                    if (_a) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, _auth_1.validateCsrfToken)(csrfToken)];
                case 2:
                    _a = !(_b.sent());
                    _b.label = 3;
                case 3:
                    if (_a) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })];
                    }
                    return [4 /*yield*/, validateCredentials(parsed.data.customerId, parsed.data.password)];
                case 4:
                    valid = _b.sent();
                    if (!valid) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid credentials" }, { status: 401 })];
                    }
                    if (!ALLOWED_ROLES.includes(valid.role)) {
                        // Reject elevated roles
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized role" }, { status: 403 })];
                    }
                    return [4 /*yield*/, (0, _auth_1.createCustomerSession)(valid)];
                case 5:
                    _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true })];
            }
        });
    });
}
