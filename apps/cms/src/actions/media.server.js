// apps/cms/src/actions/media.server.ts
"use server";
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
exports.listMedia = listMedia;
exports.uploadMedia = uploadMedia;
exports.deleteMedia = deleteMedia;
var shops_1 = require("@platform-core/shops");
var node_fs_1 = require("node:fs");
var path = require("node:path");
var sharp_1 = require("sharp");
var ulid_1 = require("ulid");
var auth_1 = require("./common/auth");
/* -------------------------------------------------------------------------- */
/*  Path helpers                                                              */
/* -------------------------------------------------------------------------- */
function uploadsDir(shop) {
    shop = (0, shops_1.validateShopName)(shop);
    return path.join(process.cwd(), "public", "uploads", shop);
}
function metadataPath(shop) {
    return path.join(uploadsDir(shop), "metadata.json");
}
/* -------------------------------------------------------------------------- */
/*  Metadata helpers                                                          */
/* -------------------------------------------------------------------------- */
function readMetadata(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, node_fs_1.promises.readFile(metadataPath(shop), "utf8")];
                case 1:
                    data = _b.sent();
                    return [2 /*return*/, JSON.parse(data)];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, {}];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function writeMetadata(shop, data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fs_1.promises.writeFile(metadataPath(shop), JSON.stringify(data, null, 2))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  List                                                                      */
/* -------------------------------------------------------------------------- */
function listMedia(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var dir, files, meta_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    dir = uploadsDir(shop);
                    return [4 /*yield*/, node_fs_1.promises.readdir(dir)];
                case 3:
                    files = _a.sent();
                    return [4 /*yield*/, readMetadata(shop)];
                case 4:
                    meta_1 = _a.sent();
                    return [2 /*return*/, files
                            .filter(function (f) { return f !== "metadata.json"; })
                            .map(function (f) {
                            var _a, _b, _c, _d;
                            return ({
                                url: path.posix.join("/uploads", shop, f),
                                title: (_a = meta_1[f]) === null || _a === void 0 ? void 0 : _a.title,
                                altText: (_b = meta_1[f]) === null || _b === void 0 ? void 0 : _b.altText,
                                type: (_d = (_c = meta_1[f]) === null || _c === void 0 ? void 0 : _c.type) !== null && _d !== void 0 ? _d : "image",
                            });
                        })];
                case 5:
                    err_1 = _a.sent();
                    console.error("Failed to list media", err_1);
                    throw new Error("Failed to list media");
                case 6: return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Upload                                                                    */
/* -------------------------------------------------------------------------- */
function uploadMedia(shop_1, formData_1) {
    return __awaiter(this, arguments, void 0, function (shop, formData, requiredOrientation) {
        var file, title, altText, type, buffer, maxSize, _a, _b, _c, width, height, err_2, maxSize, _d, _e, dir, ext, filename, meta;
        var _f, _g;
        if (requiredOrientation === void 0) { requiredOrientation = "landscape"; }
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, (0, auth_1.ensureAuthorized)()];
                case 1:
                    _h.sent();
                    file = formData.get("file");
                    if (!(file instanceof File))
                        throw new Error("No file provided");
                    title = (_f = formData.get("title")) === null || _f === void 0 ? void 0 : _f.toString();
                    altText = (_g = formData.get("altText")) === null || _g === void 0 ? void 0 : _g.toString();
                    if (!file.type.startsWith("image/")) return [3 /*break*/, 8];
                    type = "image";
                    maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize)
                        throw new Error("File too large");
                    _b = (_a = Buffer).from;
                    return [4 /*yield*/, new Response(file).arrayBuffer()];
                case 2:
                    buffer = _b.apply(_a, [_h.sent()]);
                    return [4 /*yield*/, (0, sharp_1.default)(buffer).metadata()];
                case 3:
                    _c = _h.sent(), width = _c.width, height = _c.height;
                    if (width &&
                        height &&
                        requiredOrientation === "landscape" &&
                        width < height) {
                        throw new Error("Image orientation must be landscape");
                    }
                    if (width &&
                        height &&
                        requiredOrientation === "portrait" &&
                        width >= height) {
                        throw new Error("Image orientation must be portrait");
                    }
                    _h.label = 4;
                case 4:
                    _h.trys.push([4, 6, , 7]);
                    // placeholder for resize/optimisation – ensures the buffer is valid
                    return [4 /*yield*/, (0, sharp_1.default)(buffer).toBuffer()];
                case 5:
                    // placeholder for resize/optimisation – ensures the buffer is valid
                    _h.sent();
                    return [3 /*break*/, 7];
                case 6:
                    err_2 = _h.sent();
                    if (err_2 instanceof Error && /orientation must be/i.test(err_2.message)) {
                        throw err_2;
                    }
                    throw new Error("Failed to process image");
                case 7: return [3 /*break*/, 11];
                case 8:
                    if (!file.type.startsWith("video/")) return [3 /*break*/, 10];
                    type = "video";
                    maxSize = 50 * 1024 * 1024;
                    if (file.size > maxSize)
                        throw new Error("File too large");
                    _e = (_d = Buffer).from;
                    return [4 /*yield*/, new Response(file).arrayBuffer()];
                case 9:
                    buffer = _e.apply(_d, [_h.sent()]);
                    return [3 /*break*/, 11];
                case 10: throw new Error("Invalid file type");
                case 11:
                    dir = uploadsDir(shop);
                    return [4 /*yield*/, node_fs_1.promises.mkdir(dir, { recursive: true })];
                case 12:
                    _h.sent();
                    ext = path.extname(file.name) || (type === "video" ? ".mp4" : ".jpg");
                    filename = "".concat((0, ulid_1.ulid)()).concat(ext);
                    return [4 /*yield*/, node_fs_1.promises.writeFile(path.join(dir, filename), buffer)];
                case 13:
                    _h.sent();
                    return [4 /*yield*/, readMetadata(shop)];
                case 14:
                    meta = _h.sent();
                    meta[filename] = { title: title, altText: altText, type: type };
                    return [4 /*yield*/, writeMetadata(shop, meta)];
                case 15:
                    _h.sent();
                    return [2 /*return*/, {
                            url: path.posix.join("/uploads", shop, filename),
                            title: title,
                            altText: altText,
                            type: type,
                        }];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Delete                                                                    */
/* -------------------------------------------------------------------------- */
function deleteMedia(shop, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var prefix, normalized, filename, dir, fullPath, relative, meta;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prefix = path.posix.join("/uploads", (0, shops_1.validateShopName)(shop)) + "/";
                    normalized = path.posix.normalize(filePath);
                    if (!normalized.startsWith(prefix))
                        throw new Error("Invalid file path");
                    filename = normalized.slice(prefix.length);
                    dir = uploadsDir(shop);
                    fullPath = path.join(dir, filename);
                    relative = path.relative(dir, fullPath);
                    if (relative.startsWith("..") || path.isAbsolute(relative)) {
                        throw new Error("Invalid file path");
                    }
                    return [4 /*yield*/, node_fs_1.promises.unlink(fullPath).catch(function () {
                            /* ignore – file might already be gone */
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, readMetadata(shop)];
                case 2:
                    meta = _a.sent();
                    if (!meta[filename]) return [3 /*break*/, 4];
                    delete meta[filename];
                    return [4 /*yield*/, writeMetadata(shop, meta)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
