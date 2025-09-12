export interface MfaEnrollment {
    secret: string;
    otpauth: string;
}
export interface MfaToken {
    token: string;
    expiresAt: Date;
}
export declare function enrollMfa(customerId: string): Promise<MfaEnrollment>;
export declare function verifyMfa(customerId: string, token: string): Promise<boolean>;
export declare function isMfaEnabled(customerId: string): Promise<boolean>;
export declare function generateMfaToken(ttlMs?: number): MfaToken;
export declare function verifyMfaToken(token: string, data: MfaToken): boolean;
//# sourceMappingURL=mfa.d.ts.map