"use client";

import dynamicImport from "next/dynamic";

// ssr: false — prevents Firebase/auth provider tree from running during SSR.
// (Also avoids RSC constraint: function props cannot cross Server→Client boundary.)
const EmailAutomationContent = dynamicImport(
  () => import("./EmailAutomationContent"),
  { ssr: false }
);

export default function EmailAutomationPage() {
  return <EmailAutomationContent />;
}
