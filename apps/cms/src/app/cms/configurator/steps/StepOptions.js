"use client";
"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepOptions;
var shadcn_1 = require("@/components/atoms/shadcn");
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
function StepOptions() {
    var _a = (0, ConfiguratorContext_1.useConfigurator)(), state = _a.state, update = _a.update;
    var shopId = state.shopId, payment = state.payment, shipping = state.shipping, analyticsProvider = state.analyticsProvider, analyticsId = state.analyticsId;
    var setPayment = function (v) { return update("payment", v); };
    var setShipping = function (v) { return update("shipping", v); };
    var setAnalyticsProvider = function (v) { return update("analyticsProvider", v); };
    var setAnalyticsId = function (v) { return update("analyticsId", v); };
    var router = (0, navigation_1.useRouter)();
    var searchParams = (0, navigation_1.useSearchParams)();
    var _b = (0, useStepCompletion_1.default)("options"), markComplete = _b[1];
    (0, react_1.useEffect)(function () {
        var provider = searchParams.get("connected");
        if (!provider)
            return;
        if (["stripe", "paypal"].includes(provider) && !payment.includes(provider)) {
            setPayment(__spreadArray(__spreadArray([], payment, true), [provider], false));
        }
        if (["dhl", "ups"].includes(provider) && !shipping.includes(provider)) {
            setShipping(__spreadArray(__spreadArray([], shipping, true), [provider], false));
        }
        router.replace("/cms/configurator");
    }, [searchParams, payment, shipping, router]);
    function connect(provider) {
        var url = "/cms/api/providers/".concat(provider, "?shop=").concat(encodeURIComponent(shopId));
        window.location.href = url;
    }
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Options</h2>
      <p className="text-sm text-muted-foreground">
        Provider integrations require their plugins to be installed under
        <code>packages/plugins</code>. After connecting you can configure each
        plugin from <strong>CMS → Plugins</strong>.
      </p>
      <div>
        <p className="font-medium">Payment Providers</p>
        <div className="flex items-center gap-2 text-sm">
          Stripe
          {payment.includes("stripe") ? (<shadcn_1.Button disabled>Connected</shadcn_1.Button>) : (<shadcn_1.Button onClick={function () { return connect("stripe"); }}>Connect</shadcn_1.Button>)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          PayPal
          {payment.includes("paypal") ? (<shadcn_1.Button disabled>Connected</shadcn_1.Button>) : (<shadcn_1.Button onClick={function () { return connect("paypal"); }}>Connect</shadcn_1.Button>)}
        </div>
      </div>
      <div>
        <p className="font-medium">Shipping Providers</p>
        <div className="flex items-center gap-2 text-sm">
          DHL
          {shipping.includes("dhl") ? (<shadcn_1.Button disabled>Connected</shadcn_1.Button>) : (<shadcn_1.Button onClick={function () { return connect("dhl"); }}>Connect</shadcn_1.Button>)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          UPS
          {shipping.includes("ups") ? (<shadcn_1.Button disabled>Connected</shadcn_1.Button>) : (<shadcn_1.Button onClick={function () { return connect("ups"); }}>Connect</shadcn_1.Button>)}
        </div>
      </div>
      <div>
        <p className="font-medium">Analytics</p>
        <shadcn_1.Select value={analyticsProvider} onValueChange={function (v) { return setAnalyticsProvider(v === "none" ? "" : v); }}>
          <shadcn_1.SelectTrigger className="w-full">
            <shadcn_1.SelectValue placeholder="Select provider"/>
          </shadcn_1.SelectTrigger>
          <shadcn_1.SelectContent>
            <shadcn_1.SelectItem value="none">None</shadcn_1.SelectItem>
            <shadcn_1.SelectItem value="ga">Google Analytics</shadcn_1.SelectItem>
          </shadcn_1.SelectContent>
        </shadcn_1.Select>
        {analyticsProvider === "ga" && (<shadcn_1.Input className="mt-2" value={analyticsId} onChange={function (e) { return setAnalyticsId(e.target.value); }} placeholder="Measurement ID"/>)}
      </div>
      <div className="flex justify-end">
        <shadcn_1.Button onClick={function () {
            markComplete(true);
            router.push("/cms/configurator");
        }}>
          Save & return
        </shadcn_1.Button>
      </div>
    </div>);
}
