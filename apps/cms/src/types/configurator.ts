import type { ReactNode } from "react";

export interface ConfiguratorStepProps {
  shopId: string;
  setShopId: (v: string) => void;
  storeName: string;
  setStoreName: (v: string) => void;
  logo: string;
  setLogo: (v: string) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
  type: "sale" | "rental";
  setType: (v: "sale" | "rental") => void;
  template: string;
  setTemplate: (v: string) => void;
  templates: string[];
  errors?: Record<string, string[]>;
  themes: string[];
  prevStepId?: string;
  nextStepId?: string;
  children?: ReactNode;
}
