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
exports.default = EditPreviewPage;
var react_1 = require("react");
var ComponentPreview_1 = require("@ui/src/components/ComponentPreview");
var exampleProps = {
    Breadcrumbs: {
        items: [
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
        ],
    },
};
function EditPreviewPage() {
    var _a = (0, react_1.useState)([]), changes = _a[0], setChanges = _a[1];
    var _b = (0, react_1.useState)(false), publishing = _b[0], setPublishing = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var _d = (0, react_1.useState)([]), links = _d[0], setLinks = _d[1];
    (0, react_1.useEffect)(function () {
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var res, data, pageLinks, err_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            return [4 /*yield*/, fetch("/api/edit-changes")];
                        case 1:
                            res = _a.sent();
                            return [4 /*yield*/, res.json()];
                        case 2:
                            data = (_a.sent());
                            setChanges(data.components);
                            if (!Array.isArray(data.pages)) return [3 /*break*/, 4];
                            return [4 /*yield*/, Promise.all(data.pages.map(function (id) { return __awaiter(_this, void 0, void 0, function () {
                                    var r, token, _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _b.trys.push([0, 3, , 4]);
                                                return [4 /*yield*/, fetch("/api/preview-token?pageId=".concat(encodeURIComponent(id)))];
                                            case 1:
                                                r = _b.sent();
                                                if (!r.ok)
                                                    return [2 /*return*/, null];
                                                return [4 /*yield*/, r.json()];
                                            case 2:
                                                token = (_b.sent()).token;
                                                return [2 /*return*/, { id: id, url: "/preview/".concat(id, "?upgrade=").concat(token) }];
                                            case 3:
                                                _a = _b.sent();
                                                return [2 /*return*/, null];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 3:
                            pageLinks = (_a.sent()).filter(Boolean);
                            setLinks(pageLinks);
                            _a.label = 4;
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            err_1 = _a.sent();
                            console.error("Failed to load edit changes", err_1);
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        void load();
    }, []);
    function handlePublish() {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setPublishing(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, fetch("/api/publish", { method: "POST" })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                    case 3:
                        data = _a.sent();
                        throw new Error(data.error || "Publish failed");
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        err_2 = _a.sent();
                        console.error("Publish failed", err_2);
                        setError(err_2 instanceof Error ? err_2.message : "Publish failed");
                        return [3 /*break*/, 7];
                    case 6:
                        setPublishing(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="space-y-8">
      <ul className="space-y-4">
        {changes.map(function (c) {
            var _a;
            return (<li key={c.file}>
            <ComponentPreview_1.default component={c} componentProps={(_a = exampleProps[c.componentName]) !== null && _a !== void 0 ? _a : {}}/>
          </li>);
        })}
      </ul>
      {links.length > 0 && (<div className="space-y-2">
          <h2 className="font-semibold">Preview pages</h2>
          <ul className="list-disc pl-4">
            {links.map(function (l) { return (<li key={l.id}>
                <a href={l.url} className="text-blue-600 underline">{"/preview/".concat(l.id)}</a>
              </li>); })}
          </ul>
        </div>)}
      <button type="button" onClick={handlePublish} className="rounded border px-4 py-2" disabled={publishing}>
        {publishing ? "Publishing..." : "Approve & publish"}
      </button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>);
}
