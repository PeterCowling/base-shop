import "server-only";

import { type ReturnAuthorization } from "@acme/types";

export declare function readReturnAuthorizations(): Promise<ReturnAuthorization[]>;
export declare function writeReturnAuthorizations(data: ReturnAuthorization[]): Promise<void>;
export declare function addReturnAuthorization(ra: ReturnAuthorization): Promise<void>;
export declare function getReturnAuthorization(raId: string): Promise<ReturnAuthorization | undefined>;
