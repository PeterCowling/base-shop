// apps/cms/src/app/cms/configurator/steps/StepSummary.tsx
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
exports.default = StepSummary;
var shadcn_1 = require("@/components/atoms/shadcn");
var i18n_1 = require("@acme/i18n");
var react_1 = require("react");
var WizardPreview_1 = require("../../wizard/WizardPreview");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
function StepSummary(_a) {
    var _this = this;
    var shopId = _a.shopId, name = _a.name, logo = _a.logo, contactInfo = _a.contactInfo, type = _a.type, template = _a.template, theme = _a.theme, payment = _a.payment, shipping = _a.shipping, analyticsProvider = _a.analyticsProvider, pageTitle = _a.pageTitle, setPageTitle = _a.setPageTitle, pageDescription = _a.pageDescription, setPageDescription = _a.setPageDescription, socialImage = _a.socialImage, setSocialImage = _a.setSocialImage, result = _a.result, themeStyle = _a.themeStyle, creating = _a.creating, submit = _a.submit, _b = _a.errors, errors = _b === void 0 ? {} : _b;
    var languages = i18n_1.LOCALES;
    var _c = (0, useStepCompletion_1.default)("summary"), markComplete = _c[1];
    var router = (0, navigation_1.useRouter)();
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Summary</h2>

      <ul className="list-disc pl-5 text-sm">
        <li>
          <b>Shop ID:</b> {shopId}
        </li>
        <li>
          <b>Store Name:</b> {name}
        </li>
        <li>
          <b>Logo:</b> {logo || "none"}
        </li>
        <li>
          <b>Contact:</b> {contactInfo || "none"}
        </li>
        <li>
          <b>Type:</b> {type}
        </li>
        <li>
          <b>Template:</b> {template}
        </li>
        <li>
          <b>Theme:</b> {theme}
        </li>
        <li>
          <b>Payment:</b> {payment.length ? payment.join(", ") : "none"}
        </li>
        <li>
          <b>Shipping:</b> {shipping.length ? shipping.join(", ") : "none"}
        </li>
        <li>
          <b>Analytics:</b> {analyticsProvider || "none"}
        </li>
      </ul>

      {languages.map(function (l) { return (<div key={l} className="space-y-2">
          <label className="flex flex-col gap-1">
            <span>Home page title ({l})</span>
            <shadcn_1.Input value={pageTitle[l]} onChange={function (e) {
                var _a;
                return setPageTitle(__assign(__assign({}, pageTitle), (_a = {}, _a[l] = e.target.value, _a)));
            }} placeholder="Home"/>
            {errors["pageTitle.".concat(l)] && (<p className="text-sm text-red-600">
                {errors["pageTitle.".concat(l)][0]}
              </p>)}
          </label>

          <label className="flex flex-col gap-1">
            <span>Description ({l})</span>
            <shadcn_1.Input value={pageDescription[l]} onChange={function (e) {
                var _a;
                return setPageDescription(__assign(__assign({}, pageDescription), (_a = {}, _a[l] = e.target.value, _a)));
            }} placeholder="Page description"/>
            {errors["pageDescription.".concat(l)] && (<p className="text-sm text-red-600">
                {errors["pageDescription.".concat(l)][0]}
              </p>)}
          </label>
        </div>); })}

      <label className="flex flex-col gap-1">
        <span>Social image URL</span>
        <shadcn_1.Input value={socialImage} onChange={function (e) { return setSocialImage(e.target.value); }} placeholder="https://example.com/og.png"/>
        {errors.socialImage && (<p className="text-sm text-red-600">{errors.socialImage[0]}</p>)}
      </label>

      {result && <p className="text-sm">{result}</p>}

      <WizardPreview_1.default style={themeStyle}/>

      <div className="flex justify-end">
        <shadcn_1.Button disabled={creating} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, submit()];
                    case 1:
                        _a.sent();
                        markComplete(true);
                        router.push("/cms/configurator");
                        return [2 /*return*/];
                }
            });
        }); }} className="ml-auto">
          {creating ? "Saving…" : "Save & return"}
        </shadcn_1.Button>
      </div>
    </div>);
}
