"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV_KEYS = void 0;
exports.default = StepEnvVars;
var shadcn_1 = require("@/components/atoms/shadcn");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
var ENV_KEYS = [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXTAUTH_SECRET",
    "PREVIEW_TOKEN_SECRET",
    "NODE_ENV",
    "OUTPUT_EXPORT",
    "NEXT_PUBLIC_PHASE",
    "NEXT_PUBLIC_DEFAULT_SHOP",
    "NEXT_PUBLIC_SHOP_ID",
    "CART_TTL",
    "CMS_SPACE_URL",
    "CMS_ACCESS_TOKEN",
    "CHROMATIC_PROJECT_TOKEN",
    "GMAIL_USER",
    "GMAIL_PASS",
    "SANITY_PROJECT_ID",
    "SANITY_DATASET",
    "SANITY_TOKEN",
];
exports.ENV_KEYS = ENV_KEYS;
function StepEnvVars(_a) {
    var env = _a.env, setEnv = _a.setEnv;
    var _b = (0, useStepCompletion_1.default)("env-vars"), markComplete = _b[1];
    var router = (0, navigation_1.useRouter)();
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Environment Variables</h2>
      <p className="text-sm text-muted-foreground">
        Provide credentials for any services your shop will use. Fields left
        empty will be written as placeholders so you can update them later.
        Some providers also require a plugin under <code>packages/plugins</code>
        – see the setup docs for details.
      </p>
      {ENV_KEYS.map(function (key) {
            var _a;
            return (<label key={key} className="flex flex-col gap-1">
          <span>{key}</span>
          <shadcn_1.Input type={key.startsWith("NEXT_PUBLIC") ? "text" : "password"} value={(_a = env[key]) !== null && _a !== void 0 ? _a : ""} onChange={function (e) { return setEnv(key, e.target.value); }} placeholder={key}/>
        </label>);
        })}
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
