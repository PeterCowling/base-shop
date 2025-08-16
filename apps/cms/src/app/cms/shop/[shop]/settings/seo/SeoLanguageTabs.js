"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SeoLanguageTabs;
var atoms_1 = require("@/components/atoms");
var shadcn_1 = require("@/components/atoms/shadcn");
var style_1 = require("@ui/utils/style");
function SeoLanguageTabs(_a) {
    var languages = _a.languages, locale = _a.locale, onLocaleChange = _a.onLocaleChange, seo = _a.seo, onFieldChange = _a.onFieldChange, titleLimit = _a.titleLimit, descLimit = _a.descLimit, baseLocale = _a.baseLocale;
    var base = baseLocale !== null && baseLocale !== void 0 ? baseLocale : languages[0];
    var current = seo[locale];
    return (<div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {languages.map(function (l) {
            var isSelected = l === locale;
            var inherited = l !== base && !seo[l];
            return (<button key={l} type="button" onClick={function () { return onLocaleChange(l); }} className={(0, style_1.cn)("rounded-full border px-2 py-0.5 text-xs font-medium", isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-fg hover:bg-muted/80", inherited && "opacity-50")}>
              {l.toUpperCase()}
            </button>);
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Meta ------------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Meta</h3>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              Title
              <atoms_1.Tooltip text="Recommended ≤ 70 characters">?</atoms_1.Tooltip>
              <span className="text-muted-foreground ml-auto text-xs">
                {current.title.length}/{titleLimit}
              </span>
            </span>
            <shadcn_1.Input value={current.title} onChange={function (e) { return onFieldChange("title", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              Description
              <atoms_1.Tooltip text="Recommended ≤ 160 characters">?</atoms_1.Tooltip>
              <span className="text-muted-foreground ml-auto text-xs">
                {current.description.length}/{descLimit}
              </span>
            </span>
            <shadcn_1.Textarea rows={3} value={current.description} onChange={function (e) { return onFieldChange("description", e.target.value); }}/>
          </label>
        </section>

        {/* Open Graph ------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Open Graph</h3>
          <label className="flex flex-col gap-1">
            <span>Title</span>
            <shadcn_1.Input value={current.title} onChange={function (e) { return onFieldChange("title", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Description</span>
            <shadcn_1.Textarea rows={3} value={current.description} onChange={function (e) { return onFieldChange("description", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL</span>
            <shadcn_1.Input value={current.image} onChange={function (e) { return onFieldChange("image", e.target.value); }}/>
          </label>
        </section>

        {/* Twitter ---------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Twitter</h3>
          <label className="flex flex-col gap-1">
            <span>Title</span>
            <shadcn_1.Input value={current.title} onChange={function (e) { return onFieldChange("title", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Description</span>
            <shadcn_1.Textarea rows={3} value={current.description} onChange={function (e) { return onFieldChange("description", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL</span>
            <shadcn_1.Input value={current.image} onChange={function (e) { return onFieldChange("image", e.target.value); }}/>
          </label>
        </section>

        {/* Structured Data -------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Structured Data</h3>
          <label className="flex flex-col gap-1">
            <span>Brand</span>
            <shadcn_1.Input value={current.brand} onChange={function (e) { return onFieldChange("brand", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Offers (JSON)</span>
            <shadcn_1.Textarea rows={3} value={current.offers} onChange={function (e) { return onFieldChange("offers", e.target.value); }}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Aggregate Rating (JSON)</span>
            <shadcn_1.Textarea rows={3} value={current.aggregateRating} onChange={function (e) {
            return onFieldChange("aggregateRating", e.target.value);
        }}/>
          </label>
        </section>
      </div>
    </div>);
}
