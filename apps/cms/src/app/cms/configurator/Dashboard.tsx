"use client";

import { Toast } from "@/components/atoms";
import { ButtonElement } from "./components/DashboardPrimitives";
import ConfiguratorStepList from "./components/ConfiguratorStepList";
import { ConfiguratorHero } from "./components/ConfiguratorHero";
import { LaunchPanel } from "./components/LaunchPanel";
import { TrackProgressList } from "./components/TrackProgressList";
import { useConfiguratorDashboardState } from "./hooks/useConfiguratorDashboardState";
import { useTranslations } from "@acme/i18n";

export default function ConfiguratorDashboard() {
  const t = useTranslations();
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
    quickLaunch,
    quickLaunchBusy,
  } = useConfiguratorDashboardState();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-8 p-8 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            <ConfiguratorHero {...heroData} />
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonElement
                className="h-10 px-4 text-xs font-semibold border border-primary/40 bg-primary/5 text-hero-foreground hover:bg-primary/10"
                onClick={quickLaunch}
                disabled={quickLaunchBusy}
              >
                {quickLaunchBusy
                  ? t("cms.configurator.hero.quickLaunchBusy")
                  : t("cms.configurator.hero.quickLaunch")}
              </ButtonElement>
            </div>
          </div>
          <div className="lg:col-span-1">
            <LaunchPanel {...launchPanelData} />
          </div>
        </div>
      </section>

      {/* i18n-exempt -- CMS-1043 non-UI element id [ttl=2025-12-31] */}
      <section id="configurator-steps" className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConfiguratorStepList
            state={state}
            steps={steps}
            skipStep={skipStep}
            resetStep={resetStep}
            onStepClick={onStepClick}
          />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <TrackProgressList items={trackProgress} />
          <div className="flex justify-center">
            <ButtonElement
              onClick={launchPanelData.onLaunch}
              disabled={!launchPanelData.allRequiredDone}
              className={
                (launchPanelData.allRequiredDone
                  ? /* i18n-exempt -- CMS-1043 utility classes; not user copy [ttl=2025-12-31] */ "bg-primary text-primary-fg hover:bg-primary/90 "
                  : /* i18n-exempt -- CMS-1043 utility classes; not user copy [ttl=2025-12-31] */ "opacity-60 cursor-not-allowed ") +
                /* i18n-exempt -- CMS-1043 utility classes; not user copy [ttl=2025-12-31] */ "h-16 w-48 rounded-full text-2xl font-extrabold"
              }
            >
              {t("cms.configurator.launch")}
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
