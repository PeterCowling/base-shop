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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepProductPage;
var shadcn_1 = require("@/components/atoms/shadcn");
var ProductPageBuilder_1 = require("@/components/cms/ProductPageBuilder");
var fillLocales_1 = require("@i18n/fillLocales");
var types_1 = require("@acme/types");
var api_1 = require("../lib/api");
var ulid_1 = require("ulid");
var react_1 = require("react");
var atoms_1 = require("@/components/atoms");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
function StepProductPage(_a) {
    var _this = this;
    var pageTemplates = _a.pageTemplates, productLayout = _a.productLayout, setProductLayout = _a.setProductLayout, productComponents = _a.productComponents, setProductComponents = _a.setProductComponents, productPageId = _a.productPageId, setProductPageId = _a.setProductPageId, shopId = _a.shopId, themeStyle = _a.themeStyle;
    var _b = (0, react_1.useState)({
        open: false,
        message: "",
    }), toast = _b[0], setToast = _b[1];
    var _c = (0, react_1.useState)(false), isSaving = _c[0], setIsSaving = _c[1];
    var _d = (0, react_1.useState)(false), isPublishing = _d[0], setIsPublishing = _d[1];
    var _e = (0, react_1.useState)(null), saveError = _e[0], setSaveError = _e[1];
    var _f = (0, react_1.useState)(null), publishError = _f[0], setPublishError = _f[1];
    (0, react_1.useEffect)(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, data, error, existing;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!shopId)
                            return [2 /*return*/];
                        return [4 /*yield*/, (0, api_1.apiRequest)("/cms/api/pages/".concat(shopId))];
                    case 1:
                        _a = _c.sent(), data = _a.data, error = _a.error;
                        if (data) {
                            existing = productPageId
                                ? data.find(function (p) { return p.id === productPageId; })
                                : data.find(function (p) { return p.slug === "product"; });
                            if (existing) {
                                setProductPageId(existing.id);
                                setProductComponents(existing.components);
                                if (typeof window !== "undefined") {
                                    localStorage.setItem("page-builder-history-".concat(existing.id), JSON.stringify(types_1.historyStateSchema.parse((_b = existing.history) !== null && _b !== void 0 ? _b : {
                                        past: [],
                                        present: existing.components,
                                        future: [],
                                    })));
                                }
                            }
                        }
                        else if (error) {
                            setToast({ open: true, message: error });
                        }
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [shopId, productPageId, setProductComponents, setProductPageId]);
    var _g = (0, useStepCompletion_1.default)("product-page"), markComplete = _g[1];
    var router = (0, navigation_1.useRouter)();
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Product Detail Page</h2>
      <shadcn_1.Select value={productLayout} onValueChange={function (val) {
            var layout = val === "blank" ? "" : val;
            setProductLayout(layout);
            var tpl = pageTemplates.find(function (t) { return t.name === layout; });
            if (tpl) {
                setProductComponents(tpl.components.map(function (c) { return (__assign(__assign({}, c), { id: (0, ulid_1.ulid)() })); }));
            }
            else {
                setProductComponents([]);
            }
        }}>
        <shadcn_1.SelectTrigger className="w-full">
          <shadcn_1.SelectValue placeholder="Select template"/>
        </shadcn_1.SelectTrigger>
        <shadcn_1.SelectContent>
          <shadcn_1.SelectItem value="blank">Blank</shadcn_1.SelectItem>
          {pageTemplates.map(function (t) { return (<shadcn_1.SelectItem key={t.name} value={t.name}>
              {t.name}
            </shadcn_1.SelectItem>); })}
        </shadcn_1.SelectContent>
      </shadcn_1.Select>
      <ProductPageBuilder_1.default page={{
            id: productPageId !== null && productPageId !== void 0 ? productPageId : "",
            slug: "",
            status: "draft",
            components: productComponents,
            seo: {
                title: (0, fillLocales_1.fillLocales)(undefined, ""),
                description: (0, fillLocales_1.fillLocales)(undefined, ""),
                image: (0, fillLocales_1.fillLocales)(undefined, ""),
                brand: (0, fillLocales_1.fillLocales)(undefined, ""),
                offers: (0, fillLocales_1.fillLocales)(undefined, ""),
                aggregateRating: (0, fillLocales_1.fillLocales)(undefined, ""),
            },
            createdAt: "",
            updatedAt: "",
            createdBy: "",
        }} onSave={function (fd) { return __awaiter(_this, void 0, void 0, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setIsSaving(true);
                        setSaveError(null);
                        return [4 /*yield*/, (0, api_1.apiRequest)("/cms/api/page-draft/".concat(shopId), { method: "POST", body: fd })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        setIsSaving(false);
                        if (data) {
                            setProductPageId(data.id);
                            setToast({ open: true, message: "Draft saved" });
                        }
                        else if (error) {
                            setSaveError(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); }} onPublish={function (fd) { return __awaiter(_this, void 0, void 0, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setIsPublishing(true);
                        setPublishError(null);
                        fd.set("status", "published");
                        return [4 /*yield*/, (0, api_1.apiRequest)("/cms/api/page/".concat(shopId), { method: "POST", body: fd })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        setIsPublishing(false);
                        if (data) {
                            setProductPageId(data.id);
                            setToast({ open: true, message: "Page published" });
                        }
                        else if (error) {
                            setPublishError(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); }} saving={isSaving} publishing={isPublishing} saveError={saveError} publishError={publishError} onChange={setProductComponents} style={themeStyle}/>
      <div className="flex justify-end">
        <shadcn_1.Button onClick={function () {
            markComplete(true);
            router.push("/cms/configurator");
        }}>
          Save & return
        </shadcn_1.Button>
      </div>
      <atoms_1.Toast open={toast.open} onClose={function () { return setToast(function (t) { return (__assign(__assign({}, t), { open: false })); }); }} message={toast.message}/>
    </div>);
}
