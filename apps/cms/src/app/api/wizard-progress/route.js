"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GET = GET;
exports.PUT = PUT;
exports.PATCH = PATCH;
// apps/cms/src/app/api/wizard-progress/route.ts
require("@acme/zod-utils/initZod");
var options_1 = require("@cms/auth/options");
var next_auth_1 = require("next-auth");
var server_1 = require("next/server");
var node_fs_1 = require("node:fs");
var fsSync = require("node:fs");
var node_path_1 = require("node:path");
var schema_1 = require("@cms/app/cms/wizard/schema");
var zod_1 = require("zod");
var putBodySchema = zod_1.z
    .object({
    stepId: zod_1.z.string().nullish(),
    data: schema_1.wizardStateSchema.partial().optional(),
    completed: zod_1.z
        .union([schema_1.stepStatusSchema, zod_1.z.record(schema_1.stepStatusSchema)])
        .optional(),
})
    .strict();
var patchBodySchema = zod_1.z
    .object({
    stepId: zod_1.z.string(),
    completed: schema_1.stepStatusSchema,
})
    .strict();
function resolveFile() {
    var dir = process.cwd();
    while (true) {
        var candidateDir = node_path_1.default.join(dir, "data", "cms");
        if (fsSync.existsSync(candidateDir)) {
            return node_path_1.default.join(candidateDir, "wizard-progress.json");
        }
        var parent_1 = node_path_1.default.dirname(dir);
        if (parent_1 === dir)
            break;
        dir = parent_1;
    }
    return node_path_1.default.resolve(process.cwd(), "data", "cms", "wizard-progress.json");
}
var FILE = resolveFile();
function readDb() {
    return __awaiter(this, void 0, void 0, function () {
        var buf, parsed, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, node_fs_1.promises.readFile(FILE, "utf8")];
                case 1:
                    buf = _b.sent();
                    parsed = JSON.parse(buf);
                    if (parsed && typeof parsed === "object")
                        return [2 /*return*/, parsed];
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, {}];
            }
        });
    });
}
function writeDb(db) {
    return __awaiter(this, void 0, void 0, function () {
        var tmp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fs_1.promises.mkdir(node_path_1.default.dirname(FILE), { recursive: true })];
                case 1:
                    _a.sent();
                    tmp = "".concat(FILE, ".").concat(Date.now(), ".tmp");
                    return [4 /*yield*/, node_fs_1.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf8")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, node_fs_1.promises.rename(tmp, FILE)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function GET() {
    return __awaiter(this, void 0, void 0, function () {
        var session, db, entry;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _b.sent();
                    if (!session || !((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
                        return [2 /*return*/, server_1.NextResponse.json({}, { status: 401 })];
                    }
                    return [4 /*yield*/, readDb()];
                case 2:
                    db = _b.sent();
                    entry = db[session.user.id];
                    if (entry && typeof entry === "object" && "state" in entry) {
                        return [2 /*return*/, server_1.NextResponse.json(entry)];
                    }
                    return [2 /*return*/, server_1.NextResponse.json({ state: entry !== null && entry !== void 0 ? entry : {}, completed: {} })];
            }
        });
    });
}
function PUT(req) {
    return __awaiter(this, void 0, void 0, function () {
        var session, body, parsed, _a, stepId, data, completed, db, record, existing, err_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _c.sent();
                    if (!session || !((_b = session.user) === null || _b === void 0 ? void 0 : _b.id)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, req.json().catch(function () { return ({}); })];
                case 3:
                    body = _c.sent();
                    parsed = putBodySchema.safeParse(body);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid request" }, { status: 400 })];
                    }
                    _a = parsed.data, stepId = _a.stepId, data = _a.data, completed = _a.completed;
                    return [4 /*yield*/, readDb()];
                case 4:
                    db = _c.sent();
                    record = { state: {}, completed: {} };
                    existing = db[session.user.id];
                    if (existing && typeof existing === "object" && "state" in existing) {
                        record = existing;
                    }
                    else if (existing) {
                        record.state = existing;
                    }
                    if (!stepId) {
                        record = { state: {}, completed: {} };
                    }
                    else {
                        record.state = __assign(__assign({}, record.state), (data !== null && data !== void 0 ? data : {}));
                        if (typeof completed === "string") {
                            record.completed[stepId] = completed;
                        }
                    }
                    if (completed && typeof completed === "object" && !stepId) {
                        record.completed = completed;
                    }
                    db[session.user.id] = record;
                    return [4 /*yield*/, writeDb(db)];
                case 5:
                    _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true })];
                case 6:
                    err_1 = _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_1.message }, { status: 400 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function PATCH(req) {
    return __awaiter(this, void 0, void 0, function () {
        var session, body, parsed, _a, stepId, completed, db, record, existing, err_2;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _c.sent();
                    if (!session || !((_b = session.user) === null || _b === void 0 ? void 0 : _b.id)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, req.json().catch(function () { return ({}); })];
                case 3:
                    body = _c.sent();
                    parsed = patchBodySchema.safeParse(body);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Invalid request" }, { status: 400 })];
                    }
                    _a = parsed.data, stepId = _a.stepId, completed = _a.completed;
                    return [4 /*yield*/, readDb()];
                case 4:
                    db = _c.sent();
                    record = { state: {}, completed: {} };
                    existing = db[session.user.id];
                    if (existing && typeof existing === "object" && "state" in existing) {
                        record = existing;
                    }
                    else if (existing) {
                        record.state = existing;
                    }
                    record.completed[stepId] = completed;
                    db[session.user.id] = record;
                    return [4 /*yield*/, writeDb(db)];
                case 5:
                    _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true })];
                case 6:
                    err_2 = _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_2.message }, { status: 400 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
