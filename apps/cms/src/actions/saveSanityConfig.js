// apps/cms/src/actions/saveSanityConfig.ts
"use server";
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
exports.saveSanityConfig = saveSanityConfig;
var plugin_sanity_1 = require("@acme/plugin-sanity");
var shop_server_1 = require("@platform-core/src/repositories/shop.server");
var shops_1 = require("@platform-core/src/shops");
var auth_1 = require("./common/auth");
var setupSanityBlog_1 = require("./setupSanityBlog");
function saveSanityConfig(shopId, formData) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, projectId, dataset, token, aclMode, createDataset, enableEditorialRaw, promoteScheduleRaw, editorialEnabled, promoteSchedule, config, setup, valid, updated, err_1;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _h.sent();
                    return [4 /*yield*/, (0, shop_server_1.getShopById)(shopId)];
                case 2:
                    shop = _h.sent();
                    projectId = String((_a = formData.get("projectId")) !== null && _a !== void 0 ? _a : "");
                    dataset = String((_b = formData.get("dataset")) !== null && _b !== void 0 ? _b : "");
                    token = String((_c = formData.get("token")) !== null && _c !== void 0 ? _c : "");
                    aclMode = String((_d = formData.get("aclMode")) !== null && _d !== void 0 ? _d : "public");
                    createDataset = String((_e = formData.get("createDataset")) !== null && _e !== void 0 ? _e : "false") === "true";
                    enableEditorialRaw = formData.get("enableEditorial");
                    promoteScheduleRaw = formData.get("promoteSchedule");
                    editorialEnabled = enableEditorialRaw == null
                        ? Boolean((_f = shop.editorialBlog) === null || _f === void 0 ? void 0 : _f.enabled)
                        : enableEditorialRaw === "on" || enableEditorialRaw === "true";
                    promoteSchedule = promoteScheduleRaw == null || String(promoteScheduleRaw) === ""
                        ? undefined
                        : String(promoteScheduleRaw);
                    config = { projectId: projectId, dataset: dataset, token: token };
                    if (!createDataset) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, setupSanityBlog_1.setupSanityBlog)(config, __assign({ enabled: editorialEnabled }, (promoteSchedule ? { promoteSchedule: promoteSchedule } : {})), aclMode)];
                case 3:
                    setup = _h.sent();
                    if (!setup.success) {
                        return [2 /*return*/, {
                                error: (_g = setup.error) !== null && _g !== void 0 ? _g : "Failed to setup Sanity blog",
                                errorCode: setup.code,
                            }];
                    }
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, (0, plugin_sanity_1.verifyCredentials)(config)];
                case 5:
                    valid = _h.sent();
                    if (!valid) {
                        return [2 /*return*/, { error: "Invalid Sanity credentials", errorCode: "INVALID_CREDENTIALS" }];
                    }
                    _h.label = 6;
                case 6:
                    updated = (0, shops_1.setEditorialBlog)((0, shops_1.setSanityConfig)(shop, config), __assign({ enabled: editorialEnabled }, (promoteSchedule ? { promoteSchedule: promoteSchedule } : {})));
                    // maintain legacy flag
                    updated.enableEditorial = editorialEnabled;
                    if (!promoteSchedule) return [3 /*break*/, 10];
                    _h.label = 7;
                case 7:
                    _h.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, fetch("/api/shops/".concat(shopId, "/editorial/promote"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ schedule: promoteSchedule }),
                        })];
                case 8:
                    _h.sent();
                    return [3 /*break*/, 10];
                case 9:
                    err_1 = _h.sent();
                    console.error("[saveSanityConfig] failed to schedule promotion", err_1);
                    return [3 /*break*/, 10];
                case 10: return [4 /*yield*/, (0, shop_server_1.updateShopInRepo)(shopId, updated)];
                case 11:
                    _h.sent();
                    return [2 /*return*/, { message: "Sanity connected" }];
            }
        });
    });
}
