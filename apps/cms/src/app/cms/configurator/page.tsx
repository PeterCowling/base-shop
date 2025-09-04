"use client";

import dynamic from "next/dynamic";

// Defer loading to the client to avoid any server-side side effects during
// module evaluation in development.
const ConfiguratorDashboard = dynamic(() => import("./Dashboard"), {
  ssr: false,
});
const GuidedTour = dynamic(() => import("./GuidedTour"), { ssr: false });

export default function ConfiguratorPage() {
  return (
    <GuidedTour>
      <ConfiguratorDashboard />
    </GuidedTour>
  );
}
