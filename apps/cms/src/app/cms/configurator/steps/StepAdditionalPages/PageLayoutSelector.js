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
exports.default = PageLayoutSelector;
var shadcn_1 = require("@/components/atoms/shadcn");
var ulid_1 = require("ulid");
function PageLayoutSelector(_a) {
    var pageTemplates = _a.pageTemplates, newPageLayout = _a.newPageLayout, setNewPageLayout = _a.setNewPageLayout, setNewComponents = _a.setNewComponents;
    return (<shadcn_1.Select value={newPageLayout} onValueChange={function (val) {
            var layout = val === "blank" ? "" : val;
            setNewPageLayout(layout);
            var tpl = pageTemplates.find(function (t) { return t.name === layout; });
            if (tpl) {
                setNewComponents(tpl.components.map(function (c) { return (__assign(__assign({}, c), { id: (0, ulid_1.ulid)() })); }));
            }
            else {
                setNewComponents([]);
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
    </shadcn_1.Select>);
}
