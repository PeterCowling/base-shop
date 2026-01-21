import "server-only";

import { type ReturnAuthorization } from "@acme/types";

export declare const prismaReturnAuthorizationRepository: {
    readReturnAuthorizations(): Promise<ReturnAuthorization[]>;
    writeReturnAuthorizations(data: ReturnAuthorization[]): Promise<void>;
    addReturnAuthorization(ra: ReturnAuthorization): Promise<void>;
    getReturnAuthorization(raId: string): Promise<ReturnAuthorization | undefined>;
};

