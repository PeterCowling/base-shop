"use strict";
// apps/cms/src/actions/blog.server.ts
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
exports.getPosts = getPosts;
exports.getPost = getPost;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.publishPost = publishPost;
exports.unpublishPost = unpublishPost;
exports.deletePost = deletePost;
var shops_1 = require("@platform-core/shops");
var shop_server_1 = require("@platform-core/repositories/shop.server");
var auth_1 = require("./common/auth");
var plugin_sanity_1 = require("@acme/plugin-sanity");
function collectProductSlugs(content) {
    var slugs = new Set();
    var walk = function (node) {
        if (!node)
            return;
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (typeof node === "object") {
            if (node._type === "productReference" && typeof node.slug === "string") {
                slugs.add(node.slug);
            }
            for (var _i = 0, _a = Object.values(node); _i < _a.length; _i++) {
                var value = _a[_i];
                walk(value);
            }
        }
    };
    walk(content);
    return Array.from(slugs);
}
function filterExistingProductSlugs(shopId, slugs) {
    return __awaiter(this, void 0, void 0, function () {
        var res, existing, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (slugs.length === 0)
                        return [2 /*return*/, []];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/products/".concat(shopId, "/slugs"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slugs: slugs }),
                        })];
                case 2:
                    res = _b.sent();
                    if (!res.ok)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, res.json()];
                case 3:
                    existing = _b.sent();
                    return [2 /*return*/, Array.isArray(existing) ? existing : []];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getConfig(shopId) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, sanity;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, shop_server_1.getShopById)(shopId)];
                case 1:
                    shop = _a.sent();
                    sanity = (0, shops_1.getSanityConfig)(shop);
                    if (!sanity) {
                        throw new Error("Missing Sanity config for shop ".concat(shopId));
                    }
                    return [2 /*return*/, sanity];
            }
        });
    });
}
function getPosts(shopId) {
    return __awaiter(this, void 0, void 0, function () {
        var config, posts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _a.sent();
                    return [4 /*yield*/, (0, plugin_sanity_1.query)(config, '*[_type=="post"]{_id,title,body,published,publishedAt,"slug":slug.current,excerpt,mainImage,author,categories}')];
                case 3:
                    posts = _a.sent();
                    return [2 /*return*/, posts !== null && posts !== void 0 ? posts : []];
            }
        });
    });
}
function getPost(shopId, id) {
    return __awaiter(this, void 0, void 0, function () {
        var config, post;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _a.sent();
                    return [4 /*yield*/, (0, plugin_sanity_1.query)(config, "*[_type==\"post\" && _id==\"".concat(id, "\"][0]{_id,title,body,published,publishedAt,\"slug\":slug.current,excerpt,mainImage,author,categories}"))];
                case 3:
                    post = _a.sent();
                    return [2 /*return*/, post !== null && post !== void 0 ? post : null];
            }
        });
    });
}
function createPost(shopId, _prev, formData) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var config, title, content, body, products, existingSlugs, slug, excerpt, mainImage, author, categoriesInput, categories, publishedAtInput, publishedAt, _a, result, id, err_1;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _l.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _l.sent();
                    title = String((_b = formData.get("title")) !== null && _b !== void 0 ? _b : "");
                    content = String((_c = formData.get("content")) !== null && _c !== void 0 ? _c : "[]");
                    body = [];
                    products = [];
                    try {
                        body = JSON.parse(content);
                        products = collectProductSlugs(body);
                    }
                    catch (_m) {
                        body = [];
                        products = [];
                    }
                    return [4 /*yield*/, filterExistingProductSlugs(shopId, products)];
                case 3:
                    existingSlugs = _l.sent();
                    products = existingSlugs;
                    slug = String((_d = formData.get("slug")) !== null && _d !== void 0 ? _d : "");
                    excerpt = String((_e = formData.get("excerpt")) !== null && _e !== void 0 ? _e : "");
                    mainImage = String((_f = formData.get("mainImage")) !== null && _f !== void 0 ? _f : "");
                    author = String((_g = formData.get("author")) !== null && _g !== void 0 ? _g : "");
                    categoriesInput = String((_h = formData.get("categories")) !== null && _h !== void 0 ? _h : "");
                    categories = categoriesInput
                        .split(",")
                        .map(function (c) { return c.trim(); })
                        .filter(Boolean);
                    publishedAtInput = formData.get("publishedAt");
                    publishedAt = publishedAtInput
                        ? new Date(String(publishedAtInput)).toISOString()
                        : undefined;
                    _l.label = 4;
                case 4:
                    _l.trys.push([4, 8, , 9]);
                    _a = slug;
                    if (!_a) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, plugin_sanity_1.slugExists)(config, slug)];
                case 5:
                    _a = (_l.sent());
                    _l.label = 6;
                case 6:
                    if (_a) {
                        return [2 /*return*/, { error: "Slug already exists" }];
                    }
                    return [4 /*yield*/, (0, plugin_sanity_1.mutate)(config, {
                            mutations: [
                                {
                                    create: __assign(__assign({ _type: "post", title: title, body: body, products: products, published: false, slug: slug ? { current: slug } : undefined, excerpt: excerpt || undefined, mainImage: mainImage || undefined, author: author || undefined }, (categories.length ? { categories: categories } : {})), (publishedAt ? { publishedAt: publishedAt } : {})),
                                },
                            ],
                            returnIds: true,
                        })];
                case 7:
                    result = _l.sent();
                    id = (_k = (_j = result === null || result === void 0 ? void 0 : result.results) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.id;
                    return [2 /*return*/, { message: "Post created", id: id }];
                case 8:
                    err_1 = _l.sent();
                    console.error("Failed to create post", err_1);
                    return [2 /*return*/, { error: "Failed to create post" }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function updatePost(shopId, _prev, formData) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var config, id, title, content, body, products, existingSlugs, slug, excerpt, mainImage, author, categoriesInput, categories, publishedAtInput, publishedAt, _a, err_2;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _k.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _k.sent();
                    id = String((_b = formData.get("id")) !== null && _b !== void 0 ? _b : "");
                    title = String((_c = formData.get("title")) !== null && _c !== void 0 ? _c : "");
                    content = String((_d = formData.get("content")) !== null && _d !== void 0 ? _d : "[]");
                    body = [];
                    products = [];
                    try {
                        body = JSON.parse(content);
                        products = collectProductSlugs(body);
                    }
                    catch (_l) {
                        body = [];
                        products = [];
                    }
                    return [4 /*yield*/, filterExistingProductSlugs(shopId, products)];
                case 3:
                    existingSlugs = _k.sent();
                    products = existingSlugs;
                    slug = String((_e = formData.get("slug")) !== null && _e !== void 0 ? _e : "");
                    excerpt = String((_f = formData.get("excerpt")) !== null && _f !== void 0 ? _f : "");
                    mainImage = String((_g = formData.get("mainImage")) !== null && _g !== void 0 ? _g : "");
                    author = String((_h = formData.get("author")) !== null && _h !== void 0 ? _h : "");
                    categoriesInput = String((_j = formData.get("categories")) !== null && _j !== void 0 ? _j : "");
                    categories = categoriesInput
                        .split(",")
                        .map(function (c) { return c.trim(); })
                        .filter(Boolean);
                    publishedAtInput = formData.get("publishedAt");
                    publishedAt = publishedAtInput
                        ? new Date(String(publishedAtInput)).toISOString()
                        : undefined;
                    _k.label = 4;
                case 4:
                    _k.trys.push([4, 8, , 9]);
                    _a = slug;
                    if (!_a) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, plugin_sanity_1.slugExists)(config, slug, id)];
                case 5:
                    _a = (_k.sent());
                    _k.label = 6;
                case 6:
                    if (_a) {
                        return [2 /*return*/, { error: "Slug already exists" }];
                    }
                    return [4 /*yield*/, (0, plugin_sanity_1.mutate)(config, {
                            mutations: [
                                {
                                    patch: {
                                        id: id,
                                        set: __assign(__assign({ title: title, body: body, products: products, slug: slug ? { current: slug } : undefined, excerpt: excerpt || undefined, mainImage: mainImage || undefined, author: author || undefined }, (categories.length ? { categories: categories } : {})), (publishedAt ? { publishedAt: publishedAt } : {})),
                                    },
                                },
                            ],
                        })];
                case 7:
                    _k.sent();
                    return [2 /*return*/, { message: "Post updated" }];
                case 8:
                    err_2 = _k.sent();
                    console.error("Failed to update post", err_2);
                    return [2 /*return*/, { error: "Failed to update post" }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function publishPost(shopId, id, _prev, formData) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var config, publishedAtInput, publishedAt, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _a.sent();
                    publishedAtInput = formData === null || formData === void 0 ? void 0 : formData.get("publishedAt");
                    publishedAt = publishedAtInput
                        ? new Date(String(publishedAtInput)).toISOString()
                        : new Date().toISOString();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, plugin_sanity_1.mutate)(config, {
                            mutations: [{ patch: { id: id, set: { published: true, publishedAt: publishedAt } } }],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, { message: "Post published" }];
                case 5:
                    err_3 = _a.sent();
                    console.error("Failed to publish post", err_3);
                    return [2 /*return*/, { error: "Failed to publish post" }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function unpublishPost(shopId, id, _prev, _formData) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var config, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, plugin_sanity_1.mutate)(config, {
                            mutations: [{ patch: { id: id, set: { published: false }, unset: ["publishedAt"] } }],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, { message: "Post unpublished" }];
                case 5:
                    err_4 = _a.sent();
                    console.error("Failed to unpublish post", err_4);
                    return [2 /*return*/, { error: "Failed to unpublish post" }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function deletePost(shopId, id) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var config, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getConfig(shopId)];
                case 2:
                    config = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, plugin_sanity_1.mutate)(config, { mutations: [{ delete: { id: id } }] })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, { message: "Post deleted" }];
                case 5:
                    err_5 = _a.sent();
                    console.error("Failed to delete post", err_5);
                    return [2 /*return*/, { error: "Failed to delete post" }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
