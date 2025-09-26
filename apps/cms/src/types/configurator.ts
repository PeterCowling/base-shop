import type { ReactNode } from "react";

export interface ConfiguratorStepProps {
  shopId: string;
  setShopId: (v: string) => void;
  storeName: string;
  setStoreName: (v: string) => void;
  logo: Record<string, string>;
  setLogo: (v: Record<string, string>) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
  type: "sale" | "rental";
  setType: (v: "sale" | "rental") => void;
  errors?: Record<string, string[]>;
  themes: string[];
  prevStepId?: string;
  nextStepId?: string;
  children?: ReactNode;
}
