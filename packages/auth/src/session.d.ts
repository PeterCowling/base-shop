import type { SessionRecord } from "./store.js";
import type { Role } from "./types/index.js";

export declare const CUSTOMER_SESSION_COOKIE = "customer_session";
export declare const CSRF_TOKEN_COOKIE = "csrf_token";
export interface CustomerSession {
    customerId: string;
    role: Role;
}
export declare function getCustomerSession(): Promise<CustomerSession | null>;
export declare function createCustomerSession(sessionData: CustomerSession): Promise<void>;
export declare function destroyCustomerSession(): Promise<void>;
export declare function listSessions(customerId: string): Promise<SessionRecord[]>;
export declare function revokeSession(sessionId: string): Promise<void>;
export declare function validateCsrfToken(token: string | null): Promise<boolean>;
//# sourceMappingURL=session.d.ts.map