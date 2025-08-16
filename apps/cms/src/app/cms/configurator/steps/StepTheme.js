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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepTheme;
var shadcn_1 = require("@/components/atoms/shadcn");
var StyleEditor_1 = require("@/components/cms/StyleEditor");
var react_1 = require("react");
var WizardPreview_1 = require("../../wizard/WizardPreview");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
var useThemeLoader_1 = require("../hooks/useThemeLoader");
var useConfiguratorPersistence_1 = require("../hooks/useConfiguratorPersistence");
var colorPalettes = [
    {
        name: "Base",
        colors: {
            "--color-bg": "0 0% 100%",
            "--color-fg": "0 0% 10%",
            "--color-primary": "220 90% 56%",
            "--color-primary-fg": "0 0% 100%",
            "--color-accent": "260 83% 67%",
            "--color-muted": "0 0% 88%",
        },
    },
    {
        name: "Dark",
        colors: {
            "--color-bg": "0 0% 4%",
            "--color-fg": "0 0% 93%",
            "--color-primary": "220 90% 66%",
            "--color-primary-fg": "0 0% 100%",
            "--color-accent": "260 83% 67%",
            "--color-muted": "0 0% 60%",
        },
    },
    {
        name: "Forest",
        colors: {
            "--color-bg": "0 0% 100%",
            "--color-fg": "0 0% 10%",
            "--color-primary": "160 80% 40%",
            "--color-primary-fg": "0 0% 100%",
            "--color-accent": "200 90% 45%",
            "--color-muted": "0 0% 88%",
        },
    },
];
function StepTheme(_a) {
    var themes = _a.themes, prevStepId = _a.prevStepId, nextStepId = _a.nextStepId;
    var themeStyle = (0, useThemeLoader_1.useThemeLoader)();
    var _b = (0, ConfiguratorContext_1.useConfigurator)(), state = _b.state, update = _b.update, themeDefaults = _b.themeDefaults, setThemeOverrides = _b.setThemeOverrides;
    var theme = state.theme, themeOverrides = state.themeOverrides;
    var _c = (0, react_1.useState)(colorPalettes[0].name), palette = _c[0], setPalette = _c[1];
    var _d = (0, useStepCompletion_1.default)("theme"), markComplete = _d[1];
    var router = (0, navigation_1.useRouter)();
    var applyPalette = (0, react_1.useCallback)(function (name) {
        var cp = colorPalettes.find(function (c) { return c.name === name; });
        if (!cp)
            return;
        setThemeOverrides(function (prev) {
            var next = __assign({}, prev);
            Object.entries(cp.colors).forEach(function (_a) {
                var k = _a[0], v = _a[1];
                if (themeDefaults[k] !== v) {
                    next[k] = v;
                }
                else {
                    delete next[k];
                }
            });
            return next;
        });
    }, [themeDefaults, setThemeOverrides]);
    (0, react_1.useEffect)(function () {
        applyPalette(palette);
    }, [palette, applyPalette]);
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Theme</h2>

      {/* single accessible combobox (theme) */}
      <shadcn_1.Select value={theme} onValueChange={function (v) {
            update("theme", v);
            setThemeOverrides({});
            if (typeof window !== "undefined") {
                try {
                    var json = localStorage.getItem(useConfiguratorPersistence_1.STORAGE_KEY);
                    if (json) {
                        var data = JSON.parse(json);
                        data.theme = v;
                        data.themeOverrides = {};
                        localStorage.setItem(useConfiguratorPersistence_1.STORAGE_KEY, JSON.stringify(data));
                        window.dispatchEvent(new CustomEvent("configurator:update"));
                    }
                }
                catch (_a) {
                    /* ignore */
                }
            }
        }}>
        <shadcn_1.SelectTrigger className="w-full">
          <shadcn_1.SelectValue placeholder="Select theme"/>
        </shadcn_1.SelectTrigger>
        <shadcn_1.SelectContent>
          {themes.map(function (t) { return (<shadcn_1.SelectItem key={t} value={t}>
              <div className="flex items-center gap-2">
                <img src={"/themes/".concat(t, ".svg")} alt={"".concat(t, " preview")} className="h-6 w-6 rounded object-cover"/>
                {t}
              </div>
            </shadcn_1.SelectItem>); })}
        </shadcn_1.SelectContent>
      </shadcn_1.Select>

      {/* Palette picker – buttons, no additional combobox */}
      <div className="space-y-2">
        <h3 className="font-medium">Color Palette</h3>
        <div className="flex flex-wrap gap-2">
          {colorPalettes.map(function (p) { return (<shadcn_1.Button key={p.name} variant={p.name === palette ? "default" : "outline"} onClick={function () { return setPalette(p.name); }}>
              {p.name}
            </shadcn_1.Button>); })}
        </div>
      </div>

      {/* Style editor is purely presentational at this step */}
      <div aria-hidden="true">
        <StyleEditor_1.default tokens={themeOverrides} baseTokens={themeDefaults} onChange={setThemeOverrides}/>
      </div>

      <WizardPreview_1.default style={themeStyle}/>

      <div className="flex justify-between">
        {prevStepId && (<shadcn_1.Button variant="outline" onClick={function () { return router.push("/cms/configurator/".concat(prevStepId)); }}>
            Back
          </shadcn_1.Button>)}
        {nextStepId && (<shadcn_1.Button onClick={function () {
                markComplete(true);
                router.push("/cms/configurator/".concat(nextStepId));
            }}>
            Next
          </shadcn_1.Button>)}
      </div>
    </div>);
}
