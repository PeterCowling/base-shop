// packages/ui/src/components/cms/page-builder/panels/MotionPresets.ts
import type { PageComponent } from "@acme/types";

export type MotionPreset = {
  id: string;
  labelKey: string;
  apply: (handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void) => void;
};

export const motionPresets: MotionPreset[] = [
  {
    id: "gentle-fade",
    labelKey: "cms.motion.preset.gentleFade",
    apply: (set) => {
      (set as unknown as (f: string, v: unknown) => void)("animation", "fade");
      (set as unknown as (f: string, v: unknown) => void)("animationDuration", 600);
      (set as unknown as (f: string, v: unknown) => void)(
        "animationEasing",
        /* i18n-exempt -- TECH-1234 [ttl=2025-12-31]: CSS easing value */ "cubic-bezier(0.37, 0, 0.63, 1)",
      ); // Sine InOut
    },
  },
  {
    id: "slide-up",
    labelKey: "cms.motion.preset.slideUp",
    apply: (set) => {
      (set as unknown as (f: string, v: unknown) => void)("animation", "slide-up");
      (set as unknown as (f: string, v: unknown) => void)("animationDuration", 500);
      (set as unknown as (f: string, v: unknown) => void)(
        "animationEasing",
        /* i18n-exempt -- TECH-1234 [ttl=2025-12-31]: CSS easing value */ "cubic-bezier(0.22, 1, 0.36, 1)",
      ); // Quint Out
    },
  },
  {
    id: "pop-zoom",
    labelKey: "cms.motion.preset.popZoom",
    apply: (set) => {
      (set as unknown as (f: string, v: unknown) => void)("animation", "zoom");
      (set as unknown as (f: string, v: unknown) => void)("animationDuration", 400);
      (set as unknown as (f: string, v: unknown) => void)(
        "animationEasing",
        /* i18n-exempt -- TECH-1234 [ttl=2025-12-31]: CSS easing value */ "cubic-bezier(0.34, 1.56, 0.64, 1)",
      ); // Back Out
    },
  },
  {
    id: "rotate-in",
    labelKey: "cms.motion.preset.rotateIn",
    apply: (set) => {
      (set as unknown as (f: string, v: unknown) => void)("animation", "rotate");
      (set as unknown as (f: string, v: unknown) => void)("animationDuration", 700);
      (set as unknown as (f: string, v: unknown) => void)(
        "animationEasing",
        /* i18n-exempt -- TECH-1234 [ttl=2025-12-31]: CSS easing value */ "cubic-bezier(0.33, 1, 0.68, 1)",
      ); // Cubic Out
    },
  },
];
