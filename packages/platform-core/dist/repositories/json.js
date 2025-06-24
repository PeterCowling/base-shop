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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSettings = readSettings;
exports.writeSettings = writeSettings;
exports.readRepo = readRepo;
exports.writeRepo = writeRepo;
exports.getProductById = getProductById;
exports.updateProductInRepo = updateProductInRepo;
exports.deleteProductFromRepo = deleteProductFromRepo;
exports.duplicateProductInRepo = duplicateProductInRepo;
var fsSync = __importStar(require("node:fs"));
var node_fs_1 = require("node:fs");
var path = __importStar(require("node:path"));
var ulid_1 = require("ulid");
/* -------------------------------------------------------------------------- */
/*  Locate monorepo root (= folder that contains /data/shops)                 */
/* -------------------------------------------------------------------------- */
function resolveDataRoot() {
    var dir = process.cwd();
    while (true) {
        var candidate = path.join(dir, "data", "shops");
        if (fsSync.existsSync(candidate))
            return candidate;
        var parent_1 = path.dirname(dir);
        if (parent_1 === dir)
            break; // reached filesystem root
        dir = parent_1;
    }
    // Fallback: original behaviour (likely incorrect inside apps/*)
    return path.resolve(process.cwd(), "data", "shops");
}
var DATA_ROOT = resolveDataRoot();
var DEFAULT_LANGUAGES = ["en", "de", "it"];
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
/** Path like data/shops/abc/products.json */
function filePath(shop) {
    return path.join(DATA_ROOT, shop, "products.json");
}
/** Path like data/shops/abc/settings.json */
function settingsPath(shop) {
    return path.join(DATA_ROOT, shop, "settings.json");
}
/** Ensure `data/shops/<shop>` exists (mkdir -p). */
function ensureDir(shop) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fs_1.promises.mkdir(path.join(DATA_ROOT, shop), { recursive: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function readSettings(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var buf, parsed, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, node_fs_1.promises.readFile(settingsPath(shop), "utf8")];
                case 1:
                    buf = _b.sent();
                    parsed = JSON.parse(buf);
                    if (Array.isArray(parsed.languages))
                        return [2 /*return*/, parsed];
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, { languages: DEFAULT_LANGUAGES }];
            }
        });
    });
}
function writeSettings(shop, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var tmp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureDir(shop)];
                case 1:
                    _a.sent();
                    tmp = "".concat(settingsPath(shop), ".").concat(Date.now(), ".tmp");
                    return [4 /*yield*/, node_fs_1.promises.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, node_fs_1.promises.rename(tmp, settingsPath(shop))];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */
/**
 * Read catalogue for a shop (returns empty array if file missing/invalid)
 */
function readRepo(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var buf, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, node_fs_1.promises.readFile(filePath(shop), "utf8")];
                case 1:
                    buf = _b.sent();
                    return [2 /*return*/, JSON.parse(buf)];
                case 2:
                    _a = _b.sent();
                    // file missing or invalid ⇒ start with empty repo
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Write full catalogue atomically
 */
function writeRepo(shop, catalogue) {
    return __awaiter(this, void 0, void 0, function () {
        var tmp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureDir(shop)];
                case 1:
                    _a.sent();
                    tmp = "".concat(filePath(shop), ".").concat(Date.now(), ".tmp");
                    return [4 /*yield*/, node_fs_1.promises.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, node_fs_1.promises.rename(tmp, filePath(shop))];
                case 3:
                    _a.sent(); // atomic on most POSIX fs
                    return [2 /*return*/];
            }
        });
    });
}
/* -------------------------------------------------------------------------- */
/*  CRUD helpers for CMS                                                      */
/* -------------------------------------------------------------------------- */
function getProductById(shop, id) {
    return __awaiter(this, void 0, void 0, function () {
        var catalogue;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, readRepo(shop)];
                case 1:
                    catalogue = _b.sent();
                    return [2 /*return*/, (_a = catalogue.find(function (p) { return p.id === id; })) !== null && _a !== void 0 ? _a : null];
            }
        });
    });
}
function updateProductInRepo(shop, patch) {
    return __awaiter(this, void 0, void 0, function () {
        var catalogue, idx, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readRepo(shop)];
                case 1:
                    catalogue = _a.sent();
                    idx = catalogue.findIndex(function (p) { return p.id === patch.id; });
                    if (idx === -1)
                        throw new Error("Product ".concat(patch.id, " not found in ").concat(shop));
                    updated = __assign(__assign(__assign({}, catalogue[idx]), patch), { row_version: catalogue[idx].row_version + 1 });
                    catalogue[idx] = updated;
                    return [4 /*yield*/, writeRepo(shop, catalogue)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, updated];
            }
        });
    });
}
function deleteProductFromRepo(shop, id) {
    return __awaiter(this, void 0, void 0, function () {
        var catalogue, next;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readRepo(shop)];
                case 1:
                    catalogue = _a.sent();
                    next = catalogue.filter(function (p) { return p.id !== id; });
                    if (next.length === catalogue.length) {
                        throw new Error("Product ".concat(id, " not found in ").concat(shop));
                    }
                    return [4 /*yield*/, writeRepo(shop, next)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function duplicateProductInRepo(shop, id) {
    return __awaiter(this, void 0, void 0, function () {
        var catalogue, original, now, copy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readRepo(shop)];
                case 1:
                    catalogue = _a.sent();
                    original = catalogue.find(function (p) { return p.id === id; });
                    if (!original)
                        throw new Error("Product ".concat(id, " not found in ").concat(shop));
                    now = new Date().toISOString();
                    copy = __assign(__assign({}, original), { id: (0, ulid_1.ulid)(), sku: "".concat(original.sku, "-copy"), status: "draft", row_version: 1, created_at: now, updated_at: now });
                    return [4 /*yield*/, writeRepo(shop, __spreadArray([copy], catalogue, true))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, copy];
            }
        });
    });
}
