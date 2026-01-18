import "server-only";
export declare const OIDC_FLOW_TTL_S: number;
export type OidcAuthFlowRecord = {
    state: string;
    nonce: string;
    codeVerifier: string;
    redirectUri: string;
    returnTo: string;
    flowId: string;
    createdAt: Date;
};
export interface OidcAuthFlowStore {
    get(state: string): Promise<OidcAuthFlowRecord | null>;
    set(record: OidcAuthFlowRecord): Promise<void>;
    delete(state: string): Promise<void>;
}
export declare function createOidcAuthFlowStore(): Promise<OidcAuthFlowStore>;
