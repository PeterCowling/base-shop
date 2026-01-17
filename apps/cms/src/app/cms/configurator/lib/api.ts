import { fetchJson } from "@acme/shared-utils";

export interface ApiResult<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(input, init);
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { error: message };
  }
}
