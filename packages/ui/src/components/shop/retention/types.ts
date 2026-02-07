import type React from "react";

export type DeviceBrandFamily = "cochlear" | "ab" | "medel" | "other";
export type DeviceWearingStyle = "behind-the-ear" | "off-the-ear";

export type DeviceSetup = {
  brandFamily?: DeviceBrandFamily;
  wearingStyle?: DeviceWearingStyle;
  bilateral?: boolean;
};

export type SizeOption = {
  key: string;
  label: string;
  description?: string;
};

export type MaterialAttributeKey =
  | "breathable"
  | "soft"
  | "stretch"
  | "washable"
  | "quick-dry"
  | "grip"
  | "lightweight";

export type MaterialOption = {
  key: string;
  name: string;
  bestFor?: string;
  attributes?: Array<{ key: MaterialAttributeKey; label: string }>;
  details?: string;
  badge?: string;
};

export type PatternTheme =
  | "animals"
  | "florals"
  | "geometric"
  | "solid"
  | "seasonal"
  | "other";

export type PatternColorFamily =
  | "neutral"
  | "pink"
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "multi";

export type PatternContrast = "high" | "standard";

export type PatternOption = {
  key: string;
  name: string;
  theme: PatternTheme;
  colorFamily: PatternColorFamily;
  contrast: PatternContrast;
  kidFriendly?: boolean;
  tags?: string[];
  /** Visual preview token; consumers can interpret as CSS background or image src. */
  preview: { type: "css"; style: React.CSSProperties } | { type: "image"; src: string; alt?: string };
};
