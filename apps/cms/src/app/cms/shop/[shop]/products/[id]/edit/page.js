"use strict";
// apps/cms/src/app/cms/shop/[shop]/products/[id]/edit/page.tsx
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
exports.default = ProductEditPage;
var json_server_1 = require("@platform-core/repositories/json.server");
var dynamic_1 = require("next/dynamic");
var navigation_1 = require("next/navigation");
/* ------------------------------------------------------------------ */
/*  Lazy-load wrapper (client component)                              */
/* ------------------------------------------------------------------ */
var ProductEditor = (0, dynamic_1.default)(function () { return Promise.resolve().then(function () { return require("./ProductEditor.client"); }); });
function ProductEditPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, shop, id, _d, product, settings;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    _c = _e.sent(), shop = _c.shop, id = _c.id;
                    return [4 /*yield*/, Promise.all([
                            (0, json_server_1.getProductById)(shop, id),
                            (0, json_server_1.readSettings)(shop),
                        ])];
                case 2:
                    _d = _e.sent(), product = _d[0], settings = _d[1];
                    if (!product)
                        return [2 /*return*/, (0, navigation_1.notFound)()];
                    return [2 /*return*/, (<>
      <h1 className="mb-6 text-2xl font-semibold">
        Edit product &ndash; {shop}/{id}
      </h1>
      <ProductEditor shop={shop} initialProduct={product} languages={__spreadArray([], settings.languages, true)}/>
    </>)];
            }
        });
    });
}
