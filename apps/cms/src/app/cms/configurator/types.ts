import type { ComponentType } from "react";
import type { ConfiguratorStepProps } from "@/types/configurator";

export interface ConfiguratorStep {
  id: string;
  label: string;
  component: ComponentType<ConfiguratorStepProps>;
  optional?: boolean;
  /** IDs of steps that are recommended to complete before this step */
  recommended?: string[];
}
