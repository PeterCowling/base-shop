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
exports.default = PageMetaForm;
var shadcn_1 = require("@/components/atoms/shadcn");
function PageMetaForm(_a) {
    var languages = _a.languages, slug = _a.slug, setSlug = _a.setSlug, title = _a.title, setTitle = _a.setTitle, desc = _a.desc, setDesc = _a.setDesc, image = _a.image, setImage = _a.setImage;
    return (<>
      <label className="flex flex-col gap-1">
        <span>Slug</span>
        <shadcn_1.Input value={slug} onChange={function (e) { return setSlug(e.target.value); }}/>
      </label>
      {languages.map(function (l) { return (<div key={l} className="space-y-2">
          <label className="flex flex-col gap-1">
            <span>Title ({l})</span>
            <shadcn_1.Input value={title[l]} onChange={function (e) {
            var _a;
            return setTitle(__assign(__assign({}, title), (_a = {}, _a[l] = e.target.value, _a)));
        }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Description ({l})</span>
            <shadcn_1.Input value={desc[l]} onChange={function (e) {
            var _a;
            return setDesc(__assign(__assign({}, desc), (_a = {}, _a[l] = e.target.value, _a)));
        }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL ({l})</span>
            <shadcn_1.Input value={image[l]} onChange={function (e) {
            var _a;
            return setImage(__assign(__assign({}, image), (_a = {}, _a[l] = e.target.value, _a)));
        }}/>
          </label>
        </div>); })}
    </>);
}
