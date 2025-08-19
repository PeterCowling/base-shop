"use strict";
// packages/template-app/src/routes/preview/[pageId].ts
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
exports.onRequest = void 0;
var index_server_1 = require("@platform-core/repositories/pages/index.server");
var node_crypto_1 = require("node:crypto");
var core_1 = require("@acme/config/env/core");
var secret = core_1.coreEnv.PREVIEW_TOKEN_SECRET;
var upgradeSecret = core_1.coreEnv.UPGRADE_PREVIEW_TOKEN_SECRET;
function verify(id, token, key) {
    if (!key || !token)
        return false;
    var digest = (0, node_crypto_1.createHmac)("sha256", key).update(id).digest("hex");
    try {
        return (0, node_crypto_1.timingSafeEqual)(Buffer.from(digest), Buffer.from(token));
    }
    catch (_a) {
        return false;
    }
}
var onRequest = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var pageId, search, upgradeToken, token, shop, pages, page;
    var params = _b.params, request = _b.request;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                pageId = String(params.pageId);
                search = new URL(request.url).searchParams;
                upgradeToken = search.get("upgrade");
                token = search.get("token");
                if (upgradeToken) {
                    if (!verify(pageId, upgradeToken, upgradeSecret)) {
                        return [2 /*return*/, new Response("Unauthorized", { status: 401 })];
                    }
                }
                else if (!verify(pageId, token, secret)) {
                    return [2 /*return*/, new Response("Unauthorized", { status: 401 })];
                }
                shop = core_1.coreEnv.NEXT_PUBLIC_SHOP_ID || "default";
                return [4 /*yield*/, (0, index_server_1.getPages)(shop)];
            case 1:
                pages = _c.sent();
                page = pages.find(function (p) { return p.id === pageId; });
                if (!page)
                    return [2 /*return*/, new Response("Not Found", { status: 404 })];
                return [2 /*return*/, Response.json(page)];
        }
    });
}); };
exports.onRequest = onRequest;
