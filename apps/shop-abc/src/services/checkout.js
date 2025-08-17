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
exports.buildCheckoutMetadata = void 0;
exports.buildLineItemsForItem = buildLineItemsForItem;
exports.computeTotals = computeTotals;
exports.createCheckoutSession = createCheckoutSession;
// apps/shop-abc/src/services/checkout.ts
var pricing_1 = require("@platform-core/pricing");
function buildLineItemsForItem(item, rentalDays, discountRate, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var unitPrice, discounted, unitConv, depositConv, baseName, lines;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, pricing_1.priceForDays)(item.sku, rentalDays)];
                case 1:
                    unitPrice = _a.sent();
                    discounted = Math.round(unitPrice * (1 - discountRate));
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(discounted, currency)];
                case 2:
                    unitConv = _a.sent();
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(item.sku.deposit, currency)];
                case 3:
                    depositConv = _a.sent();
                    baseName = item.size ? "".concat(item.sku.title, " (").concat(item.size, ")") : item.sku.title;
                    lines = [
                        {
                            price_data: {
                                currency: currency.toLowerCase(),
                                unit_amount: Math.round(unitConv * 100),
                                product_data: { name: baseName },
                            },
                            quantity: item.qty,
                        },
                    ];
                    if (item.sku.deposit > 0) {
                        lines.push({
                            price_data: {
                                currency: currency.toLowerCase(),
                                unit_amount: Math.round(depositConv * 100),
                                product_data: { name: "".concat(baseName, " deposit") },
                            },
                            quantity: item.qty,
                        });
                    }
                    return [2 /*return*/, lines];
            }
        });
    });
}
function computeTotals(cart, rentalDays, discountRate, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var subtotals, subtotalBase, originalBase, discountBase, depositBase;
        var _a;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all(Object.values(cart).map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                        var unit, discounted;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, pricing_1.priceForDays)(item.sku, rentalDays)];
                                case 1:
                                    unit = _a.sent();
                                    discounted = Math.round(unit * (1 - discountRate));
                                    return [2 /*return*/, { base: unit * item.qty, discounted: discounted * item.qty }];
                            }
                        });
                    }); }))];
                case 1:
                    subtotals = _b.sent();
                    subtotalBase = subtotals.reduce(function (sum, v) { return sum + v.discounted; }, 0);
                    originalBase = subtotals.reduce(function (sum, v) { return sum + v.base; }, 0);
                    discountBase = originalBase - subtotalBase;
                    depositBase = Object.values(cart).reduce(function (sum, item) { return sum + item.sku.deposit * item.qty; }, 0);
                    _a = {};
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(subtotalBase, currency)];
                case 2:
                    _a.subtotal = _b.sent();
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(depositBase, currency)];
                case 3:
                    _a.depositTotal = _b.sent();
                    return [4 /*yield*/, (0, pricing_1.convertCurrency)(discountBase, currency)];
                case 4: return [2 /*return*/, (_a.discount = _b.sent(),
                        _a)];
            }
        });
    });
}
var buildCheckoutMetadata = function (_a) {
    var subtotal = _a.subtotal, depositTotal = _a.depositTotal, returnDate = _a.returnDate, rentalDays = _a.rentalDays, customerId = _a.customerId, discount = _a.discount, coupon = _a.coupon, currency = _a.currency, taxRate = _a.taxRate, taxAmount = _a.taxAmount, clientIp = _a.clientIp, sizes = _a.sizes, extra = _a.extra;
    return (__assign(__assign(__assign(__assign({ subtotal: subtotal.toString(), depositTotal: depositTotal.toString(), returnDate: returnDate !== null && returnDate !== void 0 ? returnDate : "", rentalDays: rentalDays.toString() }, (sizes ? { sizes: sizes } : {})), { customerId: customerId !== null && customerId !== void 0 ? customerId : "", discount: discount.toString(), coupon: coupon !== null && coupon !== void 0 ? coupon : "", currency: currency, taxRate: taxRate.toString(), taxAmount: taxAmount.toString() }), (clientIp ? { client_ip: clientIp } : {})), (extra !== null && extra !== void 0 ? extra : {})));
};
exports.buildCheckoutMetadata = buildCheckoutMetadata;
function createCheckoutSession(cart, options) {
    return __awaiter(this, void 0, void 0, function () {
        var mod;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require("@platform-core/checkout/session"); })];
                case 1:
                    mod = _a.sent();
                    return [2 /*return*/, mod.createCheckoutSession(cart, options)];
            }
        });
    });
}
