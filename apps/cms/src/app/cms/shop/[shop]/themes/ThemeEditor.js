// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx
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
exports.default = ThemeEditor;
var shadcn_1 = require("@/components/atoms/shadcn");
var shops_server_1 = require("@cms/actions/shops.server");
var color_contrast_checker_1 = require("color-contrast-checker");
var react_1 = require("react");
var colorUtils_1 = require("@ui/utils/colorUtils");
var useThemePresets_1 = require("./useThemePresets");
var ColorInput_1 = require("./ColorInput");
var WizardPreview_1 = require("../../../wizard/WizardPreview");
var previewTokens_1 = require("../../../wizard/previewTokens");
function ThemeEditor(_a) {
    var _this = this;
    var shop = _a.shop, themes = _a.themes, tokensByTheme = _a.tokensByTheme, initialTheme = _a.initialTheme, initialOverrides = _a.initialOverrides, presets = _a.presets;
    var _b = (0, react_1.useState)(initialTheme), theme = _b[0], setTheme = _b[1];
    var _c = (0, react_1.useState)(initialOverrides), overrides = _c[0], setOverrides = _c[1];
    var _d = (0, react_1.useState)(tokensByTheme[initialTheme]), themeDefaults = _d[0], setThemeDefaults = _d[1];
    var _e = (0, useThemePresets_1.useThemePresets)({
        shop: shop,
        initialThemes: themes,
        initialTokensByTheme: tokensByTheme,
        presets: presets,
        theme: theme,
        overrides: overrides,
        setTheme: setTheme,
        setOverrides: setOverrides,
        setThemeDefaults: setThemeDefaults,
    }), availableThemes = _e.availableThemes, tokensByThemeState = _e.tokensByThemeState, presetThemes = _e.presetThemes, presetName = _e.presetName, setPresetName = _e.setPresetName, handleSavePreset = _e.handleSavePreset, handleDeletePreset = _e.handleDeletePreset;
    var _f = (0, react_1.useState)([]), contrastWarnings = _f[0], setContrastWarnings = _f[1];
    var _g = (0, react_1.useState)(false), saving = _g[0], setSaving = _g[1];
    var _h = (0, react_1.useState)({}), errors = _h[0], setErrors = _h[1];
    var overrideRefs = (0, react_1.useRef)({});
    var _j = (0, react_1.useState)(__assign(__assign({}, tokensByThemeState[initialTheme]), initialOverrides)), previewTokens = _j[0], setPreviewTokens = _j[1];
    var debounceRef = (0, react_1.useRef)(null);
    var groupedTokens = (0, react_1.useMemo)(function () {
        var tokens = tokensByThemeState[theme];
        var groups = {
            Background: [],
            Text: [],
            Accent: [],
            Other: [],
        };
        Object.entries(tokens).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (/bg|background/i.test(k))
                groups.Background.push([k, v]);
            else if (/text|foreground/i.test(k))
                groups.Text.push([k, v]);
            else if (/accent|primary|secondary|highlight/i.test(k))
                groups.Accent.push([k, v]);
            else
                groups.Other.push([k, v]);
        });
        return groups;
    }, [theme, tokensByThemeState]);
    var handleThemeChange = function (e) {
        var next = e.target.value;
        setTheme(next);
        setOverrides({});
        setThemeDefaults(tokensByThemeState[next]);
        schedulePreviewUpdate(tokensByThemeState[next]);
    };
    var schedulePreviewUpdate = function (tokens) {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(function () {
            setPreviewTokens(tokens);
        }, 100);
    };
    var handleOverrideChange = function (key, defaultValue) {
        return function (value) {
            setOverrides(function (prev) {
                var next = __assign({}, prev);
                if (!value || value === defaultValue) {
                    delete next[key];
                }
                else {
                    next[key] = value;
                }
                var merged = __assign(__assign({}, tokensByThemeState[theme]), next);
                schedulePreviewUpdate(merged);
                return next;
            });
        };
    };
    var handleReset = function (key) { return function () {
        setOverrides(function (prev) {
            var next = __assign({}, prev);
            delete next[key];
            var merged = __assign(__assign({}, tokensByThemeState[theme]), next);
            schedulePreviewUpdate(merged);
            return next;
        });
    }; };
    var handleTokenSelect = function (token) {
        var _a, _b, _c;
        var input = overrideRefs.current[token];
        if (!input)
            return;
        (_a = input.scrollIntoView) === null || _a === void 0 ? void 0 : _a.call(input, { behavior: "smooth", block: "center" });
        input.focus();
        (_c = (_b = input).showPicker) === null || _c === void 0 ? void 0 : _c.call(_b);
        if (!input.showPicker) {
            input.click();
        }
    };
    (0, react_1.useEffect)(function () {
        return function () {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);
    (0, react_1.useEffect)(function () {
        var ccc = new color_contrast_checker_1.default();
        var baseTokens = tokensByThemeState[theme];
        var merged = previewTokens;
        var textTokens = Object.keys(baseTokens).filter(function (k) {
            return /text|foreground/i.test(k);
        });
        var bgTokens = Object.keys(baseTokens).filter(function (k) {
            return /bg|background/i.test(k);
        });
        var warnings = [];
        textTokens.forEach(function (t) {
            var fg = merged[t];
            var fgDefault = baseTokens[t];
            bgTokens.forEach(function (b) {
                var bg = merged[b];
                var bgDefault = baseTokens[b];
                if (!fg || !bg)
                    return;
                var fgHex = (0, colorUtils_1.isHsl)(fg) ? (0, colorUtils_1.hslToHex)(fg) : fg;
                var bgHex = (0, colorUtils_1.isHsl)(bg) ? (0, colorUtils_1.hslToHex)(bg) : bg;
                if (!(0, colorUtils_1.isHex)(fgHex) || !(0, colorUtils_1.isHex)(bgHex))
                    return;
                var fgDefHex = (0, colorUtils_1.isHsl)(fgDefault) ? (0, colorUtils_1.hslToHex)(fgDefault) : fgDefault;
                var bgDefHex = (0, colorUtils_1.isHsl)(bgDefault) ? (0, colorUtils_1.hslToHex)(bgDefault) : bgDefault;
                var defaultRatio = ccc.getContrastRatio(fgDefHex, bgDefHex);
                var ratio = ccc.getContrastRatio(fgHex, bgHex);
                if (ratio < defaultRatio && ratio < 4.5) {
                    warnings.push("".concat(t, " on ").concat(b, " contrast ").concat(ratio.toFixed(2), ":1"));
                }
            });
        });
        setContrastWarnings(warnings);
    }, [theme, previewTokens, tokensByThemeState]);
    (0, react_1.useEffect)(function () {
        (0, previewTokens_1.savePreviewTokens)(previewTokens);
    }, [previewTokens]);
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var fd, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    fd = new FormData(e.currentTarget);
                    fd.set("themeOverrides", JSON.stringify(overrides));
                    fd.set("themeDefaults", JSON.stringify(themeDefaults));
                    return [4 /*yield*/, (0, shops_server_1.updateShop)(shop, fd)];
                case 1:
                    result = _a.sent();
                    if (result.errors) {
                        setErrors(result.errors);
                    }
                    else if (result.shop) {
                        setErrors({});
                    }
                    setSaving(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={onSubmit} className="space-y-4">
      <shadcn_1.Input type="hidden" name="id" value={shop}/>
      <input type="hidden" name="themeOverrides" value={JSON.stringify(overrides)}/>
      <input type="hidden" name="themeDefaults" value={JSON.stringify(themeDefaults)}/>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <select className="border p-2" name="themeId" value={theme} onChange={handleThemeChange}>
          {availableThemes.map(function (t) { return (<option key={t} value={t}>
              {t}
            </option>); })}
        </select>
        {errors.themeId && (<span className="text-sm text-red-600">
            {errors.themeId.join("; ")}
          </span>)}
      </label>
      <div className="flex items-center gap-2">
        <shadcn_1.Input placeholder="Preset name" value={presetName} onChange={function (e) { return setPresetName(e.target.value); }}/>
        <shadcn_1.Button type="button" onClick={handleSavePreset} disabled={!presetName.trim()}>
          Save Preset
        </shadcn_1.Button>
        {presetThemes.includes(theme) && (<shadcn_1.Button type="button" onClick={handleDeletePreset}>
            Delete Preset
          </shadcn_1.Button>)}
      </div>
      {contrastWarnings.length > 0 && (<div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
          <p>Contrast warnings:</p>
          <ul className="list-disc pl-4">
            {contrastWarnings.map(function (w, i) { return (<li key={i}>{w}</li>); })}
          </ul>
        </div>)}
      <WizardPreview_1.default style={previewTokens} inspectMode onTokenSelect={handleTokenSelect}/>
      <div className="space-y-6">
        {Object.entries(groupedTokens).map(function (_a) {
            var groupName = _a[0], tokens = _a[1];
            return (<fieldset key={groupName} className="space-y-2">
            <legend className="font-semibold">{groupName}</legend>
            <div className="mb-2 flex flex-wrap gap-2">
              {tokens
                    .filter(function (_a) {
                    var v = _a[1];
                    return (0, colorUtils_1.isHex)(v) || (0, colorUtils_1.isHsl)(v);
                })
                    .map(function (_a) {
                    var k = _a[0], defaultValue = _a[1];
                    var current = overrides[k] || defaultValue;
                    var colorValue = (0, colorUtils_1.isHsl)(defaultValue)
                        ? (0, colorUtils_1.isHex)(current)
                            ? current
                            : (0, colorUtils_1.hslToHex)(current)
                        : current;
                    return (<button key={k} type="button" aria-label={k} title={k} className="h-6 w-6 rounded border" style={{ background: colorValue }} onClick={function () { return handleTokenSelect(k); }}/>);
                })}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {tokens.map(function (_a) {
                    var k = _a[0], defaultValue = _a[1];
                    var hasOverride = Object.prototype.hasOwnProperty.call(overrides, k);
                    var overrideValue = hasOverride ? overrides[k] : "";
                    return (<ColorInput_1.default key={k} name={k} defaultValue={defaultValue} value={overrideValue} onChange={handleOverrideChange(k, defaultValue)} onReset={handleReset(k)} inputRef={function (el) { return (overrideRefs.current[k] = el); }}/>);
                })}
            </div>
          </fieldset>);
        })}
      </div>
      <shadcn_1.Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </shadcn_1.Button>
    </form>);
}
