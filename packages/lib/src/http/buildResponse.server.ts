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
export function buildResponse(proxyResponse: ProxyResponse): Response {
  const { status, headers, body } = proxyResponse.response;
  const decodedBody = body ? Buffer.from(body, "base64") : null;
  const finalHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    finalHeaders.set(key, value);
  }
  return new Response(decodedBody, { status, headers: finalHeaders });
}
