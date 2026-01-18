import "server-only";
import { type TokenSet } from "openid-client";
export type OidcProfile = {
    issuer: string;
    subject: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
};
export type OidcLoginStart = {
    authorizationUrl: string;
    flowId: string;
};
export type OidcLoginResult = {
    profile: OidcProfile;
    tokenSet: TokenSet;
    returnTo: string;
};
export declare function beginOidcLogin(params: {
    returnTo: string;
}): Promise<OidcLoginStart>;
export declare function completeOidcLogin(params: {
    state: string;
    code: string;
    flowId: string;
}): Promise<OidcLoginResult>;
export declare function buildOidcLogoutUrl(params?: {
    idTokenHint?: string;
}): Promise<string | null>;
