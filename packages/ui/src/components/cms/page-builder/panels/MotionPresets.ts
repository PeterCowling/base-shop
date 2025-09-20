// packages/ui/src/components/cms/page-builder/panels/MotionPresets.ts
import type { PageComponent } from "@acme/types";

export type MotionPreset = {
  id: string;
  label: string;
  apply: (handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void) => void;
};

export const motionPresets: MotionPreset[] = [
  {
    id: "gentle-fade",
    label: "Gentle Fade",
    apply: (set) => {
      set("animation" as any, "fade" as any);
      set("animationDuration" as any, 600 as any);
      set("animationEasing" as any, "cubic-bezier(0.37, 0, 0.63, 1)" as any); // Sine InOut
    },
  },
  {
    id: "slide-up",
    label: "Slide Up",
    apply: (set) => {
      set("animation" as any, "slide-up" as any);
      set("animationDuration" as any, 500 as any);
      set("animationEasing" as any, "cubic-bezier(0.22, 1, 0.36, 1)" as any); // Quint Out
    },
  },
  {
    id: "pop-zoom",
    label: "Pop Zoom",
    apply: (set) => {
      set("animation" as any, "zoom" as any);
      set("animationDuration" as any, 400 as any);
      set("animationEasing" as any, "cubic-bezier(0.34, 1.56, 0.64, 1)" as any); // Back Out
    },
  },
  {
    id: "rotate-in",
    label: "Rotate In",
    apply: (set) => {
      set("animation" as any, "rotate" as any);
      set("animationDuration" as any, 700 as any);
      set("animationEasing" as any, "cubic-bezier(0.33, 1, 0.68, 1)" as any); // Cubic Out
    },
  },
];

