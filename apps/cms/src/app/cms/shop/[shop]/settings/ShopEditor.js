// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx
"use client";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ShopEditor;
var shadcn_1 = require("@/components/atoms/shadcn");
var shops_server_1 = require("@cms/actions/shops.server");
var schemas_1 = require("@cms/actions/schemas");
var react_1 = require("react");
function ShopEditor(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f;
    var shop = _a.shop, initial = _a.initial, initialTrackingProviders = _a.initialTrackingProviders;
    var _g = (0, react_1.useState)(initial), info = _g[0], setInfo = _g[1];
    var _h = (0, react_1.useState)(initialTrackingProviders), trackingProviders = _h[0], setTrackingProviders = _h[1];
    var _j = (0, react_1.useState)(false), saving = _j[0], setSaving = _j[1];
    var _k = (0, react_1.useState)({}), errors = _k[0], setErrors = _k[1];
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setInfo(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    var handleFilters = function (e) {
        setInfo(function (prev) { return (__assign(__assign({}, prev), { catalogFilters: e.target.value.split(/,\s*/) })); });
    };
    var handleMappings = function (e) {
        var value = e.target.value;
        try {
            var parsed_1 = JSON.parse(value);
            setInfo(function (prev) { return (__assign(__assign({}, prev), { filterMappings: parsed_1 })); });
            setErrors(function (prev) {
                var filterMappings = prev.filterMappings, rest = __rest(prev, ["filterMappings"]);
                return rest;
            });
        }
        catch (_a) {
            setErrors(function (prev) { return (__assign(__assign({}, prev), { filterMappings: ["Invalid JSON"] })); });
        }
    };
    var handlePriceOverrides = function (e) {
        var value = e.target.value;
        try {
            var parsed_2 = JSON.parse(value);
            setInfo(function (prev) { return (__assign(__assign({}, prev), { priceOverrides: parsed_2 })); });
            setErrors(function (prev) {
                var priceOverrides = prev.priceOverrides, rest = __rest(prev, ["priceOverrides"]);
                return rest;
            });
        }
        catch (_a) {
            setErrors(function (prev) { return (__assign(__assign({}, prev), { priceOverrides: ["Invalid JSON"] })); });
        }
    };
    var handleLocaleOverrides = function (e) {
        var value = e.target.value;
        try {
            var parsed_3 = JSON.parse(value);
            setInfo(function (prev) { return (__assign(__assign({}, prev), { localeOverrides: parsed_3 })); });
            setErrors(function (prev) {
                var localeOverrides = prev.localeOverrides, rest = __rest(prev, ["localeOverrides"]);
                return rest;
            });
        }
        catch (_a) {
            setErrors(function (prev) { return (__assign(__assign({}, prev), { localeOverrides: ["Invalid JSON"] })); });
        }
    };
    var handleTracking = function (e) {
        var selected = Array.from(e.target.selectedOptions).map(function (o) { return o.value; });
        setTrackingProviders(selected);
    };
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var fd, data, parsed, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    fd = new FormData(e.currentTarget);
                    data = Object.fromEntries(fd.entries());
                    parsed = schemas_1.shopSchema.safeParse(__assign(__assign({}, data), { trackingProviders: fd.getAll("trackingProviders") }));
                    if (!parsed.success) {
                        setErrors(parsed.error.flatten().fieldErrors);
                        setSaving(false);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, shops_server_1.updateShop)(shop, fd)];
                case 1:
                    result = _a.sent();
                    if (result.errors) {
                        setErrors(result.errors);
                    }
                    else if (result.shop) {
                        setInfo(result.shop);
                        setTrackingProviders(fd.getAll("trackingProviders"));
                        setErrors({});
                    }
                    setSaving(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={onSubmit} className="@container grid max-w-md gap-4 @sm:grid-cols-2">
      <shadcn_1.Input type="hidden" name="id" value={info.id}/>
      <label className="flex flex-col gap-1">
        <span>Name</span>
        <shadcn_1.Input className="border p-2" name="name" value={info.name} onChange={handleChange}/>
        {errors.name && (<span className="text-sm text-red-600">{errors.name.join("; ")}</span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <shadcn_1.Input className="border p-2" name="themeId" value={info.themeId} onChange={handleChange}/>
        {errors.themeId && (<span className="text-sm text-red-600">
            {errors.themeId.join("; ")}
          </span>)}
      </label>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <shadcn_1.Checkbox name="enableEditorial" checked={(_b = info.enableEditorial) !== null && _b !== void 0 ? _b : false} onCheckedChange={function (v) {
            return setInfo(function (prev) { return (__assign(__assign({}, prev), { enableEditorial: Boolean(v) })); });
        }}/>
          <span>Enable blog</span>
        </label>
        {errors.enableEditorial && (<span className="text-sm text-red-600">
            {errors.enableEditorial.join("; ")}
          </span>)}
      </div>
      <fieldset className="col-span-2 flex flex-col gap-1">
        <legend className="text-sm font-medium">Luxury features</legend>
        <div className="mt-2 grid gap-2">
          <label className="flex items-center gap-2">
            <shadcn_1.Checkbox name="contentMerchandising" checked={info.luxuryFeatures.contentMerchandising} onCheckedChange={function (v) {
            return setInfo(function (prev) { return (__assign(__assign({}, prev), { luxuryFeatures: __assign(__assign({}, prev.luxuryFeatures), { contentMerchandising: Boolean(v) }) })); });
        }}/>
            <span>Content merchandising</span>
          </label>
          <label className="flex items-center gap-2">
            <shadcn_1.Checkbox name="raTicketing" checked={info.luxuryFeatures.raTicketing} onCheckedChange={function (v) {
            return setInfo(function (prev) { return (__assign(__assign({}, prev), { luxuryFeatures: __assign(__assign({}, prev.luxuryFeatures), { raTicketing: Boolean(v) }) })); });
        }}/>
            <span>RA ticketing</span>
          </label>
          <label className="flex items-center gap-2">
            <shadcn_1.Checkbox name="fraudReview" checked={info.luxuryFeatures.fraudReview} onCheckedChange={function (v) {
            return setInfo(function (prev) { return (__assign(__assign({}, prev), { luxuryFeatures: __assign(__assign({}, prev.luxuryFeatures), { fraudReview: Boolean(v) }) })); });
        }}/>
            <span>Fraud review</span>
          </label>
          <label className="flex items-center gap-2">
            <shadcn_1.Checkbox name="strictReturnConditions" checked={info.luxuryFeatures.strictReturnConditions} onCheckedChange={function (v) {
            return setInfo(function (prev) { return (__assign(__assign({}, prev), { luxuryFeatures: __assign(__assign({}, prev.luxuryFeatures), { strictReturnConditions: Boolean(v) }) })); });
        }}/>
            <span>Strict return conditions</span>
          </label>
        </div>
      </fieldset>
      <label className="flex flex-col gap-1">
        <span>Catalog Filters (comma separated)</span>
        <shadcn_1.Input className="border p-2" name="catalogFilters" value={info.catalogFilters.join(",")} onChange={handleFilters}/>
        {errors.catalogFilters && (<span className="text-sm text-red-600">
            {errors.catalogFilters.join("; ")}
          </span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tracking Providers</span>
        <select multiple name="trackingProviders" value={trackingProviders} onChange={handleTracking} className="border p-2">
          <option value="ups">UPS</option>
          <option value="dhl">DHL</option>
        </select>
        {errors.trackingProviders && (<span className="text-sm text-red-600">
            {errors.trackingProviders.join("; ")}
          </span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme Defaults (JSON)</span>
        <shadcn_1.Textarea name="themeDefaults" defaultValue={JSON.stringify((_c = info.themeDefaults) !== null && _c !== void 0 ? _c : {}, null, 2)} readOnly rows={4}/>
        {errors.themeDefaults && (<span className="text-sm text-red-600">
            {errors.themeDefaults.join("; ")}
          </span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme Overrides (JSON)</span>
        <shadcn_1.Textarea name="themeOverrides" defaultValue={JSON.stringify((_d = info.themeOverrides) !== null && _d !== void 0 ? _d : {}, null, 2)} readOnly rows={4}/>
        {errors.themeOverrides && (<span className="text-sm text-red-600">
            {errors.themeOverrides.join("; ")}
          </span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Filter Mappings (JSON)</span>
        <shadcn_1.Textarea name="filterMappings" defaultValue={JSON.stringify(info.filterMappings, null, 2)} onChange={handleMappings} rows={4}/>
        {errors.filterMappings && (<span className="text-sm text-red-600">
            {errors.filterMappings.join("; ")}
          </span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Price Overrides (JSON)</span>
        <shadcn_1.Textarea name="priceOverrides" defaultValue={JSON.stringify((_e = info.priceOverrides) !== null && _e !== void 0 ? _e : {}, null, 2)} onChange={handlePriceOverrides} rows={4}/>
        {errors.priceOverrides && (<span className="text-sm text-red-600">
            {errors.priceOverrides.join("; ")}
          </span>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Locale Overrides (JSON)</span>
        <shadcn_1.Textarea name="localeOverrides" defaultValue={JSON.stringify((_f = info.localeOverrides) !== null && _f !== void 0 ? _f : {}, null, 2)} onChange={handleLocaleOverrides} rows={4}/>
        {errors.localeOverrides && (<span className="text-sm text-red-600">
            {errors.localeOverrides.join("; ")}
          </span>)}
      </label>
      <shadcn_1.Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </shadcn_1.Button>
    </form>);
}
