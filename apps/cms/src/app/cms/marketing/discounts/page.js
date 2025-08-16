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
exports.default = DiscountsPage;
var react_1 = require("react");
function DiscountsPage() {
    var _a = (0, react_1.useState)(""), code = _a[0], setCode = _a[1];
    var _b = (0, react_1.useState)(""), description = _b[0], setDescription = _b[1];
    var _c = (0, react_1.useState)(0), percent = _c[0], setPercent = _c[1];
    var _d = (0, react_1.useState)(null), status = _d[0], setStatus = _d[1];
    var _e = (0, react_1.useState)([]), discounts = _e[0], setDiscounts = _e[1];
    function load() {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, fetch("/api/marketing/discounts")];
                    case 1:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        _a = setDiscounts;
                        return [4 /*yield*/, res.json()];
                    case 2:
                        _a.apply(void 0, [_b.sent()]);
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    (0, react_1.useEffect)(function () {
        load();
    }, []);
    function create(e) {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        setStatus(null);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch("/api/marketing/discounts", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ code: code, description: description, discountPercent: percent }),
                            })];
                    case 2:
                        res = _b.sent();
                        setStatus(res.ok ? "Saved" : "Failed");
                        if (!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, load()];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        setStatus("Failed");
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function toggle(d) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/marketing/discounts", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ code: d.code, active: !d.active }),
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, load()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function remove(code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/marketing/discounts?code=".concat(encodeURIComponent(code)), {
                            method: "DELETE",
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, load()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="p-4 space-y-6">
      <form onSubmit={create} className="space-y-2">
        <input className="border p-2 w-full" placeholder="Code" value={code} onChange={function (e) { return setCode(e.target.value); }}/>
        <input className="border p-2 w-full" placeholder="Description" value={description} onChange={function (e) { return setDescription(e.target.value); }}/>
        <input type="number" className="border p-2 w-full" placeholder="Discount %" value={percent} onChange={function (e) { return setPercent(Number(e.target.value)); }}/>
        <button className="border px-4 py-2" type="submit">
          Create
        </button>
        {status && <p>{status}</p>}
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b p-2">Code</th>
            <th className="border-b p-2">Description</th>
            <th className="border-b p-2">Discount %</th>
            <th className="border-b p-2">Redemptions</th>
            <th className="border-b p-2">Status</th>
            <th className="border-b p-2"/>
          </tr>
        </thead>
        <tbody>
          {discounts.map(function (d) {
            var _a;
            return (<tr key={d.code} className="border-b">
              <td className="p-2 font-mono">{d.code}</td>
              <td className="p-2">{d.description}</td>
              <td className="p-2">{d.discountPercent}</td>
              <td className="p-2">{(_a = d.redemptions) !== null && _a !== void 0 ? _a : 0}</td>
              <td className="p-2">
                <button className="underline" type="button" onClick={function () { return toggle(d); }}>
                  {d.active === false ? "Inactive" : "Active"}
                </button>
              </td>
              <td className="p-2">
                <button className="text-red-600 underline" type="button" onClick={function () { return remove(d.code); }}>
                  Delete
                </button>
              </td>
            </tr>);
        })}
          {discounts.length === 0 && (<tr>
              <td className="p-2" colSpan={6}>
                No discounts.
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>);
}
