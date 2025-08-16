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
var plugin_sanity_1 = require("@acme/plugin-sanity");
var client_1 = require("@sanity/client");
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, projectId, dataset, token, client, list, datasets, valid, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    _a = (_b.sent()), projectId = _a.projectId, dataset = _a.dataset, token = _a.token;
                    if (!projectId || !token) {
                        return [2 /*return*/, Response.json({ ok: false, error: "Missing projectId or token", errorCode: "INVALID_CREDENTIALS" }, { status: 400 })];
                    }
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    client = (0, client_1.createClient)({
                        projectId: projectId,
                        dataset: dataset || "production",
                        token: token,
                        apiVersion: "2023-01-01",
                        useCdn: false,
                    });
                    return [4 /*yield*/, client.datasets.list()];
                case 3:
                    list = _b.sent();
                    datasets = list.map(function (d) { return d.name; });
                    if (!dataset) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, plugin_sanity_1.verifyCredentials)({ projectId: projectId, dataset: dataset, token: token })];
                case 4:
                    valid = _b.sent();
                    if (!valid) {
                        return [2 /*return*/, Response.json({ ok: false, error: "Invalid Sanity credentials", errorCode: "INVALID_CREDENTIALS", datasets: datasets }, { status: 401 })];
                    }
                    _b.label = 5;
                case 5: return [2 /*return*/, Response.json({ ok: true, datasets: datasets })];
                case 6:
                    err_1 = _b.sent();
                    return [2 /*return*/, Response.json({ ok: false, error: "Failed to list datasets", errorCode: "DATASET_LIST_ERROR" }, { status: 500 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
