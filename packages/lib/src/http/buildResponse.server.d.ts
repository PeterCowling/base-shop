import "server-only";
export interface ProxyResponse {
    response: {
        status: number;
        headers: Record<string, string>;
        body?: string | null;
    };
}
/**
 * Build a Fetch API Response from a proxy response object used by the
 * type writer when talking to an external API. The proxy encodes the body
 * as base64; this helper decodes it and rehydrates the headers.
 */
export declare function buildResponse(proxyResponse: ProxyResponse): Response;
//# sourceMappingURL=buildResponse.server.d.ts.map