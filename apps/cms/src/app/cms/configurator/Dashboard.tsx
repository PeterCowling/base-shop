"use client";

import { Toast } from "@/components/atoms";
import ConfiguratorStepList from "./components/ConfiguratorStepList";
import { ConfiguratorHero } from "./components/ConfiguratorHero";
import { LaunchPanel } from "./components/LaunchPanel";
import { TrackProgressList } from "./components/TrackProgressList";
import { useConfiguratorDashboardState } from "./hooks/useConfiguratorDashboardState";

export default function ConfiguratorDashboard() {
  const {
    state,
    steps,
    skipStep,
    resetStep,
    onStepClick,
    toast,
    dismissToast,
    heroData,
    trackProgress,
    launchPanelData,
  } = useConfiguratorDashboardState();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero text-primary-foreground shadow-xl">
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <ConfiguratorHero {...heroData} />
          <LaunchPanel {...launchPanelData} />
        </div>
      </section>

      <section id="configurator-steps" className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <ConfiguratorStepList
          state={state}
          steps={steps}
          skipStep={skipStep}
          resetStep={resetStep}
          onStepClick={onStepClick}
        />
        <div className="space-y-6">
          <TrackProgressList items={trackProgress} />
        </div>
      </section>

      {toast.open && (
        <Toast
          open={toast.open}
          message={toast.message}
          onClose={dismissToast}
        />
      )}
    </div>
  );
}
