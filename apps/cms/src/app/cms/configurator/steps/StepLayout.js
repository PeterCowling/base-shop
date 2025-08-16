// src/components/cms/StepLayout.tsx
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
exports.default = StepLayout;
var shadcn_1 = require("@/components/atoms/shadcn");
var PageBuilder_1 = require("@/components/cms/PageBuilder");
var fillLocales_1 = require("@i18n/fillLocales");
var api_1 = require("../lib/api");
var react_1 = require("react");
var atoms_1 = require("@/components/atoms");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
var useThemeLoader_1 = require("../hooks/useThemeLoader");
var emptyTranslated = function () { return (0, fillLocales_1.fillLocales)(undefined, ""); };
function StepLayout(_a) {
    var _this = this;
    var children = _a.children;
    var _b = (0, ConfiguratorContext_1.useConfigurator)(), state = _b.state, update = _b.update;
    var headerComponents = state.headerComponents, headerPageId = state.headerPageId, footerComponents = state.footerComponents, footerPageId = state.footerPageId, shopId = state.shopId;
    var themeStyle = (0, useThemeLoader_1.useThemeLoader)();
    var setHeaderComponents = function (v) { return update("headerComponents", v); };
    var setHeaderPageId = function (v) { return update("headerPageId", v); };
    var setFooterComponents = function (v) { return update("footerComponents", v); };
    var setFooterPageId = function (v) { return update("footerPageId", v); };
    var _c = (0, react_1.useState)({
        open: false,
        message: "",
    }), toast = _c[0], setToast = _c[1];
    var _d = (0, useStepCompletion_1.default)("layout"), markComplete = _d[1];
    var router = (0, navigation_1.useRouter)();
    var _e = (0, react_1.useState)(false), headerSaving = _e[0], setHeaderSaving = _e[1];
    var _f = (0, react_1.useState)(null), headerError = _f[0], setHeaderError = _f[1];
    var _g = (0, react_1.useState)(false), footerSaving = _g[0], setFooterSaving = _g[1];
    var _h = (0, react_1.useState)(null), footerError = _h[0], setFooterError = _h[1];
    return (<fieldset className="space-y-4">
      <h2 className="text-xl font-semibold">Layout</h2>

      {/* Header builder -------------------------------------------------- */}
      <div className="space-y-2">
        <h3 className="font-medium">Header</h3>
        <PageBuilder_1.default page={{
            id: headerPageId !== null && headerPageId !== void 0 ? headerPageId : "",
            slug: "",
            status: "draft",
            components: headerComponents,
            seo: {
                title: emptyTranslated(),
                description: emptyTranslated(),
                image: emptyTranslated(),
                brand: emptyTranslated(),
                offers: emptyTranslated(),
                aggregateRating: emptyTranslated(),
            },
            createdAt: "",
            updatedAt: "",
            createdBy: "",
        }} onSave={function (fd) { return __awaiter(_this, void 0, void 0, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setHeaderSaving(true);
                        setHeaderError(null);
                        return [4 /*yield*/, (0, api_1.apiRequest)("/cms/api/page-draft/".concat(shopId), { method: "POST", body: fd })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        setHeaderSaving(false);
                        if (data) {
                            setHeaderPageId(data.id);
                            setToast({ open: true, message: "Header saved" });
                        }
                        else if (error) {
                            setHeaderError(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); }} onPublish={function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }} saving={headerSaving} saveError={headerError} onChange={setHeaderComponents} style={themeStyle}/>
      </div>

      {/* Footer builder -------------------------------------------------- */}
      <div className="space-y-2">
        <h3 className="font-medium">Footer</h3>
        <PageBuilder_1.default page={{
            id: footerPageId !== null && footerPageId !== void 0 ? footerPageId : "",
            slug: "",
            status: "draft",
            components: footerComponents,
            seo: {
                title: emptyTranslated(),
                description: emptyTranslated(),
                image: emptyTranslated(),
                brand: emptyTranslated(),
                offers: emptyTranslated(),
                aggregateRating: emptyTranslated(),
            },
            createdAt: "",
            updatedAt: "",
            createdBy: "",
        }} onSave={function (fd) { return __awaiter(_this, void 0, void 0, function () {
            var _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setFooterSaving(true);
                        setFooterError(null);
                        return [4 /*yield*/, (0, api_1.apiRequest)("/cms/api/page-draft/".concat(shopId), { method: "POST", body: fd })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        setFooterSaving(false);
                        if (data) {
                            setFooterPageId(data.id);
                            setToast({ open: true, message: "Footer saved" });
                        }
                        else if (error) {
                            setFooterError(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); }} onPublish={function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }} saving={footerSaving} saveError={footerError} onChange={setFooterComponents} style={themeStyle}/>
      </div>

      {/* Additional step-specific UI ------------------------------------ */}
      {children}

      {/* Navigation ------------------------------------------------------ */}
      <div className="flex justify-end">
        <shadcn_1.Button onClick={function () {
            markComplete(true);
            router.push("/cms/configurator");
        }}>
          Save & return
        </shadcn_1.Button>
      </div>
      <atoms_1.Toast open={toast.open} onClose={function () { return setToast(function (t) { return (__assign(__assign({}, t), { open: false })); }); }} message={toast.message}/>
    </fieldset>);
}
