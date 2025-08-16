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
exports.default = InventoryForm;
var shadcn_1 = require("@/components/atoms/shadcn");
var types_1 = require("@acme/types");
var inventory_1 = require("@platform-core/utils/inventory");
var react_1 = require("react");
function InventoryForm(_a) {
    var _this = this;
    var shop = _a.shop, initial = _a.initial;
    var _b = (0, react_1.useState)(function () { return initial; }), items = _b[0], setItems = _b[1];
    var _c = (0, react_1.useState)(function () {
        var set = new Set();
        initial.forEach(function (i) { var _a; return Object.keys((_a = i.variantAttributes) !== null && _a !== void 0 ? _a : {}).forEach(function (k) { return set.add(k); }); });
        return Array.from(set);
    }), attributes = _c[0], setAttributes = _c[1];
    var _d = (0, react_1.useState)("idle"), status = _d[0], setStatus = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var fileInput = (0, react_1.useRef)(null);
    var updateItem = function (index, field, value) {
        setItems(function (prev) {
            var _a;
            var next = __spreadArray([], prev, true);
            var item = __assign({}, next[index]);
            if (field.startsWith("variantAttributes.")) {
                var key = field.split(".")[1];
                item.variantAttributes = __assign(__assign({}, item.variantAttributes), (_a = {}, _a[key] = value, _a));
            }
            else if (field === "quantity") {
                item.quantity = Number(value);
            }
            else if (field === "lowStockThreshold") {
                item.lowStockThreshold = value === "" ? undefined : Number(value);
            }
            else if (field === "sku") {
                item.sku = value;
                item.productId = value;
            }
            else {
                // other top-level fields
                // @ts-expect-error
                item[field] = value;
            }
            next[index] = item;
            return next;
        });
    };
    var addRow = function () {
        setItems(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
            {
                sku: "",
                productId: "",
                variantAttributes: Object.fromEntries(attributes.map(function (a) { return [a, ""]; })),
                quantity: 0,
                lowStockThreshold: undefined,
            },
        ], false); });
    };
    var addAttribute = function () {
        var _a;
        var name = (_a = prompt("Attribute name")) === null || _a === void 0 ? void 0 : _a.trim();
        if (!name || attributes.includes(name))
            return;
        setAttributes(function (prev) { return __spreadArray(__spreadArray([], prev, true), [name], false); });
        setItems(function (prev) {
            return prev.map(function (i) {
                var _a;
                return (__assign(__assign({}, i), { variantAttributes: __assign(__assign({}, i.variantAttributes), (_a = {}, _a[name] = "", _a)) }));
            });
        });
    };
    var deleteAttribute = function (attr) {
        setAttributes(function (prev) { return prev.filter(function (a) { return a !== attr; }); });
        setItems(function (prev) {
            return prev.map(function (i) {
                var _a = i.variantAttributes, _b = attr, _ = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
                return __assign(__assign({}, i), { variantAttributes: rest });
            });
        });
    };
    var deleteRow = function (idx) {
        setItems(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
    };
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var normalized, parsed, res, body, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    normalized = items.map(function (i) { return (0, inventory_1.expandInventoryItem)(i); });
                    parsed = types_1.inventoryItemSchema.array().safeParse(normalized);
                    if (!parsed.success) {
                        setStatus("error");
                        setError(parsed.error.issues.map(function (i) { return i.message; }).join(", "));
                        return [2 /*return*/];
                    }
                    setStatus("saved");
                    setError(null);
                    return [4 /*yield*/, fetch("/api/data/".concat(shop, "/inventory"), {
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
    var onImport = function () {
        var _a;
        (_a = fileInput.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var onFile = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var file, data, res, body_1, err_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return [2 /*return*/];
                    data = new FormData();
                    data.set("file", file);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/data/".concat(shop, "/inventory/import"), {
                            method: "POST",
                            body: data,
                        })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    body_1 = _b.sent();
                    if (!res.ok) {
                        throw new Error(body_1.error || "Failed to import");
                    }
                    setItems(body_1.items);
                    setAttributes(function () {
                        var set = new Set();
                        body_1.items.forEach(function (i) {
                            return Object.keys(i.variantAttributes).forEach(function (k) { return set.add(k); });
                        });
                        return Array.from(set);
                    });
                    setStatus("saved");
                    setError(null);
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _b.sent();
                    setStatus("error");
                    setError(err_2.message);
                    return [3 /*break*/, 6];
                case 5:
                    if (fileInput.current)
                        fileInput.current.value = "";
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var onExport = function (format) { return __awaiter(_this, void 0, void 0, function () {
        var res, blob, url, a, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/data/".concat(shop, "/inventory/export?format=").concat(format))];
                case 1:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("Failed to export");
                    }
                    return [4 /*yield*/, res.blob()];
                case 2:
                    blob = _a.sent();
                    url = URL.createObjectURL(blob);
                    a = document.createElement("a");
                    a.href = url;
                    a.download = format === "json" ? "inventory.json" : "inventory.csv";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    setStatus("error");
                    setError(err_3.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={onSubmit} className="space-y-4">
      <shadcn_1.Table>
        <shadcn_1.TableHeader>
          <shadcn_1.TableRow>
            <shadcn_1.TableHead>SKU</shadcn_1.TableHead>
            {attributes.map(function (attr) { return (<shadcn_1.TableHead key={attr}>
                {attr}
                <shadcn_1.Button type="button" onClick={function () { return deleteAttribute(attr); }} aria-label={"delete-attr-".concat(attr)}>
                  Delete
                </shadcn_1.Button>
              </shadcn_1.TableHead>); })}
            <shadcn_1.TableHead>Quantity</shadcn_1.TableHead>
            <shadcn_1.TableHead>Low stock threshold</shadcn_1.TableHead>
            <shadcn_1.TableHead></shadcn_1.TableHead>
          </shadcn_1.TableRow>
        </shadcn_1.TableHeader>
        <shadcn_1.TableBody>
          {items.map(function (item, idx) {
            var _a;
            return (<shadcn_1.TableRow key={idx}>
              <shadcn_1.TableCell>
                <shadcn_1.Input value={item.sku} onChange={function (e) { return updateItem(idx, "sku", e.target.value); }}/>
              </shadcn_1.TableCell>
              {attributes.map(function (attr) {
                    var _a;
                    return (<shadcn_1.TableCell key={attr}>
                  <shadcn_1.Input value={(_a = item.variantAttributes[attr]) !== null && _a !== void 0 ? _a : ""} onChange={function (e) {
                            return updateItem(idx, "variantAttributes.".concat(attr), e.target.value);
                        }}/>
                </shadcn_1.TableCell>);
                })}
              <shadcn_1.TableCell>
                <shadcn_1.Input type="number" min={0} value={item.quantity} onChange={function (e) { return updateItem(idx, "quantity", e.target.value); }}/>
              </shadcn_1.TableCell>
              <shadcn_1.TableCell>
                <shadcn_1.Input type="number" min={0} value={(_a = item.lowStockThreshold) !== null && _a !== void 0 ? _a : ""} onChange={function (e) {
                    return updateItem(idx, "lowStockThreshold", e.target.value);
                }}/>
              </shadcn_1.TableCell>
              <shadcn_1.TableCell>
                <shadcn_1.Button type="button" onClick={function () { return deleteRow(idx); }} aria-label="delete-row">
                  Delete
                </shadcn_1.Button>
              </shadcn_1.TableCell>
            </shadcn_1.TableRow>);
        })}
        </shadcn_1.TableBody>
      </shadcn_1.Table>
      <shadcn_1.Button type="button" onClick={addRow}>
        Add row
      </shadcn_1.Button>
      <shadcn_1.Button type="button" onClick={addAttribute}>
        Add attribute
      </shadcn_1.Button>
      {status === "saved" && (<p className="text-sm text-green-600">Saved!</p>)}
      {status === "error" && error && (<p className="text-sm text-red-600">{error}</p>)}
      <div className="space-x-2">
        <shadcn_1.Button type="submit">Save</shadcn_1.Button>
        <shadcn_1.Button type="button" onClick={onImport}>
          Import JSON/CSV
        </shadcn_1.Button>
        <shadcn_1.Button type="button" onClick={function () { return onExport("json"); }}>
          Export JSON
        </shadcn_1.Button>
        <shadcn_1.Button type="button" onClick={function () { return onExport("csv"); }}>
          Export CSV
        </shadcn_1.Button>
      </div>
      <input ref={fileInput} type="file" accept=".json,.csv" className="hidden" onChange={onFile}/>
    </form>);
}
