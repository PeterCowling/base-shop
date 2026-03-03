"use client";

import dynamicImport from "next/dynamic";

// Dynamically import with ssr: false to prevent Firebase initialization during SSR.
// SSR-rendering the Firebase/auth provider tree causes side-effects in the Node.js
// process that make every subsequent request to this route return 400.
const BarContent = dynamicImport(() => import("./BarContent"), { ssr: false });

export default function BarPage() {
  return <BarContent />;
}
