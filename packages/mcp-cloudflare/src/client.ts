const CF_API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

export function getAccountId(): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is required");
  }
  return accountId;
}

export function getApiToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN environment variable is required");
  }
  return token;
}

export async function cfFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${CF_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as CloudflareResponse<T>;

  if (!data.success) {
    const errorMessage =
      data.errors?.[0]?.message || `Cloudflare API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data.result;
}

export async function cfFetchWithInfo<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ result: T; resultInfo?: CloudflareResponse<T>["result_info"] }> {
  const url = path.startsWith("http") ? path : `${CF_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as CloudflareResponse<T>;

  if (!data.success) {
    const errorMessage =
      data.errors?.[0]?.message || `Cloudflare API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return { result: data.result, resultInfo: data.result_info };
}
