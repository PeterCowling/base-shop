// apps/cms/src/app/(auth)/login/page.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
var react_1 = require("react");
var LoginForm_1 = require("./LoginForm");
/**
 * Default destination when no `callbackUrl` query param is present.
 * Adjust this value if your app has a different post-login landing route.
 */
var fallbackUrl = "/cms";
function LoginPage() {
    // In some dev environments a stale service worker from other apps may
    // intercept requests and break the login flow. Unregister all service
    // workers on first load to avoid these issues.
    (0, react_1.useEffect)(function () {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .getRegistrations()
                .then(function (regs) { return regs.forEach(function (r) { return r.unregister(); }); })
                .catch(function () { return undefined; });
        }
    }, []);
    return (<react_1.Suspense fallback={null}>
      <LoginForm_1.default fallbackUrl={fallbackUrl}/>
    </react_1.Suspense>);
}
