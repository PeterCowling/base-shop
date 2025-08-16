"use strict";
// apps/cms/src/lib/rbacStore.ts
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
exports.readRbac = readRbac;
exports.writeRbac = writeRbac;
var permissions_1 = require("@auth/permissions");
var fsSync = require("node:fs");
var node_fs_1 = require("node:fs");
var path = require("node:path");
var DEFAULT_DB = {
    users: {
        "1": {
            id: "1",
            name: "Admin",
            email: "admin@example.com",
            password: "admin",
        },
        "2": {
            id: "2",
            name: "Viewer",
            email: "viewer@example.com",
            password: "$2b$10$zrw7b.7IguK2cWtM83jgKOKe0YiM6BTzGI.S60J1nlanjPw7G5dt6",
        },
        "3": {
            id: "3",
            name: "Shop Admin",
            email: "shopadmin@example.com",
            password: "$2b$10$iiBPVdzX6hr0R.9eOSN36uhBqt0iOIj6ecZlPA.NBpzswomxcTvfi",
        },
        "4": {
            id: "4",
            name: "Catalog Manager",
            email: "catalogmanager@example.com",
            password: "$2b$10$bXz7QTWvPrn7okbbk58uDOJKBPJfPU6RI8F5HV4M5DnBFwSIbXi/y",
        },
        "5": {
            id: "5",
            name: "Theme Editor",
            email: "themeeditor@example.com",
            password: "$2b$10$XCLdGULFzVh56kw/oRP2husM07I1fPe0NqjIUxk9d2/PZBTwVIruK",
        },
    },
    roles: {
        "1": "admin",
        "2": "viewer",
        "3": "ShopAdmin",
        "4": "CatalogManager",
        "5": "ThemeEditor",
    },
    permissions: __assign({}, permissions_1.ROLE_PERMISSIONS),
};
function resolveFile() {
    var dir = process.cwd();
    while (true) {
        var candidateDir = path.join(dir, "data", "cms");
        if (fsSync.existsSync(candidateDir)) {
            return path.join(candidateDir, "users.json");
        }
        var parent_1 = path.dirname(dir);
        if (parent_1 === dir)
            break;
        dir = parent_1;
    }
    return path.resolve(process.cwd(), "data", "cms", "users.json");
}
var FILE = resolveFile();
function readRbac() {
    return __awaiter(this, void 0, void 0, function () {
        var buf, parsed, permissions, _i, _a, role, _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, node_fs_1.promises.readFile(FILE, "utf8")];
                case 1:
                    buf = _d.sent();
                    parsed = JSON.parse(buf);
                    if (parsed && parsed.users && parsed.roles && parsed.permissions) {
                        permissions = __assign({}, DEFAULT_DB.permissions);
                        for (_i = 0, _a = Object.keys(parsed.permissions); _i < _a.length; _i++) {
                            role = _a[_i];
                            permissions[role] = Array.from(new Set(__spreadArray(__spreadArray([], ((_c = permissions[role]) !== null && _c !== void 0 ? _c : []), true), parsed.permissions[role], true)));
                        }
                        return [2 /*return*/, __assign(__assign(__assign({}, DEFAULT_DB), parsed), { permissions: permissions })];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _b = _d.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, __assign({}, DEFAULT_DB)];
            }
        });
    });
}
function writeRbac(db) {
    return __awaiter(this, void 0, void 0, function () {
        var tmp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fs_1.promises.mkdir(path.dirname(FILE), { recursive: true })];
                case 1:
                    _a.sent();
                    tmp = "".concat(FILE, ".").concat(Date.now(), ".tmp");
                    return [4 /*yield*/, node_fs_1.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf8")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, node_fs_1.promises.rename(tmp, FILE)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
