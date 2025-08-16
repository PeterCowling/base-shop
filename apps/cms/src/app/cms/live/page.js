"use strict";
// apps/cms/src/app/cms/live/page.tsx
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
exports.default = LivePage;
var shadcn_1 = require("@/components/atoms/shadcn");
var node_fs_1 = require("node:fs");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var listShops_1 = require("../listShops");
exports.metadata = {
    title: "Live shops · Base-Shop",
};
function resolveAppsRoot() {
    var dir = process.cwd();
    while (true) {
        var appsPath = node_path_1.default.join(dir, "apps");
        if (node_fs_1.default.existsSync(appsPath))
            return appsPath;
        var parent_1 = node_path_1.default.dirname(dir);
        if (parent_1 === dir)
            break; // reached filesystem root
        dir = parent_1;
    }
    return node_path_1.default.resolve(process.cwd(), "apps");
}
function findPort(shop) {
    return __awaiter(this, void 0, void 0, function () {
        var root, pkgPath, pkgRaw, pkg, cmd, match, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, , 3]);
                    root = resolveAppsRoot();
                    pkgPath = node_path_1.default.join(root, "shop-".concat(shop), "package.json");
                    return [4 /*yield*/, promises_1.default.readFile(pkgPath, "utf8")];
                case 1:
                    pkgRaw = _e.sent();
                    pkg = JSON.parse(pkgRaw);
                    cmd = (_d = (_b = (_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.dev) !== null && _b !== void 0 ? _b : (_c = pkg.scripts) === null || _c === void 0 ? void 0 : _c.start) !== null && _d !== void 0 ? _d : "";
                    match = cmd.match(/-p\s*(\d+)/);
                    return [2 /*return*/, { port: match ? parseInt(match[1], 10) : null }];
                case 2:
                    error_1 = _e.sent();
                    console.error("Failed to determine port for shop ".concat(shop, ":"), error_1);
                    return [2 /*return*/, {
                            port: null,
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function LivePage() {
    return __awaiter(this, void 0, void 0, function () {
        var shops, portInfo, _a, _b;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, listShops_1.listShops)()];
                case 1:
                    shops = _c.sent();
                    _b = (_a = Object).fromEntries;
                    return [4 /*yield*/, Promise.all(shops.map(function (shop) { return __awaiter(_this, void 0, void 0, function () {
                            var info;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, findPort(shop)];
                                    case 1:
                                        info = _a.sent();
                                        return [2 /*return*/, [shop, info]];
                                }
                            });
                        }); }))];
                case 2:
                    portInfo = _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/, (<div>
      <h2 className="mb-4 text-xl font-semibold">Live shops</h2>
      <ul className="space-y-2">
        {shops.map(function (shop) {
                                var info = portInfo[shop];
                                var url = (info === null || info === void 0 ? void 0 : info.port) ? "http://localhost:".concat(info.port) : "#";
                                return (<li key={shop}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <shadcn_1.Button>{shop}</shadcn_1.Button>
              </a>
              {(info === null || info === void 0 ? void 0 : info.error) && (<p className="text-sm text-red-600">
                  Failed to determine port: {info.error}
                </p>)}
            </li>);
                            })}

        {shops.length === 0 && <li>No shops found.</li>}
      </ul>
    </div>)];
            }
        });
    });
}
