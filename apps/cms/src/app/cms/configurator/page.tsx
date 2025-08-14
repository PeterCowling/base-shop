import ConfiguratorDashboard from "./Dashboard";
import GuidedTour from "./GuidedTour";

export default function ConfiguratorPage() {
  return (
    <GuidedTour>
      <ConfiguratorDashboard />
    </GuidedTour>
  );
}

