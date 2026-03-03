"use client";

import dynamicImport from "next/dynamic";

// ssr: false — prevents Firebase/auth provider tree from running during SSR.
// (Also avoids RSC constraint: function props cannot cross Server→Client boundary.)
const PrepaymentsContent = dynamicImport(() => import("./PrepaymentsContent"), {
  ssr: false,
});

export default function PrepaymentsPage() {
  return <PrepaymentsContent />;
}
