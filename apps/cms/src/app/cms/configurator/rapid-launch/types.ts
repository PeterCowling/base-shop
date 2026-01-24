"use client";

import type { ComponentType } from "react";

export interface RapidLaunchStepProps {
  prevStepId?: string;
  nextStepId?: string;
}

export interface RapidLaunchStep {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  component: ComponentType<RapidLaunchStepProps>;
}
