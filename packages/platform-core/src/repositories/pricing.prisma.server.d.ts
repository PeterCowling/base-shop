import "server-only";

import { type PricingMatrix } from "@acme/types";

export interface PricingRepository {
  read(): Promise<PricingMatrix>;
  write(data: PricingMatrix): Promise<void>;
}
export declare const prismaPricingRepository: PricingRepository;
