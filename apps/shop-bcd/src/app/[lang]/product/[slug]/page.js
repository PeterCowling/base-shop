"use strict";
// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx
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
exports.revalidate = void 0;
exports.generateStaticParams = generateStaticParams;
exports.generateMetadata = generateMetadata;
exports.default = ProductDetailPage;
var i18n_1 = require("@acme/i18n");
var navigation_1 = require("next/navigation");
var headers_1 = require("next/headers");
var BlogListing_1 = require("@ui/components/cms/blocks/BlogListing");
var sanity_1 = require("@acme/sanity");
var shop_json_1 = require("../../../../../shop.json");
var PdpClient_client_1 = require("./PdpClient.client");
var json_server_1 = require("@platform-core/repositories/json.server");
var returnLogistics_1 = require("@platform-core/returnLogistics");
function getProduct(slug, lang, preview) {
    return __awaiter(this, void 0, void 0, function () {
        var catalogue, record, title, description;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, (0, json_server_1.readRepo)(shop_json_1.default.id)];
                case 1:
                    catalogue = _o.sent();
                    record = catalogue.find(function (p) { return p.sku === slug || p.id === slug; });
                    if (!record)
                        return [2 /*return*/, null];
                    if (!preview && record.status !== "active")
                        return [2 /*return*/, null];
                    title = (_c = (_b = (_a = record.title[lang]) !== null && _a !== void 0 ? _a : record.title.en) !== null && _b !== void 0 ? _b : Object.values(record.title)[0]) !== null && _c !== void 0 ? _c : "";
                    description = (_f = (_e = (_d = record.description[lang]) !== null && _d !== void 0 ? _d : record.description.en) !== null && _e !== void 0 ? _e : Object.values(record.description)[0]) !== null && _f !== void 0 ? _f : "";
                    return [2 /*return*/, {
                            id: record.id,
                            slug: (_g = record.sku) !== null && _g !== void 0 ? _g : record.id,
                            title: title,
                            price: record.price,
                            deposit: (_h = record.deposit) !== null && _h !== void 0 ? _h : 0,
                            stock: 0,
                            forSale: (_j = record.forSale) !== null && _j !== void 0 ? _j : true,
                            forRental: (_k = record.forRental) !== null && _k !== void 0 ? _k : false,
                            dailyRate: record.dailyRate,
                            weeklyRate: record.weeklyRate,
                            monthlyRate: record.monthlyRate,
                            availability: (_l = record.availability) !== null && _l !== void 0 ? _l : [],
                            media: (_m = record.media) !== null && _m !== void 0 ? _m : [],
                            sizes: [],
                            description: description,
                        }];
            }
        });
    });
}
function generateStaticParams() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, i18n_1.LOCALES.flatMap(function (lang) {
                    return ["green-sneaker", "sand-sneaker", "black-sneaker"].map(function (slug) { return ({
                        lang: lang,
                        slug: slug,
                    }); });
                })];
        });
    });
}
exports.revalidate = 60;
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var product;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getProduct(params.slug, params.lang, false)];
                case 1:
                    product = _c.sent();
                    return [2 /*return*/, {
                            title: product ? "".concat(product.title, " \u00B7 Base-Shop") : "Product not found",
                        }];
            }
        });
    });
}
function ProductDetailPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var isEnabled, product, latestPost, posts, first, _c, cfg;
        var _d;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, headers_1.draftMode)()];
                case 1:
                    isEnabled = (_e.sent()).isEnabled;
                    return [4 /*yield*/, getProduct(params.slug, params.lang, isEnabled)];
                case 2:
                    product = _e.sent();
                    if (!product)
                        return [2 /*return*/, (0, navigation_1.notFound)()];
                    if (!(shop_json_1.default.luxuryFeatures.contentMerchandising && shop_json_1.default.luxuryFeatures.blog)) return [3 /*break*/, 6];
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, sanity_1.fetchPublishedPosts)(shop_json_1.default.id)];
                case 4:
                    posts = _e.sent();
                    first = posts[0];
                    if (first) {
                        latestPost = {
                            title: first.title,
                            excerpt: first.excerpt,
                            url: "/".concat(params.lang, "/blog/").concat(first.slug),
                            shopUrl: ((_d = first.products) === null || _d === void 0 ? void 0 : _d[0])
                                ? "/".concat(params.lang, "/product/").concat(first.products[0])
                                : undefined,
                        };
                    }
                    return [3 /*break*/, 6];
                case 5:
                    _c = _e.sent();
                    return [3 /*break*/, 6];
                case 6: return [4 /*yield*/, (0, returnLogistics_1.getReturnLogistics)()];
                case 7:
                    cfg = _e.sent();
                    return [2 /*return*/, (<>
      {latestPost && <BlogListing_1.default posts={[latestPost]}/>}
      <PdpClient_client_1.default product={product}/>
      <div className="p-6 space-y-1 text-sm text-gray-600">
        {cfg.requireTags && (<p>Items must have all tags attached for return.</p>)}
        {!cfg.allowWear && (<p>Items showing signs of wear may be rejected.</p>)}
      </div>
    </>)];
            }
        });
    });
}
