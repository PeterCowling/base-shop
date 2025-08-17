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
exports.metadata = void 0;
exports.default = ReturnPolicyPage;
// apps/shop-abc/src/app/[lang]/returns/page.tsx
var returnLogistics_1 = require("@platform-core/returnLogistics");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var shop_json_1 = require("../../../shop.json");
exports.metadata = { title: "Return policy" };
function ReturnPolicyPage() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, cfg, info, settings;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        (0, returnLogistics_1.getReturnLogistics)(),
                        (0, returnLogistics_1.getReturnBagAndLabel)(),
                        (0, settings_server_1.getShopSettings)(shop_json_1.default.id),
                    ])];
                case 1:
                    _a = _d.sent(), cfg = _a[0], info = _a[1], settings = _a[2];
                    return [2 /*return*/, (<div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Return policy</h1>
      {((_b = settings.returnService) === null || _b === void 0 ? void 0 : _b.bagEnabled) && (<p>Please reuse the {info.bagType} bag for your return.</p>)}
      <p>Return labels provided by {info.labelService.toUpperCase()}.</p>
      {cfg.dropOffProvider && (<p>
          Drop-off: {cfg.dropOffProvider}
          {cfg.dropOffProvider.toLowerCase() === "ups" &&
                                    " – bring your package to any UPS drop-off location."}
        </p>)}
      <p>Available carriers: {info.returnCarrier.join(", ")}</p>
      {((_c = settings.returnService) === null || _c === void 0 ? void 0 : _c.homePickupEnabled) && (<p>
          Home pickup available in: {info.homePickupZipCodes.join(", ")}
        </p>)}
      <p>In-store returns {cfg.inStore ? "available" : "unavailable"}.</p>
      {typeof cfg.tracking !== "undefined" && (<p>
          Tracking {cfg.tracking ? "enabled" : "disabled"}
          {cfg.tracking && " and numbers provided with each label."}
        </p>)}
      {cfg.requireTags && <p>Items must have all tags attached for return.</p>}
      {!cfg.allowWear && <p>Items showing signs of wear may be rejected.</p>}
    </div>)];
            }
        });
    });
}
