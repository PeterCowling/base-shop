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
exports.default = MarketingPage;
var link_1 = require("next/link");
var listShops_1 = require("../listShops");
var analytics_server_1 = require("@platform-core/repositories/analytics.server");
function MarketingPage() {
    return __awaiter(this, void 0, void 0, function () {
        var shops, campaignsByShop, _i, shops_1, shop, events, campaigns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, listShops_1.listShops)()];
                case 1:
                    shops = _a.sent();
                    campaignsByShop = {};
                    _i = 0, shops_1 = shops;
                    _a.label = 2;
                case 2:
                    if (!(_i < shops_1.length)) return [3 /*break*/, 5];
                    shop = shops_1[_i];
                    return [4 /*yield*/, (0, analytics_server_1.listEvents)(shop)];
                case 3:
                    events = _a.sent();
                    campaigns = Array.from(new Set(events
                        .map(function (e) { return (typeof e.campaign === "string" ? e.campaign : null); })
                        .filter(Boolean)));
                    if (campaigns.length > 0)
                        campaignsByShop[shop] = campaigns;
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, (<div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Marketing Tools</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <link_1.default href="/cms/marketing/email">Email Campaign</link_1.default>
        </li>
        <li>
          <link_1.default href="/cms/marketing/discounts">Discount Codes</link_1.default>
        </li>
      </ul>
      {Object.keys(campaignsByShop).length > 0 && (<div className="space-y-2">
          <h3 className="text-lg font-semibold">Campaign Analytics</h3>
          {Object.entries(campaignsByShop).map(function (_a) {
                                var shop = _a[0], campaigns = _a[1];
                                return (<div key={shop}>
              <h4 className="font-medium">{shop}</h4>
              <ul className="list-disc pl-6">
                {campaigns.map(function (c) { return (<li key={c}>
                    <link_1.default href={"/cms/dashboard/".concat(shop, "?campaign=").concat(encodeURIComponent(c))} className="text-primary underline">
                      {c}
                    </link_1.default>
                  </li>); })}
              </ul>
            </div>);
                            })}
        </div>)}
    </div>)];
            }
        });
    });
}
