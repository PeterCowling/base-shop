"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepShopDetails;
var shadcn_1 = require("@/components/atoms/shadcn");
var navigation_1 = require("next/navigation");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
function StepShopDetails(_a) {
    var shopId = _a.shopId, setShopId = _a.setShopId, storeName = _a.storeName, setStoreName = _a.setStoreName, logo = _a.logo, setLogo = _a.setLogo, contactInfo = _a.contactInfo, setContactInfo = _a.setContactInfo, type = _a.type, setType = _a.setType, template = _a.template, setTemplate = _a.setTemplate, templates = _a.templates, _b = _a.errors, errors = _b === void 0 ? {} : _b;
    var router = (0, navigation_1.useRouter)();
    var _c = (0, useStepCompletion_1.default)("shop-details"), markComplete = _c[1];
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Details</h2>
      <label className="flex flex-col gap-1">
        <span>Shop ID</span>
        <shadcn_1.Input value={shopId} onChange={function (e) { return setShopId(e.target.value); }} placeholder="my-shop"/>
        {errors.id && (<p className="text-sm text-red-600">{errors.id[0]}</p>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Store Name</span>
        <shadcn_1.Input value={storeName} onChange={function (e) { return setStoreName(e.target.value); }} placeholder="My Store"/>
        {errors.name && (<p className="text-sm text-red-600">{errors.name[0]}</p>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Logo URL</span>
        <shadcn_1.Input value={logo} onChange={function (e) { return setLogo(e.target.value); }} placeholder="https://example.com/logo.png"/>
        {errors.logo && (<p className="text-sm text-red-600">{errors.logo[0]}</p>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Contact Info</span>
        <shadcn_1.Input value={contactInfo} onChange={function (e) { return setContactInfo(e.target.value); }} placeholder="Email or phone"/>
        {errors.contactInfo && (<p className="text-sm text-red-600">{errors.contactInfo[0]}</p>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Shop Type</span>
        <shadcn_1.Select value={type} onValueChange={setType}>
          <shadcn_1.SelectTrigger className="w-full">
            <shadcn_1.SelectValue placeholder="Select type"/>
          </shadcn_1.SelectTrigger>
          <shadcn_1.SelectContent>
            <shadcn_1.SelectItem value="sale">Sale</shadcn_1.SelectItem>
            <shadcn_1.SelectItem value="rental">Rental</shadcn_1.SelectItem>
          </shadcn_1.SelectContent>
        </shadcn_1.Select>
        {errors.type && (<p className="text-sm text-red-600">{errors.type[0]}</p>)}
      </label>
      <label className="flex flex-col gap-1">
        <span>Template</span>
        <shadcn_1.Select value={template} onValueChange={setTemplate}>
          <shadcn_1.SelectTrigger className="w-full">
            <shadcn_1.SelectValue placeholder="Select template"/>
          </shadcn_1.SelectTrigger>
          <shadcn_1.SelectContent>
            {templates.map(function (t) { return (<shadcn_1.SelectItem key={t} value={t}>
                {t}
              </shadcn_1.SelectItem>); })}
          </shadcn_1.SelectContent>
        </shadcn_1.Select>
      </label>
      <div className="flex justify-end">
        <shadcn_1.Button disabled={!shopId} onClick={function () {
            markComplete(true);
            router.push("/cms/configurator");
        }}>
          Save & return
        </shadcn_1.Button>
      </div>
    </div>);
}
