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
exports.default = SwapPage;
// packages/template-app/src/app/account/swaps/page.tsx
var cartCookie_1 = require("@platform-core/cartCookie");
var cartStore_1 = require("@platform-core/cartStore");
var products_1 = require("@platform-core/products");
var headers_1 = require("next/headers");
var _auth_1 = require("@auth");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var navigation_1 = require("next/navigation");
var core_1 = require("@acme/config/env/core");
var _date_utils_1 = require("@date-utils");
var subscriptionUsage_server_1 = require("@platform-core/repositories/subscriptionUsage.server");
function SwapPage() {
    return __awaiter(this, void 0, void 0, function () {
        function swap(formData) {
            return __awaiter(this, void 0, void 0, function () {
                "use server";
                var oldSku, newSku, cookieStore, cartId, session, shopId, shop, planId, selectedPlan, month, remaining, sku;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            oldSku = formData.get("old");
                            newSku = formData.get("new");
                            return [4 /*yield*/, (0, headers_1.cookies)()];
                        case 1:
                            cookieStore = _b.sent();
                            cartId = (0, cartCookie_1.decodeCartCookie)((_a = cookieStore.get(cartCookie_1.CART_COOKIE)) === null || _a === void 0 ? void 0 : _a.value);
                            return [4 /*yield*/, (0, _auth_1.getCustomerSession)()];
                        case 2:
                            session = _b.sent();
                            if (!cartId || !(session === null || session === void 0 ? void 0 : session.customerId))
                                return [2 /*return*/];
                            shopId = core_1.coreEnv.NEXT_PUBLIC_SHOP_ID || "shop";
                            return [4 /*yield*/, (0, shops_server_1.readShop)(shopId)];
                        case 3:
                            shop = _b.sent();
                            if (!shop.subscriptionsEnabled)
                                return [2 /*return*/];
                            return [4 /*yield*/, (0, subscriptionUsage_server_1.getUserPlan)(shopId, session.customerId)];
                        case 4:
                            planId = _b.sent();
                            selectedPlan = planId
                                ? shop.rentalSubscriptions.find(function (p) { return p.id === planId; })
                                : undefined;
                            month = (0, _date_utils_1.nowIso)().slice(0, 7);
                            if (!selectedPlan)
                                return [2 /*return*/];
                            return [4 /*yield*/, (0, subscriptionUsage_server_1.getRemainingSwaps)(shopId, session.customerId, month, selectedPlan.swapLimit)];
                        case 5:
                            remaining = _b.sent();
                            if (remaining <= 0)
                                return [2 /*return*/];
                            sku = (0, products_1.getProductById)(newSku);
                            if (!sku)
                                return [2 /*return*/];
                            return [4 /*yield*/, (0, cartStore_1.removeItem)(cartId, oldSku)];
                        case 6:
                            _b.sent();
                            return [4 /*yield*/, (0, cartStore_1.incrementQty)(cartId, sku, 1)];
                        case 7:
                            _b.sent();
                            return [4 /*yield*/, (0, subscriptionUsage_server_1.incrementSwapCount)(shopId, session.customerId, month)];
                        case 8:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        var cookieStore, cartId, cart, _a, session, shopId, shop, planId, _b, selectedPlan, month, remainingSwaps, _c, canSwap;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, headers_1.cookies)()];
                case 1:
                    cookieStore = _e.sent();
                    cartId = (0, cartCookie_1.decodeCartCookie)((_d = cookieStore.get(cartCookie_1.CART_COOKIE)) === null || _d === void 0 ? void 0 : _d.value);
                    if (!cartId) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, cartStore_1.getCart)(cartId)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = {};
                    _e.label = 4;
                case 4:
                    cart = _a;
                    return [4 /*yield*/, (0, _auth_1.getCustomerSession)()];
                case 5:
                    session = _e.sent();
                    shopId = core_1.coreEnv.NEXT_PUBLIC_SHOP_ID || "shop";
                    return [4 /*yield*/, (0, shops_server_1.readShop)(shopId)];
                case 6:
                    shop = _e.sent();
                    if (!shop.subscriptionsEnabled)
                        return [2 /*return*/, (0, navigation_1.notFound)()];
                    if (!(session === null || session === void 0 ? void 0 : session.customerId)) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, subscriptionUsage_server_1.getUserPlan)(shopId, session.customerId)];
                case 7:
                    _b = _e.sent();
                    return [3 /*break*/, 9];
                case 8:
                    _b = undefined;
                    _e.label = 9;
                case 9:
                    planId = _b;
                    selectedPlan = planId
                        ? shop.rentalSubscriptions.find(function (p) { return p.id === planId; })
                        : undefined;
                    month = (0, _date_utils_1.nowIso)().slice(0, 7);
                    if (!((session === null || session === void 0 ? void 0 : session.customerId) && selectedPlan)) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, subscriptionUsage_server_1.getRemainingSwaps)(shopId, session.customerId, month, selectedPlan.swapLimit)];
                case 10:
                    _c = _e.sent();
                    return [3 /*break*/, 12];
                case 11:
                    _c = 0;
                    _e.label = 12;
                case 12:
                    remainingSwaps = _c;
                    canSwap = remainingSwaps > 0;
                    return [2 /*return*/, (<div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Swap Items</h1>
      <p className="mb-4">Swaps remaining this month: {remainingSwaps}</p>
      {Object.entries(cart).map(function (_a) {
                                var id = _a[0], line = _a[1];
                                return (<form key={id} action={swap} className="mb-3 flex gap-2">
          <span className="flex-1">{line.sku.name}</span>
          <input type="hidden" name="old" value={id}/>
          <input type="text" name="new" placeholder="New SKU ID" className="w-40 border p-1"/>
          <button type="submit" disabled={!canSwap} className="rounded bg-black px-2 py-1 text-white disabled:opacity-50">
            Swap
          </button>
        </form>);
                            })}
    </div>)];
            }
        });
    });
}
