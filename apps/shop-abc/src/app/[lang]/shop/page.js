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
exports.metadata = void 0;
exports.default = ShopIndexPage;
// apps/shop-abc/src/app/[lang]/shop/page.tsx
var products_1 = require("@/lib/products");
var DynamicRenderer_1 = require("@ui/components/DynamicRenderer");
var BlogListing_1 = require("@ui/components/cms/blocks/BlogListing");
var sanity_1 = require("@acme/sanity");
var index_server_1 = require("@platform-core/repositories/pages/index.server");
var config_1 = require("@acme/config");
var shop_json_1 = require("../../../../shop.json");
var ShopClient_client_1 = require("./ShopClient.client");
var analytics_1 = require("@platform-core/analytics");
function loadComponents() {
    return __awaiter(this, void 0, void 0, function () {
        var pages, page;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, index_server_1.getPages)(shop_json_1.default.id)];
                case 1:
                    pages = _b.sent();
                    page = pages.find(function (p) { return p.slug === "shop" && p.status === "published"; });
                    return [2 /*return*/, (_a = page === null || page === void 0 ? void 0 : page.components) !== null && _a !== void 0 ? _a : null];
            }
        });
    });
}
exports.metadata = {
    title: "Shop · Base-Shop",
};
function ShopIndexPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var components, latestPost, luxury, posts, first, _c, content;
        var _d, _e;
        var params = _b.params;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, loadComponents()];
                case 1:
                    components = _f.sent();
                    return [4 /*yield*/, (0, analytics_1.trackPageView)(shop_json_1.default.id, "shop")];
                case 2:
                    _f.sent();
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 6, , 7]);
                    luxury = JSON.parse((_d = config_1.env.NEXT_PUBLIC_LUXURY_FEATURES) !== null && _d !== void 0 ? _d : "{}");
                    if (!(luxury.contentMerchandising && luxury.blog)) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, sanity_1.fetchPublishedPosts)(shop_json_1.default.id)];
                case 4:
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
                    _f.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _c = _f.sent();
                    return [3 /*break*/, 7];
                case 7:
                    content = components && components.length ? (<DynamicRenderer_1.default components={components} locale={params.lang}/>) : (<ShopClient_client_1.default skus={products_1.PRODUCTS}/>);
                    return [2 /*return*/, (<>
      {latestPost && <BlogListing_1.default posts={[latestPost]}/>}
      {content}
    </>)];
            }
        });
    });
}
