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
exports.default = Page;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var shop_json_1 = require("../../../shop.json");
var page_client_1 = require("./page.client");
var sanity_1 = require("@acme/sanity");
var locales_1 = require("@/i18n/locales");
function loadComponents() {
    return __awaiter(this, void 0, void 0, function () {
        var file, json, data, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    file = node_path_1.default.join(process.cwd(), "..", "..", "data", "shops", shop_json_1.default.id, "pages", "home.json");
                    return [4 /*yield*/, node_fs_1.promises.readFile(file, "utf8")];
                case 1:
                    json = _c.sent();
                    data = JSON.parse(json);
                    return [2 /*return*/, Array.isArray(data) ? data : ((_b = data.components) !== null && _b !== void 0 ? _b : [])];
                case 2:
                    _a = _c.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function Page(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var components, latestPost, posts, first, lang;
        var _c, _d, _e;
        var params = _b.params;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, loadComponents()];
                case 1:
                    components = _f.sent();
                    if (!(((_c = shop_json_1.default.luxuryFeatures) === null || _c === void 0 ? void 0 : _c.contentMerchandising) &&
                        ((_d = shop_json_1.default.luxuryFeatures) === null || _d === void 0 ? void 0 : _d.blog))) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, sanity_1.fetchPublishedPosts)(shop_json_1.default.id)];
                case 2:
                    posts = _f.sent();
                    first = posts[0];
                    if (first) {
                        latestPost = {
                            title: first.title,
                            excerpt: first.excerpt,
                            url: "/".concat(params.lang, "/blog/").concat(first.slug),
                            shopUrl: ((_e = first.products) === null || _e === void 0 ? void 0 : _e[0])
                                ? "/".concat(params.lang, "/product/").concat(first.products[0])
                                : undefined,
                        };
                    }
                    _f.label = 3;
                case 3:
                    lang = (0, locales_1.resolveLocale)(params.lang);
                    return [2 /*return*/, <page_client_1.default components={components} locale={lang} latestPost={latestPost}/>];
            }
        });
    });
}
