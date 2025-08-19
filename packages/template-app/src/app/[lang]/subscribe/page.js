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
exports.default = SubscribePage;
// packages/template-app/src/app/[lang]/subscribe/page.tsx
var locales_1 = require("@/i18n/locales");
var stripe_1 = require("@acme/stripe");
var core_1 = require("@acme/config/env/core");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var _auth_1 = require("@auth");
var navigation_1 = require("next/navigation");
var subscriptionUsage_server_1 = require("@platform-core/repositories/subscriptionUsage.server");
var users_1 = require("@platform-core/repositories/users");
function SubscribePage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        function selectPlan(formData) {
            return __awaiter(this, void 0, void 0, function () {
                "use server";
                var planId, session, priceId, sub;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            planId = formData.get("plan");
                            if (!planId)
                                return [2 /*return*/];
                            return [4 /*yield*/, (0, _auth_1.getCustomerSession)()];
                        case 1:
                            session = _a.sent();
                            if (!(session === null || session === void 0 ? void 0 : session.customerId))
                                return [2 /*return*/];
                            priceId = planId;
                            return [4 /*yield*/, stripe_1.stripe.subscriptions.create({
                                    customer: session.customerId,
                                    items: [{ price: priceId }],
                                    // `prorate` is deprecated but required for this flow
                                    prorate: true,
                                    metadata: { userId: session.customerId, shop: shopId },
                                })];
                        case 2:
                            sub = _a.sent();
                            return [4 /*yield*/, (0, users_1.setStripeSubscriptionId)(session.customerId, sub.id, shopId)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, (0, subscriptionUsage_server_1.setUserPlan)(shopId, session.customerId, planId)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        var rawLang, lang, shopId, shop;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    rawLang = (_c.sent()).lang;
                    lang = (0, locales_1.resolveLocale)(rawLang);
                    shopId = core_1.coreEnv.NEXT_PUBLIC_SHOP_ID || "shop";
                    return [4 /*yield*/, (0, shops_server_1.readShop)(shopId)];
                case 2:
                    shop = _c.sent();
                    if (!shop.subscriptionsEnabled)
                        return [2 /*return*/, (0, navigation_1.notFound)()];
                    return [2 /*return*/, (<div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Choose a Plan</h1>
      <form action={selectPlan} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shop.rentalSubscriptions.map(function (p) { return (<label key={p.id} className="flex cursor-pointer flex-col gap-2 rounded border p-4 hover:border-black">
            <input type="radio" name="plan" value={p.id} className="sr-only"/>
            <span className="text-lg font-semibold">{p.id}</span>
            {shop.subscriptionsEnabled && (<>
                <span>{p.itemsIncluded} items included</span>
                <span>{p.swapLimit} swaps/month</span>
                <span>{p.shipmentsPerMonth} shipments/month</span>
              </>)}
          </label>); })}
        <button type="submit" className="mt-4 rounded bg-black px-4 py-2 text-white">
          Subscribe
        </button>
      </form>
    </div>)];
            }
        });
    });
}
