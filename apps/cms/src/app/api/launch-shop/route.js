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
var steps_1 = require("../../cms/configurator/steps");
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var body, shopId, state, seed, missingSteps, host, protocol, base, encoder, stream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    body = (_a.sent());
                    shopId = body.shopId, state = body.state, seed = body.seed;
                    missingSteps = (0, steps_1.getRequiredSteps)()
                        .filter(function (s) { var _a; return ((_a = state.completed) === null || _a === void 0 ? void 0 : _a[s.id]) !== "complete"; })
                        .map(function (s) { return s.id; });
                    if (missingSteps.length > 0) {
                        return [2 /*return*/, Response.json({ error: "Missing required steps", missingSteps: missingSteps }, { status: 400 })];
                    }
                    host = req.headers.get("host");
                    protocol = req.headers.get("x-forwarded-proto") || "http";
                    base = "".concat(protocol, "://").concat(host);
                    encoder = new TextEncoder();
                    stream = new ReadableStream({
                        start: function (controller) {
                            return __awaiter(this, void 0, void 0, function () {
                                var originalFetch, send, update, createShop_1, okCreate, initShop_1, okInit, deployShop_1, okDeploy, seedShop_1, okSeed, err_1;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            originalFetch = globalThis.fetch;
                                            globalThis.fetch = (function (input, init) {
                                                if (typeof input === "string" && input.startsWith("/")) {
                                                    input = base + input;
                                                }
                                                else if (input instanceof URL && input.pathname.startsWith("/")) {
                                                    input = new URL(input, base).toString();
                                                }
                                                return originalFetch(input, init);
                                            });
                                            send = function (msg) {
                                                controller.enqueue(encoder.encode("data: ".concat(JSON.stringify(msg), "\n\n")));
                                            };
                                            update = function (step, fn) { return __awaiter(_this, void 0, void 0, function () {
                                                var res;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            send({ step: step, status: "pending" });
                                                            return [4 /*yield*/, fn()];
                                                        case 1:
                                                            res = _a.sent();
                                                            send({ step: step, status: res.ok ? "success" : "failure", error: res.error });
                                                            return [2 /*return*/, res.ok];
                                                    }
                                                });
                                            }); };
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 11, 12, 13]);
                                            return [4 /*yield*/, Promise.resolve().then(function () { return require("../../cms/wizard/services/createShop"); })];
                                        case 2:
                                            createShop_1 = (_a.sent()).createShop;
                                            return [4 /*yield*/, update("create", function () { return createShop_1(shopId, state); })];
                                        case 3:
                                            okCreate = _a.sent();
                                            if (!okCreate)
                                                return [2 /*return*/];
                                            return [4 /*yield*/, Promise.resolve().then(function () { return require("../../cms/wizard/services/initShop"); })];
                                        case 4:
                                            initShop_1 = (_a.sent()).initShop;
                                            return [4 /*yield*/, update("init", function () {
                                                    return initShop_1(shopId, undefined, state.categoriesText);
                                                })];
                                        case 5:
                                            okInit = _a.sent();
                                            if (!okInit)
                                                return [2 /*return*/];
                                            return [4 /*yield*/, Promise.resolve().then(function () { return require("../../cms/wizard/services/deployShop"); })];
                                        case 6:
                                            deployShop_1 = (_a.sent()).deployShop;
                                            return [4 /*yield*/, update("deploy", function () { var _a; return deployShop_1(shopId, (_a = state.domain) !== null && _a !== void 0 ? _a : ""); })];
                                        case 7:
                                            okDeploy = _a.sent();
                                            if (!okDeploy)
                                                return [2 /*return*/];
                                            if (!seed) return [3 /*break*/, 10];
                                            return [4 /*yield*/, Promise.resolve().then(function () { return require("../../cms/wizard/services/seedShop"); })];
                                        case 8:
                                            seedShop_1 = (_a.sent()).seedShop;
                                            return [4 /*yield*/, update("seed", function () {
                                                    return seedShop_1(shopId, undefined, state.categoriesText);
                                                })];
                                        case 9:
                                            okSeed = _a.sent();
                                            if (!okSeed)
                                                return [2 /*return*/];
                                            _a.label = 10;
                                        case 10:
                                            send({ done: true });
                                            return [3 /*break*/, 13];
                                        case 11:
                                            err_1 = _a.sent();
                                            send({ step: undefined, status: "failure", error: err_1.message });
                                            return [3 /*break*/, 13];
                                        case 12:
                                            globalThis.fetch = originalFetch;
                                            controller.close();
                                            return [7 /*endfinally*/];
                                        case 13: return [2 /*return*/];
                                    }
                                });
                            });
                        },
                    });
                    return [2 /*return*/, new Response(stream, {
                            headers: {
                                "Content-Type": "text/event-stream",
                                "Cache-Control": "no-cache",
                                Connection: "keep-alive",
                            },
                        })];
            }
        });
    });
}
