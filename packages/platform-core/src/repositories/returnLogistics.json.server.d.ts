import "server-only";

import { type ReturnLogistics } from "@acme/types";

export interface ReturnLogisticsRepository {
  readReturnLogistics(): Promise<ReturnLogistics>;
  writeReturnLogistics(data: ReturnLogistics): Promise<void>;
}

export declare const jsonReturnLogisticsRepository: ReturnLogisticsRepository;

