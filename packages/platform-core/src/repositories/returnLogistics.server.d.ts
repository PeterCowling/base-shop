import "server-only";

import { type ReturnLogistics } from "@acme/types";

export declare function readReturnLogistics(): Promise<ReturnLogistics>;
export declare function writeReturnLogistics(data: ReturnLogistics): Promise<void>;
