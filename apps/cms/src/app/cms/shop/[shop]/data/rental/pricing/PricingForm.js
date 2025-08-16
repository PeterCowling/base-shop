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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PricingForm;
var shadcn_1 = require("@/components/atoms/shadcn");
var types_1 = require("@acme/types");
var react_1 = require("react");
function PricingForm(_a) {
    var _this = this;
    var shop = _a.shop, initial = _a.initial;
    var _b = (0, react_1.useState)(function () { return JSON.stringify(initial, null, 2); }), text = _b[0], setText = _b[1];
    var _c = (0, react_1.useState)("idle"), status = _c[0], setStatus = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var json, parsed, res, body, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    json = JSON.parse(text);
                    parsed = types_1.pricingSchema.safeParse(json);
                    if (!parsed.success) {
                        setStatus("error");
                        setError(parsed.error.issues.map(function (i) { return i.message; }).join(", "));
                        return [2 /*return*/];
                    }
                    setStatus("saved");
                    setError(null);
                    return [4 /*yield*/, fetch("/api/data/".concat(shop, "/rental/pricing"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(parsed.data),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    body = _a.sent();
                    setStatus("error");
                    setError(body.error || "Failed to save");
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    setStatus("error");
                    setError(err_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={onSubmit} className="space-y-4">
      <shadcn_1.Textarea value={text} onChange={function (e) { return setText(e.target.value); }} rows={10}/>
      {status === "saved" && (<p className="text-sm text-green-600">Saved!</p>)}
      {status === "error" && error && (<p className="text-sm text-red-600">{error}</p>)}
      <shadcn_1.Button type="submit">Save</shadcn_1.Button>
    </form>);
}
