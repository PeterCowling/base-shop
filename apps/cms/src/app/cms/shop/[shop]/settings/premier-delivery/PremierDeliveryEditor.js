"use client";
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
exports.default = PremierDeliveryEditor;
var shadcn_1 = require("@/components/atoms/shadcn");
var shops_server_1 = require("@cms/actions/shops.server");
var react_1 = require("react");
function PremierDeliveryEditor(_a) {
    var _this = this;
    var shop = _a.shop, initial = _a.initial;
    var _b = (0, react_1.useState)(false), saving = _b[0], setSaving = _b[1];
    var _c = (0, react_1.useState)({}), errors = _c[0], setErrors = _c[1];
    var _d = (0, react_1.useState)(initial.regions.length ? initial.regions : [""]), regions = _d[0], setRegions = _d[1];
    var _e = (0, react_1.useState)(initial.windows.length ? initial.windows : [""]), windows = _e[0], setWindows = _e[1];
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var fd, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    fd = new FormData(e.currentTarget);
                    return [4 /*yield*/, (0, shops_server_1.updatePremierDelivery)(shop, fd)];
                case 1:
                    result = _a.sent();
                    if (result.errors) {
                        setErrors(result.errors);
                    }
                    else {
                        setErrors({});
                    }
                    setSaving(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var updateRegion = function (index, value) {
        setRegions(function (prev) {
            var next = __spreadArray([], prev, true);
            next[index] = value;
            return next;
        });
    };
    var updateWindow = function (index, value) {
        setWindows(function (prev) {
            var next = __spreadArray([], prev, true);
            next[index] = value;
            return next;
        });
    };
    var addRegion = function () { return setRegions(function (prev) { return __spreadArray(__spreadArray([], prev, true), [""], false); }); };
    var removeRegion = function (index) {
        return setRegions(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var addWindow = function () { return setWindows(function (prev) { return __spreadArray(__spreadArray([], prev, true), [""], false); }); };
    var removeWindow = function (index) {
        return setWindows(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    return (<form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Regions</legend>
        {regions.map(function (region, i) { return (<div key={i} className="flex items-center gap-2">
            <shadcn_1.Input name="regions" value={region} onChange={function (e) { return updateRegion(i, e.target.value); }}/>
            <shadcn_1.Button type="button" variant="outline" onClick={function () { return removeRegion(i); }}>
              Remove
            </shadcn_1.Button>
          </div>); })}
        <shadcn_1.Button type="button" variant="secondary" onClick={addRegion}>
          Add region
        </shadcn_1.Button>
        {errors.regions && (<span className="text-sm text-red-600">{errors.regions.join("; ")}</span>)}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">One-hour Windows</legend>
        {windows.map(function (window, i) { return (<div key={i} className="flex items-center gap-2">
            <shadcn_1.Input name="windows" value={window} onChange={function (e) { return updateWindow(i, e.target.value); }}/>
            <shadcn_1.Button type="button" variant="outline" onClick={function () { return removeWindow(i); }}>
              Remove
            </shadcn_1.Button>
          </div>); })}
        <shadcn_1.Button type="button" variant="secondary" onClick={addWindow}>
          Add window
        </shadcn_1.Button>
        {errors.windows && (<span className="text-sm text-red-600">{errors.windows.join("; ")}</span>)}
      </fieldset>
      <shadcn_1.Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </shadcn_1.Button>
    </form>);
}
