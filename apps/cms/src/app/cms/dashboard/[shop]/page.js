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
exports.default = ShopDashboard;
var analytics_server_1 = require("@platform-core/repositories/analytics.server");
var shops_server_1 = require("@platform-core/repositories/shops.server");
var ui_1 = require("@acme/ui");
var CampaignFilter_client_1 = require("./components/CampaignFilter.client");
var Charts_client_1 = require("./components/Charts.client");
var analytics_1 = require("@cms/lib/analytics");
function ShopDashboard(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var shop, _c, events, aggregates, shopData, domain, domainStatus, campaigns, selected, selectedCampaigns, content;
        var _d, _e;
        var params = _b.params, searchParams = _b.searchParams;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    shop = params.shop;
                    return [4 /*yield*/, Promise.all([
                            (0, analytics_server_1.listEvents)(shop),
                            (0, analytics_server_1.readAggregates)(shop),
                            (0, shops_server_1.readShop)(shop),
                        ])];
                case 1:
                    _c = _f.sent(), events = _c[0], aggregates = _c[1], shopData = _c[2];
                    domain = (_d = shopData.domain) === null || _d === void 0 ? void 0 : _d.name;
                    domainStatus = (_e = shopData.domain) === null || _e === void 0 ? void 0 : _e.status;
                    campaigns = Array.from(new Set(events
                        .map(function (e) { return (typeof e.campaign === "string" ? e.campaign : null); })
                        .filter(Boolean)));
                    selected = searchParams === null || searchParams === void 0 ? void 0 : searchParams.campaign;
                    selectedCampaigns = Array.isArray(selected)
                        ? selected
                        : selected
                            ? [selected]
                            : [];
                    content = selectedCampaigns.length === 0
                        ? (function () {
                            var metrics = (0, analytics_1.buildMetrics)(events, aggregates);
                            return (<>
              <Charts_client_1.Charts traffic={metrics.traffic} sales={metrics.sales} conversion={metrics.conversion} emailOpens={metrics.emailOpens} emailClicks={metrics.emailClicks} campaignSales={metrics.campaignSales} discountRedemptions={metrics.discountRedemptions} discountRedemptionsByCode={metrics.discountRedemptionsByCode} aiCrawl={metrics.aiCrawl}/>
              {metrics.topDiscountCodes.length > 0 && (<div className="mt-4">
                  <h3 className="mb-2 font-semibold">Top discount codes</h3>
                  <ul className="list-inside list-disc">
                    {metrics.topDiscountCodes.map(function (_a) {
                                        var code = _a[0], count = _a[1];
                                        return (<li key={code}>
                        {code}: {count}
                      </li>);
                                    })}
                  </ul>
                </div>)}
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">Progress</h3>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Email opens
                  </span>
                  <ui_1.Progress value={(metrics.totals.emailOpens / metrics.maxTotal) * 100} label={String(metrics.totals.emailOpens)}/>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Email clicks
                  </span>
                  <ui_1.Progress value={(metrics.totals.emailClicks / metrics.maxTotal) * 100} label={String(metrics.totals.emailClicks)}/>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Campaign sales
                  </span>
                  <ui_1.Progress value={(metrics.totals.campaignSales / metrics.maxTotal) * 100} label={String(metrics.totals.campaignSales)}/>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Discount redemptions
                  </span>
                  <ui_1.Progress value={(metrics.totals.discountRedemptions / metrics.maxTotal) *
                                    100} label={String(metrics.totals.discountRedemptions)}/>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    AI catalog requests
                  </span>
                  <ui_1.Progress value={(metrics.totals.aiCrawl / metrics.maxTotal) * 100} label={String(metrics.totals.aiCrawl)}/>
                </div>
              </div>
            </>);
                        })()
                        : selectedCampaigns.map(function (c) {
                            var metrics = (0, analytics_1.buildMetrics)(events.filter(function (e) { return e.campaign === c; }));
                            var totalTraffic = metrics.totals.emailClicks;
                            var totalRevenue = metrics.totals.campaignSales;
                            var conversionRate = totalTraffic > 0
                                ? (metrics.totals.campaignSaleCount / totalTraffic) * 100
                                : 0;
                            return (<div key={c} className="mb-8">
              <h3 className="text-lg font-semibold">Campaign: {c}</h3>
              <p className="mb-2 text-sm">
                Traffic: {totalTraffic} • Revenue: {totalRevenue.toFixed(2)} •
                Conversion: {conversionRate.toFixed(2)}%
              </p>
              <Charts_client_1.Charts traffic={metrics.traffic} sales={metrics.sales} conversion={metrics.conversion} emailOpens={metrics.emailOpens} emailClicks={metrics.emailClicks} campaignSales={metrics.campaignSales} discountRedemptions={metrics.discountRedemptions} discountRedemptionsByCode={metrics.discountRedemptionsByCode} aiCrawl={metrics.aiCrawl}/>
            </div>);
                        });
                    return [2 /*return*/, (<div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      {domain && (<p className="mb-2 text-sm text-gray-600">
          Domain: {domain} {domainStatus ? "(".concat(domainStatus, ")") : ""}
        </p>)}
      {campaigns.length > 0 && <CampaignFilter_client_1.CampaignFilter campaigns={campaigns}/>}
      {content}
    </div>)];
            }
        });
    });
}
