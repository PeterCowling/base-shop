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
var persistence_1 = require("../persistence");
jest.mock("@platform-core/src/repositories/shop.server", function () { return ({
    getShopById: jest.fn().mockResolvedValue({ id: "1" }),
    updateShopInRepo: jest.fn().mockResolvedValue({ id: "1" }),
}); });
jest.mock("@platform-core/src/repositories/settings.server", function () { return ({
    getShopSettings: jest.fn().mockResolvedValue({ foo: "bar" }),
    saveShopSettings: jest.fn().mockResolvedValue(undefined),
    diffHistory: jest.fn().mockResolvedValue([]),
}); });
describe("persistence service", function () {
    it("fetches a shop", function () { return __awaiter(void 0, void 0, void 0, function () {
        var shop;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, persistence_1.fetchShop)("s1")];
                case 1:
                    shop = _a.sent();
                    expect(shop).toEqual({ id: "1" });
                    return [2 /*return*/];
            }
        });
    }); });
    it("persists a shop", function () { return __awaiter(void 0, void 0, void 0, function () {
        var saved;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, persistence_1.persistShop)("s1", { id: "1" })];
                case 1:
                    saved = _a.sent();
                    expect(saved).toEqual({ id: "1" });
                    return [2 /*return*/];
            }
        });
    }); });
    it("fetches settings", function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, persistence_1.fetchSettings)("s1")];
                case 1:
                    settings = _a.sent();
                    expect(settings).toEqual({ foo: "bar" });
                    return [2 /*return*/];
            }
        });
    }); });
    it("persists settings", function () { return __awaiter(void 0, void 0, void 0, function () {
        var saveShopSettings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, persistence_1.persistSettings)("s1", { foo: "bar" })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("@platform-core/src/repositories/settings.server"); })];
                case 2:
                    saveShopSettings = (_a.sent()).saveShopSettings;
                    expect(saveShopSettings).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it("fetches diff history", function () { return __awaiter(void 0, void 0, void 0, function () {
        var history;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, persistence_1.fetchDiffHistory)("s1")];
                case 1:
                    history = _a.sent();
                    expect(history).toEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
});
