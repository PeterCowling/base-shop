export interface ProviderErrorFields {
  code?: number;
  statusCode?: number;
  /** Some libraries expose the HTTP status under `status` */
  status?: number | string;
  retryable?: boolean;
  response?: {
    statusCode?: number;
    status?: number | string;
  };
}

export function hasProviderErrorFields(
  err: unknown
): err is ProviderErrorFields {
  return typeof err === "object" && err !== null;
}
