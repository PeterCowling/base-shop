export interface ProviderErrorFields {
  code?: number;
  statusCode?: number;
  retryable?: boolean;
  response?: {
    statusCode?: number;
  };
}

export function hasProviderErrorFields(
  err: unknown
): err is ProviderErrorFields {
  return typeof err === "object" && err !== null;
}
