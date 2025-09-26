"use client";

import { Toast } from "@/components/atoms";
import { ButtonElement } from "./components/DashboardPrimitives";
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
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
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
          <div className="flex justify-center">
            <ButtonElement
              onClick={launchPanelData.onLaunch}
              disabled={!launchPanelData.allRequiredDone}
              className={
                (launchPanelData.allRequiredDone
                  ? "bg-primary text-primary-fg hover:bg-primary/90 "
                  : "opacity-60 cursor-not-allowed ") +
                "h-16 w-48 rounded-full text-2xl font-extrabold"
              }
            >
              GO
            </ButtonElement>
          </div>
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
