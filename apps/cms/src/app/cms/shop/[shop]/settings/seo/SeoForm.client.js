"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SeoForm;
var shadcn_1 = require("@/components/atoms/shadcn");
var SeoLanguageTabs_1 = require("./SeoLanguageTabs");
var useSeoForm_1 = require("./useSeoForm");
var TITLE_LIMIT = 70;
var DESC_LIMIT = 160;
function SeoForm(props) {
    var _a = (0, useSeoForm_1.default)(props), locale = _a.locale, setLocale = _a.setLocale, seo = _a.seo, baseLocale = _a.baseLocale, handleChange = _a.handleChange, handleSubmit = _a.handleSubmit, saving = _a.saving, errors = _a.errors, warnings = _a.warnings;
    return (<form onSubmit={handleSubmit} className="space-y-6">
      <SeoLanguageTabs_1.default languages={props.languages} locale={locale} onLocaleChange={setLocale} seo={seo} onFieldChange={handleChange} titleLimit={TITLE_LIMIT} descLimit={DESC_LIMIT} baseLocale={baseLocale}/>

      {Object.keys(errors).length > 0 && (<div className="text-sm text-red-600">
          {Object.entries(errors).map(function (_a) {
                var k = _a[0], v = _a[1];
                return (<p key={k}>{v.join("; ")}</p>);
            })}
        </div>)}
      {warnings.length > 0 && (<div className="text-sm text-yellow-700">
          {warnings.map(function (w) { return (<p key={w}>{w}</p>); })}
        </div>)}

      <shadcn_1.Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save"}
      </shadcn_1.Button>
    </form>);
}
