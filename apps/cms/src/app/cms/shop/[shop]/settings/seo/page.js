"use strict";
// apps/cms/src/app/cms/shop/[shop]/settings/seo/page.tsx
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
exports.revalidate = void 0;
exports.default = SeoSettingsPage;
var shops_server_1 = require("@cms/actions/shops.server");
var analytics_server_1 = require("@platform-core/repositories/analytics.server");
var dynamic_1 = require("next/dynamic");
var SeoProgressPanel_1 = require("./SeoProgressPanel");
var AiCatalogSettings_1 = require("./AiCatalogSettings");
var AiFeedPanel_1 = require("./AiFeedPanel");
var SeoEditor = (0, dynamic_1.default)(function () { return Promise.resolve().then(function () { return require("./SeoEditor"); }); });
var SeoAuditPanel = (0, dynamic_1.default)(function () { return Promise.resolve().then(function () { return require("./SeoAuditPanel"); }); });
void SeoEditor;
void SeoAuditPanel;
exports.revalidate = 0;
function SeoSettingsPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var shop, _c, settings, events, languages, seo, freeze, ai, lastCrawl;
        var _d, _e, _f;
        var params = _b.params;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    shop = (_g.sent()).shop;
                    return [4 /*yield*/, Promise.all([
                            (0, shops_server_1.getSettings)(shop),
                            (0, analytics_server_1.listEvents)(shop),
                        ])];
                case 2:
                    _c = _g.sent(), settings = _c[0], events = _c[1];
                    languages = settings.languages;
                    seo = (_d = settings.seo) !== null && _d !== void 0 ? _d : {};
                    freeze = (_e = settings.freezeTranslations) !== null && _e !== void 0 ? _e : false;
                    ai = (_f = seo.aiCatalog) !== null && _f !== void 0 ? _f : {
                        enabled: false,
                        fields: ["id", "title", "description", "price", "media"],
                        pageSize: 50,
                    };
                    lastCrawl = events
                        .filter(function (e) { return e.type === "ai_crawl"; })
                        .map(function (e) { return e.timestamp; })
                        .filter(Boolean)
                        .sort()
                        .pop();
                    return [2 /*return*/, (<div className="space-y-6">
      <h2 className="text-xl font-semibold">SEO – {shop}</h2>
      <SeoProgressPanel_1.default shop={shop}/>
      <SeoEditor shop={shop} languages={languages} initialSeo={seo} initialFreeze={freeze}/>
      <AiCatalogSettings_1.default shop={shop} initial={{
                                enabled: ai.enabled,
                                fields: ai.fields,
                                pageSize: ai.pageSize,
                                lastCrawl: lastCrawl,
                            }}/>
      <AiFeedPanel_1.default shop={shop}/>
      <SeoAuditPanel shop={shop}/>
    </div>)];
            }
        });
    });
}
