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
var options_1 = require("@cms/auth/options");
var next_auth_1 = require("next-auth");
var server_1 = require("next/server");
var types_1 = require("@acme/types");
var inventory_server_1 = require("@platform-core/repositories/inventory.server");
var inventory_1 = require("@platform-core/utils/inventory");
var fast_csv_1 = require("fast-csv");
var node_stream_1 = require("node:stream");
function POST(req, context) {
    return __awaiter(this, void 0, void 0, function () {
        var session, form, file, text_1, raw, data, parsed, shop, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _a.sent();
                    if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Forbidden" }, { status: 403 })];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 10, , 11]);
                    return [4 /*yield*/, req.formData()];
                case 3:
                    form = _a.sent();
                    file = form.get("file");
                    if (!file || typeof file.text !== "function") {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "No file provided" }, { status: 400 })];
                    }
                    return [4 /*yield*/, file.text()];
                case 4:
                    text_1 = _a.sent();
                    raw = void 0;
                    if (!(file.type === "application/json" || file.name.endsWith(".json"))) return [3 /*break*/, 5];
                    data = JSON.parse(text_1);
                    raw = Array.isArray(data)
                        ? data.map(function (row) { return (0, inventory_1.expandInventoryItem)(row); })
                        : (0, inventory_1.expandInventoryItem)(data);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var rows = [];
                        node_stream_1.Readable.from(text_1)
                            .pipe((0, fast_csv_1.parse)({ headers: true, ignoreEmpty: true }))
                            .on("error", reject)
                            .on("data", function (row) {
                            rows.push((0, inventory_1.expandInventoryItem)(row));
                        })
                            .on("end", function () { return resolve(rows); });
                    })];
                case 6:
                    raw = _a.sent();
                    _a.label = 7;
                case 7:
                    parsed = types_1.inventoryItemSchema.array().safeParse(raw);
                    if (!parsed.success) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: parsed.error.issues.map(function (i) { return i.message; }).join(", ") }, { status: 400 })];
                    }
                    return [4 /*yield*/, context.params];
                case 8:
                    shop = (_a.sent()).shop;
                    return [4 /*yield*/, inventory_server_1.inventoryRepository.write(shop, parsed.data)];
                case 9:
                    _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, items: parsed.data })];
                case 10:
                    err_1 = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: err_1.message }, { status: 400 })];
                case 11: return [2 /*return*/];
            }
        });
    });
}
