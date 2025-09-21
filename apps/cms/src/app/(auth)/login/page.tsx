// apps/cms/src/app/(auth)/login/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import LoginForm from "./LoginForm";

/**
 * Default destination when no `callbackUrl` query param is present.
 * Adjust this value if your app has a different post-login landing route.
 */
const fallbackUrl: string = "/cms";

export default function LoginPage() {
  // In some dev environments a stale service worker from other apps may
  // intercept requests and break the login flow. Unregister all service
  // workers on first load to avoid these issues.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => undefined);
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center">
      <Suspense fallback={null}>
        <div className="w-full max-w-md mx-auto">
          <LoginForm fallbackUrl={fallbackUrl} />
        </div>
      </Suspense>
    </div>
  );
}
