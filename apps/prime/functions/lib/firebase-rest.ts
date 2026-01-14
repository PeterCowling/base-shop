/**
 * Firebase REST API helper for Cloudflare Pages Functions.
 *
 * Uses Firebase REST API instead of the Node.js SDK for Workers compatibility.
 */

export interface FirebaseEnv {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

export class FirebaseRest {
  private databaseUrl: string;
  private apiKey?: string;

  constructor(env: FirebaseEnv) {
    this.databaseUrl = env.CF_FIREBASE_DATABASE_URL;
    this.apiKey = env.CF_FIREBASE_API_KEY;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Firebase REST API expects .json suffix
    const url = new URL(`${this.databaseUrl}${cleanPath}.json`);

    if (this.apiKey) {
      url.searchParams.set('auth', this.apiKey);
    }

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T | null> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Firebase GET failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as T | null;
    return data;
  }

  async set<T = unknown>(path: string, data: T): Promise<void> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Firebase SET failed: ${response.status} ${response.statusText}`);
    }
  }

  async update<T = unknown>(path: string, data: Partial<T>): Promise<void> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Firebase UPDATE failed: ${response.status} ${response.statusText}`);
    }
  }

  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Firebase DELETE failed: ${response.status} ${response.statusText}`);
    }
  }
}

// Helper to create JSON responses
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}
