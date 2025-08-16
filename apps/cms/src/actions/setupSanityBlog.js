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
exports.setupSanityBlog = setupSanityBlog;
// apps/cms/src/actions/setupSanityBlog.ts
var config_1 = require("@acme/config");
var auth_1 = require("./common/auth");
/**
 * Ensures that the Sanity dataset exists and uploads basic blog schema
 * documents so the blog can be used immediately.
 */
function setupSanityBlog(creds_1, editorial_1) {
    return __awaiter(this, arguments, void 0, function (creds, editorial, aclMode) {
        "use server";
        var err_1, projectId, dataset, token, listRes, json, exists, createRes, apiVersion, schemaRes, categoryRes, err_2;
        var _a;
        if (aclMode === void 0) { aclMode = "public"; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _b.sent();
                    if (!(editorial === null || editorial === void 0 ? void 0 : editorial.enabled))
                        return [2 /*return*/, { success: true }];
                    if (!editorial.promoteSchedule) return [3 /*break*/, 5];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/editorial/promote", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ schedule: editorial.promoteSchedule }),
                        })];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _b.sent();
                    console.error("[setupSanityBlog] failed to schedule promotion", err_1);
                    return [3 /*break*/, 5];
                case 5:
                    projectId = creds.projectId, dataset = creds.dataset, token = creds.token;
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 13, , 14]);
                    return [4 /*yield*/, fetch("https://api.sanity.io/v1/projects/".concat(projectId, "/datasets"), {
                            headers: { Authorization: "Bearer ".concat(token) },
                        }).catch(function (err) {
                            console.error("[setupSanityBlog]", err);
                            return null;
                        })];
                case 7:
                    listRes = _b.sent();
                    if (!listRes || !listRes.ok) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to list datasets",
                                code: "DATASET_LIST_ERROR",
                            }];
                    }
                    return [4 /*yield*/, listRes.json()];
                case 8:
                    json = (_b.sent());
                    exists = (_a = json.datasets) === null || _a === void 0 ? void 0 : _a.some(function (d) { return d.name === dataset; });
                    if (!!exists) return [3 /*break*/, 10];
                    return [4 /*yield*/, fetch("https://api.sanity.io/v1/projects/".concat(projectId, "/datasets/").concat(dataset), {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(token),
                            },
                            body: JSON.stringify({ aclMode: aclMode }),
                        }).catch(function (err) {
                            console.error("[setupSanityBlog]", err);
                            return null;
                        })];
                case 9:
                    createRes = _b.sent();
                    if (!createRes || !createRes.ok) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to create dataset",
                                code: "DATASET_CREATE_ERROR",
                            }];
                    }
                    _b.label = 10;
                case 10:
                    apiVersion = config_1.env.SANITY_API_VERSION || "2021-10-21";
                    return [4 /*yield*/, fetch("https://".concat(projectId, ".api.sanity.io/v").concat(apiVersion, "/data/mutate/").concat(dataset), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(token),
                            },
                            body: JSON.stringify({
                                mutations: [
                                    {
                                        createOrReplace: {
                                            _id: "schema-post",
                                            _type: "schema",
                                            name: "post",
                                            title: "Post",
                                            type: "document",
                                            fields: [
                                                { name: "title", type: "string", title: "Title" },
                                                { name: "slug", type: "slug", title: "Slug", options: { source: "title" } },
                                                { name: "excerpt", type: "text", title: "Excerpt" },
                                                { name: "mainImage", type: "image", title: "Main Image" },
                                                { name: "author", type: "string", title: "Author" },
                                                {
                                                    name: "categories",
                                                    type: "array",
                                                    title: "Categories",
                                                    of: [{ type: "reference", to: [{ type: "category" }] }],
                                                },
                                                {
                                                    name: "body",
                                                    title: "Body",
                                                    type: "array",
                                                    of: [
                                                        { type: "block" },
                                                        {
                                                            type: "object",
                                                            name: "productReference",
                                                            title: "Product",
                                                            fields: [
                                                                { name: "slug", type: "string", title: "Product Slug" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                { name: "published", type: "boolean", title: "Published" },
                                                {
                                                    name: "publishedAt",
                                                    type: "datetime",
                                                    title: "Published At",
                                                    description: "Schedule publish time",
                                                },
                                                {
                                                    name: "products",
                                                    type: "array",
                                                    title: "Products",
                                                    of: [{ type: "string" }],
                                                    description: "Shop product IDs or slugs",
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        createOrReplace: {
                                            _id: "schema-category",
                                            _type: "schema",
                                            name: "category",
                                            title: "Category",
                                            type: "document",
                                            fields: [
                                                { name: "title", type: "string", title: "Title" },
                                                {
                                                    name: "slug",
                                                    type: "slug",
                                                    title: "Slug",
                                                    options: { source: "title" },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            }),
                        }).catch(function (err) {
                            console.error("[setupSanityBlog]", err);
                            return null;
                        })];
                case 11:
                    schemaRes = _b.sent();
                    if (!schemaRes || !schemaRes.ok) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to upload schema",
                                code: "SCHEMA_UPLOAD_ERROR",
                            }];
                    }
                    return [4 /*yield*/, fetch("https://".concat(projectId, ".api.sanity.io/v").concat(apiVersion, "/data/mutate/").concat(dataset), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(token),
                            },
                            body: JSON.stringify({
                                mutations: [
                                    {
                                        createIfNotExists: {
                                            _id: "category-daily-editorial",
                                            _type: "category",
                                            title: "Daily Editorial",
                                            slug: { _type: "slug", current: "daily-editorial" },
                                        },
                                    },
                                ],
                            }),
                        }).catch(function (err) {
                            console.error("[setupSanityBlog]", err);
                            return null;
                        })];
                case 12:
                    categoryRes = _b.sent();
                    if (!categoryRes || !categoryRes.ok) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to seed category",
                                code: "CATEGORY_SEED_ERROR",
                            }];
                    }
                    return [2 /*return*/, { success: true }];
                case 13:
                    err_2 = _b.sent();
                    console.error("[setupSanityBlog]", err_2);
                    return [2 /*return*/, {
                            success: false,
                            error: err_2.message,
                            code: "UNKNOWN_ERROR",
                        }];
                case 14: return [2 /*return*/];
            }
        });
    });
}
