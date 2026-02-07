"use client";

import dynamic from "next/dynamic";

import { Loader } from "@/components/atoms";

// Defer loading to the client to avoid any server-side side effects during
// module evaluation in development.
const Loading = () => (
  <div className="flex items-center justify-center p-10">
    <Loader />
  </div>
);

const ConfiguratorDashboard = dynamic(() => import("./Dashboard"), {
  ssr: false,
  loading: Loading,
});
const GuidedTour = dynamic(() => import("./GuidedTour"), {
  ssr: false,
  loading: ({ isLoading }) => (isLoading ? <Loading /> : null),
});

export default function ConfiguratorPage() {
  return (
    <GuidedTour>
      <ConfiguratorDashboard />
    </GuidedTour>
  );
}
