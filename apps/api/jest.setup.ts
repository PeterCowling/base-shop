import { fetch as undiciFetch, Response, Request, Headers } from "undici";

const g = globalThis as typeof globalThis & Record<string, unknown>;

// Ensure WHATWG fetch primitives exist in Node environment
g.fetch ||= undiciFetch;
g.Response ||= Response;
g.Request ||= Request;
g.Headers ||= Headers;

// Attach a spec-compliant static Response.json() implementation centrally
// (ensures content-type header is set consistently across tests)
import "../../test/setup-response-json";
