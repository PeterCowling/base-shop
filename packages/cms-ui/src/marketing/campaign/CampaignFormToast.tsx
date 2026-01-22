"use client";

import { Toast } from "@acme/design-system/atoms";

import type { CampaignFormToastState } from "./useCampaignForm";

interface CampaignFormToastProps extends CampaignFormToastState {
  onClose: () => void;
}

export function CampaignFormToast({ open, message, onClose }: CampaignFormToastProps) {
  return <Toast open={open} message={message} onClose={onClose} />;
}

export default CampaignFormToast;
