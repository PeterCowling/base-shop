"use strict";
// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx
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
exports.default = SettingsPage;
var options_1 = require("@cms/auth/options");
var shops_server_1 = require("@cms/actions/shops.server");
var lib_1 = require("@acme/lib");
var json_server_1 = require("@platform-core/repositories/json.server");
var next_auth_1 = require("next-auth");
var dynamic_1 = require("next/dynamic");
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
var HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
var HSL_RE = /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/;
function isColor(value) {
    return HEX_RE.test(value) || HSL_RE.test(value);
}
function swatchStyle(value) {
    return {
        backgroundColor: HSL_RE.test(value) ? "hsl(".concat(value, ")") : value,
    };
}
var ShopEditor = (0, dynamic_1.default)(function () { return Promise.resolve().then(function () { return require("./ShopEditor"); }); });
void ShopEditor;
var CurrencyTaxEditor = (0, dynamic_1.default)(function () { return Promise.resolve().then(function () { return require("./CurrencyTaxEditor"); }); });
void CurrencyTaxEditor;
exports.revalidate = 0;
function SettingsPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var shop, _c, session, settings, info, isAdmin, defaultTokens, overrides;
        var _d, _e, _f, _g;
        var params = _b.params;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    shop = (_h.sent()).shop;
                    return [4 /*yield*/, (0, lib_1.checkShopExists)(shop)];
                case 2:
                    if (!(_h.sent()))
                        return [2 /*return*/, (0, navigation_1.notFound)()];
                    return [4 /*yield*/, Promise.all([
                            (0, next_auth_1.getServerSession)(options_1.authOptions),
                            (0, json_server_1.readSettings)(shop),
                            (0, json_server_1.readShop)(shop),
                        ])];
                case 3:
                    _c = _h.sent(), session = _c[0], settings = _c[1], info = _c[2];
                    isAdmin = session
                        ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(session.user.role)
                        : false;
                    defaultTokens = (_d = info.themeDefaults) !== null && _d !== void 0 ? _d : {};
                    overrides = (_e = info.themeOverrides) !== null && _e !== void 0 ? _e : {};
                    return [2 /*return*/, (<div>
      <h2 className="mb-4 text-xl font-semibold">Settings – {shop}</h2>
      <p className="mb-4 text-sm">
        <link_1.default href={"/cms/shop/".concat(shop, "/settings/seo")} className="text-primary underline">
          SEO settings
        </link_1.default>
      </p>
      <p className="mb-4 text-sm">
        <link_1.default href={"/cms/shop/".concat(shop, "/settings/premier-delivery")} className="text-primary underline">
          Premier delivery settings
        </link_1.default>
      </p>
      <h3 className="mt-4 font-medium">Languages</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {settings.languages.map(function (l) { return (<li key={l}>{l.toUpperCase()}</li>); })}
      </ul>
      <h3 className="mt-4 font-medium">Theme</h3>
      <p className="mt-2 text-sm">{info.themeId}</p>
      <h3 className="mt-4 font-medium">Theme Tokens</h3>
      <div className="mt-2">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="text-left">Token</th>
              <th className="text-left">Values</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(defaultTokens).sort().map(function (k) {
                                var override = overrides[k];
                                var hasOverride = override !== undefined;
                                var changed = hasOverride && override !== defaultTokens[k];
                                return (<tr key={k} className={changed ? "bg-yellow-50" : undefined}>
                  <td className="pr-4 font-mono">{k}</td>
                  <td className="pr-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{defaultTokens[k]}</span>
                        {isColor(defaultTokens[k]) && (<span className="ml-1 inline-block h-4 w-4 rounded border align-middle" style={swatchStyle(defaultTokens[k])}/>)}
                        <span className="text-xs text-muted-foreground">default</span>
                      </div>
                      {hasOverride && (<div className="flex items-center gap-1">
                          <span className="font-mono">{override}</span>
                          {isColor(override) && (<span className="ml-1 inline-block h-4 w-4 rounded border align-middle" style={swatchStyle(override)}/>)}
                          <span className="text-xs text-muted-foreground">override</span>
                        </div>)}
                    </div>
                  </td>
                  <td className="pr-4">
                    {hasOverride && isAdmin && (<form action={shops_server_1.resetThemeOverride.bind(null, shop, k)}>
                        <button type="submit" className="text-xs text-primary underline">
                          Reset
                        </button>
                      </form>)}
                  </td>
                </tr>);
                            })}
          </tbody>
        </table>
        {Object.keys(overrides !== null && overrides !== void 0 ? overrides : {}).length === 0 && (<span className="text-muted-foreground text-xs">
            (using theme defaults)
          </span>)}
      </div>
      <h3 className="mt-4 font-medium">Catalog Filters</h3>
      <p className="mt-2 text-sm">{info.catalogFilters.join(", ")}</p>
      <h3 className="mt-4 font-medium">Filter Mappings</h3>
      <div className="mt-2 flex items-center gap-2">
        <pre className="rounded bg-gray-50 p-2 text-sm">
          {JSON.stringify(info.filterMappings, null, 2)}
        </pre>
        {Object.keys((_f = info.filterMappings) !== null && _f !== void 0 ? _f : {}).length === 0 && (<span className="text-muted-foreground text-xs">
            (using theme defaults)
          </span>)}
      </div>
      <h3 className="mt-4 font-medium">Currency / Tax</h3>
      <p className="mt-2 text-sm">
        {settings.currency} – {settings.taxRegion}
      </p>
      {isAdmin && (<div className="mt-6">
          <ShopEditor shop={shop} initial={info} initialTrackingProviders={(_g = settings.trackingProviders) !== null && _g !== void 0 ? _g : []}/>
          <div className="mt-6">
            <CurrencyTaxEditor shop={shop} initial={{ currency: settings.currency, taxRegion: settings.taxRegion }}/>
          </div>
        </div>)}
      {!isAdmin && (<p className="mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
          You are signed in as a <b>viewer</b>. Editing is disabled.
        </p>)}
    </div>)];
            }
        });
    });
}
