import "server-only";
export type OidcConfig = {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectOrigin: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
    enforcePkce: boolean;
    scope: string;
};
export declare function loadOidcConfig(): OidcConfig;
