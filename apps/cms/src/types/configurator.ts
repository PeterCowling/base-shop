import type { ReactNode } from "react";
import type { ShopLogo } from "@acme/types";

export interface ConfiguratorStepProps {
  shopId: string;
  setShopId: (v: string) => void;
  storeName: string;
  setStoreName: (v: string) => void;
  logo: ShopLogo;
  setLogo: (v: ShopLogo) => void;
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
