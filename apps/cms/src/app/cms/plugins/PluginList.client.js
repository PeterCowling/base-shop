// apps/cms/src/app/cms/plugins/PluginList.client.tsx
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
exports.default = PluginList;
var react_1 = require("react");
function PluginList(_a) {
    var plugins = _a.plugins;
    var _b = (0, react_1.useState)({}), enabled = _b[0], setEnabled = _b[1];
    var _c = (0, react_1.useState)(Object.fromEntries(plugins.map(function (p) { var _a; return [p.id, JSON.stringify((_a = p.defaultConfig) !== null && _a !== void 0 ? _a : {}, null, 2)]; }))), configs = _c[0], setConfigs = _c[1];
    return (<ul className="space-y-6">
      {plugins.map(function (plugin) {
            var _a;
            return (<li key={plugin.id} className="border-b pb-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={(_a = enabled[plugin.id]) !== null && _a !== void 0 ? _a : false} onChange={function (e) {
                    var _a;
                    return setEnabled(__assign(__assign({}, enabled), (_a = {}, _a[plugin.id] = e.target.checked, _a)));
                }}/>
            <span className="font-medium">{plugin.name}</span>
          </label>
          {enabled[plugin.id] && (<textarea className="mt-2 w-full rounded border p-2 font-mono text-sm" rows={4} value={configs[plugin.id]} onChange={function (e) {
                        var _a;
                        return setConfigs(__assign(__assign({}, configs), (_a = {}, _a[plugin.id] = e.target.value, _a)));
                    }}/>)}
        </li>);
        })}
      {plugins.length === 0 && <li>No plugins installed.</li>}
    </ul>);
}
