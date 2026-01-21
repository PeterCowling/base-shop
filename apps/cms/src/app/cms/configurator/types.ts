import type { ComponentType } from "react";

import type { ConfiguratorStepProps } from "@/types/configurator";

export type ConfiguratorStepTrack =
  | "foundation"
  | "experience"
  | "operations"
  | "growth";

export interface ConfiguratorStep {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  track?: ConfiguratorStepTrack;
  component: ComponentType<ConfiguratorStepProps>;
  optional?: boolean;
  /** IDs of steps that are recommended to complete before this step */
  recommended?: string[];
}
