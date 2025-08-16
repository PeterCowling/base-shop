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
exports.revalidate = exports.metadata = void 0;
exports.default = CmsDashboardPage;
// apps/cms/src/app/cms/page.tsx
var shadcn_1 = require("@/components/atoms/shadcn");
var accounts_server_1 = require("@cms/actions/accounts.server");
var options_1 = require("@cms/auth/options");
var rbacStore_1 = require("@cms/lib/rbacStore");
var templates_1 = require("@ui/components/templates");
var next_auth_1 = require("next-auth");
var link_1 = require("next/link");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var dataRoot_1 = require("@platform-core/dataRoot");
exports.metadata = {
    title: "Dashboard · Base-Shop",
};
exports.revalidate = 0;
function collectStats() {
    return __awaiter(this, void 0, void 0, function () {
        var shopsDir, shops, entries, _a, productCount, usersMap;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    shopsDir = (0, dataRoot_1.resolveDataRoot)();
                    shops = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, promises_1.default.readdir(shopsDir, { withFileTypes: true })];
                case 2:
                    entries = _b.sent();
                    shops = entries.filter(function (e) { return e.isDirectory(); }).map(function (e) { return e.name; });
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    shops = [];
                    return [3 /*break*/, 4];
                case 4:
                    productCount = 0;
                    return [4 /*yield*/, Promise.all(shops.map(function (shop) { return __awaiter(_this, void 0, void 0, function () {
                            var file, buf, json, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        file = node_path_1.default.join(shopsDir, shop, "products.json");
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, promises_1.default.readFile(file, "utf8")];
                                    case 2:
                                        buf = _a.sent();
                                        json = JSON.parse(buf);
                                        if (Array.isArray(json))
                                            productCount += json.length;
                                        return [3 /*break*/, 4];
                                    case 3:
                                        err_1 = _a.sent();
                                        if (err_1.code !== "ENOENT") {
                                            console.error("Failed reading ".concat(file), err_1);
                                        }
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, rbacStore_1.readRbac)()];
                case 6:
                    usersMap = (_b.sent()).users;
                    return [2 /*return*/, {
                            users: Object.keys(usersMap).length,
                            shops: shops.length,
                            products: productCount,
                        }];
            }
        });
    });
}
function CmsDashboardPage() {
    return __awaiter(this, void 0, void 0, function () {
        function approve(formData) {
            return __awaiter(this, void 0, void 0, function () {
                "use server";
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, accounts_server_1.approveAccount)(formData)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        var session, _a, users, shops, products, stats, pending, roles;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, next_auth_1.getServerSession)(options_1.authOptions)];
                case 1:
                    session = _b.sent();
                    return [4 /*yield*/, collectStats()];
                case 2:
                    _a = _b.sent(), users = _a.users, shops = _a.shops, products = _a.products;
                    stats = [
                        { label: "Users", value: users },
                        { label: "Shops", value: shops },
                        { label: "Products", value: products },
                    ];
                    pending = [];
                    if (!((session === null || session === void 0 ? void 0 : session.user.role) === "admin")) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, accounts_server_1.listPendingUsers)()];
                case 3:
                    pending = _b.sent();
                    _b.label = 4;
                case 4:
                    roles = [
                        "admin",
                        "viewer",
                        "ShopAdmin",
                        "CatalogManager",
                        "ThemeEditor",
                    ];
                    return [2 /*return*/, (<div className="space-y-6">
      <templates_1.DashboardTemplate stats={stats}/>
      {shops === 0 && (<div className="rounded border border-dashed p-4">
          <p className="mb-2">
            No shops found. Get started by creating your first shop.
          </p>
          {(session === null || session === void 0 ? void 0 : session.user.role) === "admin" && (<link_1.default href="/cms/wizard" className="bg-primary hover:bg-primary/90 focus-visible:ring-primary rounded-md px-3 py-2 text-sm text-white focus-visible:ring-2 focus-visible:outline-none">
              Create Shop
            </link_1.default>)}
        </div>)}
      {(session === null || session === void 0 ? void 0 : session.user.role) === "admin" && (<div>
          <h2 className="mb-4 text-xl font-semibold">Account Requests</h2>
          {pending.length === 0 ? (<p>No pending requests.</p>) : (pending.map(function (r) { return (<form key={r.id} action={approve} className="mb-4 rounded border p-3">
                <input type="hidden" name="id" value={r.id}/>
                <p>
                  <b>{r.name}</b> ({r.email})
                </p>
                <div className="my-2 flex flex-wrap gap-2">
                  {roles.map(function (role) { return (<label key={role} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" name="roles" value={role}/>
                      {role}
                    </label>); })}
                </div>
                <shadcn_1.Button type="submit">Approve</shadcn_1.Button>
              </form>); }))}
        </div>)}
    </div>)];
            }
        });
    });
}
