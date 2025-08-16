// apps/cms/src/app/cms/wizard/WizardPreview.tsx
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WizardPreview;
var atoms_1 = require("@/components/atoms");
var blocks_1 = require("@/components/cms/blocks");
var organisms_1 = require("@/components/organisms");
var AppShell_1 = require("@/components/templates/AppShell");
var Translations_1 = require("@/i18n/Translations");
var en_json_1 = require("@i18n/en.json");
var react_1 = require("react");
var useConfiguratorPersistence_1 = require("../configurator/hooks/useConfiguratorPersistence");
var previewTokens_1 = require("./previewTokens");
/**
 * Renders a live preview of the page the wizard is currently building.
 * The preview reads wizard state from localStorage (keyed by `STORAGE_KEY`)
 * so it always shows the latest edits without needing a full refresh.
 */
function WizardPreview(_a) {
    var style = _a.style, _b = _a.inspectMode, inspectMode = _b === void 0 ? false : _b, onTokenSelect = _a.onTokenSelect;
    var _c = (0, react_1.useState)("desktop"), viewport = _c[0], setViewport = _c[1];
    var _d = (0, react_1.useState)([]), components = _d[0], setComponents = _d[1];
    var _e = (0, react_1.useState)(function () { return (__assign(__assign({}, style), (0, previewTokens_1.loadPreviewTokens)())); }), themeStyle = _e[0], setThemeStyle = _e[1];
    var _f = (0, react_1.useState)(null), highlight = _f[0], setHighlight = _f[1];
    var previewRef = (0, react_1.useRef)(null);
    var clickTimeoutRef = (0, react_1.useRef)(null);
    /* ------------------------------------------------------------------ */
    /*             Sync wizard state from localStorage                    */
    /*  Re-sync when localStorage changes or when a custom event fires.   */
    /* ------------------------------------------------------------------ */
    (0, react_1.useEffect)(function () {
        var load = function () {
            try {
                var json = localStorage.getItem(useConfiguratorPersistence_1.STORAGE_KEY);
                if (!json)
                    return;
                var data = JSON.parse(json);
                if (Array.isArray(data.components)) {
                    setComponents(data.components);
                }
            }
            catch (_a) {
                /* ignore JSON errors */
            }
        };
        load();
        window.addEventListener("storage", load);
        window.addEventListener("configurator:update", load);
        return function () {
            window.removeEventListener("storage", load);
            window.removeEventListener("configurator:update", load);
        };
    }, []);
    /* ------------------------------------------------------------------ */
    /*                  Theme token subscription                           */
    /* ------------------------------------------------------------------ */
    (0, react_1.useEffect)(function () {
        var handle = function () {
            setThemeStyle(function (prev) { return (__assign(__assign({}, prev), (0, previewTokens_1.loadPreviewTokens)())); });
        };
        handle();
        window.addEventListener("storage", handle);
        window.addEventListener(previewTokens_1.PREVIEW_TOKENS_EVENT, handle);
        return function () {
            window.removeEventListener("storage", handle);
            window.removeEventListener(previewTokens_1.PREVIEW_TOKENS_EVENT, handle);
        };
    }, []);
    (0, react_1.useEffect)(function () {
        setThemeStyle(function (prev) { return (__assign(__assign({}, prev), style)); });
    }, [style]);
    /* ------------------------------------------------------------------ */
    /*                         Helpers                                    */
    /* ------------------------------------------------------------------ */
    var widthMap = {
        desktop: "100%",
        tablet: "768px",
        mobile: "375px",
    };
    var containerStyle = __assign(__assign({}, themeStyle), { width: widthMap[viewport] });
    /* ------------------------------------------------------------------ */
    /*                         Inspect mode                               */
    /* ------------------------------------------------------------------ */
    (0, react_1.useEffect)(function () {
        if (!highlight)
            return;
        var prev = highlight.style.outline;
        highlight.style.outline = "2px solid #3b82f6";
        return function () {
            highlight.style.outline = prev;
        };
    }, [highlight]);
    (0, react_1.useEffect)(function () {
        return function () {
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
        };
    }, []);
    var handlePointerMove = function (e) {
        if (!inspectMode || clickTimeoutRef.current)
            return;
        var el = e.target.closest("[data-token]");
        setHighlight(el);
    };
    var handleClick = function (e) {
        if (!inspectMode)
            return;
        var el = e.target.closest("[data-token]");
        if (!el)
            return;
        e.preventDefault();
        e.stopPropagation();
        setHighlight(el);
        var token = el.getAttribute("data-token");
        if (token)
            onTokenSelect === null || onTokenSelect === void 0 ? void 0 : onTokenSelect(token);
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }
        clickTimeoutRef.current = window.setTimeout(function () {
            clickTimeoutRef.current = null;
            setHighlight(null);
        }, 1000);
    };
    var handleLeave = function () {
        if (!inspectMode || clickTimeoutRef.current)
            return;
        setHighlight(null);
    };
    /** Renders a single block component */
    function Block(_a) {
        var _b;
        var component = _a.component;
        /* Plain rich-text blocks are handled separately */
        if (component.type === "Text") {
            var text = component.text;
            var value = typeof text === "string"
                ? text
                : ((_b = text.en) !== null && _b !== void 0 ? _b : "");
            return <div dangerouslySetInnerHTML={{ __html: value }}/>;
        }
        /* Look up the React component in the block registry.
           We cast through `unknown` first to silence TS2352, because
           individual block components have stricter prop requirements
           than the generic Record<string, unknown> we use here. */
        var entry = blocks_1.blockRegistry[component.type];
        var Comp = entry === null || entry === void 0 ? void 0 : entry.component;
        if (!Comp)
            return null;
        /* Remove metadata fields before spreading props */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        var _c = component, _id = _c.id, _type = _c.type, props = __rest(_c, ["id", "type"]);
        return <Comp {...props} locale="en"/>;
    }
    /* ------------------------------------------------------------------ */
    /*                             Render                                 */
    /* ------------------------------------------------------------------ */
    return (<div className="space-y-2">
      {/* viewport switcher */}
      <div className="flex justify-end gap-2">
        <atoms_1.Button variant={viewport === "desktop" ? "default" : "outline"} onClick={function () { return setViewport("desktop"); }}>
          Desktop
        </atoms_1.Button>
        <atoms_1.Button variant={viewport === "tablet" ? "default" : "outline"} onClick={function () { return setViewport("tablet"); }}>
          Tablet
        </atoms_1.Button>
        <atoms_1.Button variant={viewport === "mobile" ? "default" : "outline"} onClick={function () { return setViewport("mobile"); }}>
          Mobile
        </atoms_1.Button>
      </div>

      {/* live preview */}
      <div ref={previewRef} style={containerStyle} className={"mx-auto rounded border ".concat(inspectMode ? "cursor-crosshair" : "")} onPointerMove={handlePointerMove} onClickCapture={handleClick} onPointerLeave={handleLeave}>
        <Translations_1.default messages={en_json_1.default}>
          <AppShell_1.AppShell header={<organisms_1.Header locale="en"/>} sideNav={<organisms_1.SideNav />} footer={<organisms_1.Footer />}>
            {components.map(function (c) { return (<Block key={c.id} component={c}/>); })}
          </AppShell_1.AppShell>
        </Translations_1.default>
      </div>
    </div>);
}
