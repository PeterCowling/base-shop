export type RentalLineItem = {
  sku: string;
  start: string; // ISO
  end: string;   // ISO
  durationUnit: "hour" | "day" | "week";
  locationId?: string;
  deposit?: number;
  insurance?: { selected: boolean; fee?: number };
  termsVersion: string;
};

