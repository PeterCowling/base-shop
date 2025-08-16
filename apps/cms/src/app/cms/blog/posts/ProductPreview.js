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
exports.default = ProductPreview;
var react_1 = require("react");
function ProductPreview(_a) {
    var _b, _c;
    var slug = _a.slug, onValidChange = _a.onValidChange;
    var _d = (0, react_1.useState)(null), product = _d[0], setProduct = _d[1];
    var _e = (0, react_1.useState)(true), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)(null), error = _f[0], setError = _f[1];
    (0, react_1.useEffect)(function () {
        var active = true;
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var res, data, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            setLoading(true);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, 5, 6]);
                            return [4 /*yield*/, fetch("/api/products?slug=".concat(encodeURIComponent(slug)))];
                        case 2:
                            res = _b.sent();
                            if (!res.ok)
                                throw new Error("Failed to load product");
                            return [4 /*yield*/, res.json()];
                        case 3:
                            data = _b.sent();
                            if (active) {
                                setProduct(data);
                                setError(null);
                                onValidChange === null || onValidChange === void 0 ? void 0 : onValidChange(true);
                            }
                            return [3 /*break*/, 6];
                        case 4:
                            _a = _b.sent();
                            if (active) {
                                setError("Failed to load product");
                                onValidChange === null || onValidChange === void 0 ? void 0 : onValidChange(false);
                            }
                            return [3 /*break*/, 6];
                        case 5:
                            if (active)
                                setLoading(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        load();
        return function () {
            active = false;
            onValidChange === null || onValidChange === void 0 ? void 0 : onValidChange(true);
        };
    }, [slug, onValidChange]);
    if (loading)
        return <div className="border p-2">Loading…</div>;
    if (error || !product)
        return <div className="border p-2 text-red-500">{error !== null && error !== void 0 ? error : "Not found"}</div>;
    var available = ((_b = product.stock) !== null && _b !== void 0 ? _b : 0) > 0;
    return (<div className="flex gap-2 border p-2">
      {((_c = product.media) === null || _c === void 0 ? void 0 : _c[0]) && (<img src={product.media[0].url} alt={product.title} className="h-16 w-16 object-cover"/>)}
      <div className="space-y-1">
        <div className="font-semibold">{product.title}</div>
        <div>{(product.price / 100).toFixed(2)}</div>
        <div className="text-sm">
          {available ? "In stock" : "Out of stock"}
        </div>
      </div>
    </div>);
}
