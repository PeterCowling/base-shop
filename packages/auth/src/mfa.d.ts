export interface MfaEnrollment {
    secret: string;
    otpauth: string;
}
export declare function enrollMfa(customerId: string): Promise<MfaEnrollment>;
export declare function verifyMfa(customerId: string, token: string): Promise<boolean>;
export declare function isMfaEnabled(customerId: string): Promise<boolean>;
//# sourceMappingURL=mfa.d.ts.map