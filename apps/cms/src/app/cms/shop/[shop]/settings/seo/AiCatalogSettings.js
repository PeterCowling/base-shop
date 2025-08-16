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
exports.default = AiCatalogSettings;
var shadcn_1 = require("@/components/atoms/shadcn");
var shops_server_1 = require("@cms/actions/shops.server");
var react_1 = require("react");
var ALL_FIELDS = [
    "id",
    "title",
    "description",
    "price",
    "media",
];
function AiCatalogSettings(_a) {
    var _this = this;
    var shop = _a.shop, initial = _a.initial;
    var _b = (0, react_1.useState)(initial), state = _b[0], setState = _b[1];
    var _c = (0, react_1.useState)(false), saving = _c[0], setSaving = _c[1];
    var _d = (0, react_1.useState)({}), errors = _d[0], setErrors = _d[1];
    var toggleField = function (field) {
        setState(function (s) { return (__assign(__assign({}, s), { fields: s.fields.includes(field)
                ? s.fields.filter(function (f) { return f !== field; })
                : __spreadArray(__spreadArray([], s.fields, true), [field], false) })); });
    };
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var fd, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    fd = new FormData(e.currentTarget);
                    return [4 /*yield*/, (0, shops_server_1.updateAiCatalog)(shop, fd)];
                case 1:
                    result = _c.sent();
                    if (result.errors) {
                        setErrors(result.errors);
                    }
                    else if ((_b = (_a = result.settings) === null || _a === void 0 ? void 0 : _a.seo) === null || _b === void 0 ? void 0 : _b.aiCatalog) {
                        setState(function (s) { return (__assign(__assign({}, s), { enabled: result.settings.seo.aiCatalog.enabled, fields: result.settings.seo.aiCatalog.fields, pageSize: result.settings.seo.aiCatalog.pageSize })); });
                        setErrors({});
                    }
                    setSaving(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex items-center gap-2">
        <shadcn_1.Checkbox name="enabled" checked={state.enabled} onCheckedChange={function (v) { return setState(function (s) { return (__assign(__assign({}, s), { enabled: Boolean(v) })); }); }}/>
        <span>Enable AI catalog feed</span>
      </label>
      <div className="flex flex-col gap-2">
        <span>Fields</span>
        {ALL_FIELDS.map(function (f) { return (<label key={f} className="flex items-center gap-2">
            <shadcn_1.Checkbox name="fields" value={f} checked={state.fields.includes(f)} onCheckedChange={function () { return toggleField(f); }}/>
            <span>{f}</span>
          </label>); })}
        {errors.fields && (<span className="text-sm text-red-600">{errors.fields.join("; ")}</span>)}
      </div>
      <label className="flex flex-col gap-1">
        <span>Page size</span>
        <shadcn_1.Input type="number" name="pageSize" value={state.pageSize} onChange={function (e) {
            return setState(function (s) { return (__assign(__assign({}, s), { pageSize: Number(e.target.value) })); });
        }}/>
        {errors.pageSize && (<span className="text-sm text-red-600">
            {errors.pageSize.join("; ")}
          </span>)}
      </label>
      {state.lastCrawl && (<p className="text-sm text-gray-600">
          Last crawl: {new Date(state.lastCrawl).toLocaleString()}
        </p>)}
      <shadcn_1.Button className="bg-primary text-white" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </shadcn_1.Button>
    </form>);
}
