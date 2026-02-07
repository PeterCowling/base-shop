type SimpleReq = {
    headers?: Record<string, string | undefined>;
    url?: string;
};
export declare function getCsrfToken(req?: Request | SimpleReq): string | undefined;
export {};
//# sourceMappingURL=getCsrfToken.d.ts.map