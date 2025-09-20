// Lightweight Next.js server module mock for tests
// Provides class-based NextResponse with cookies support and a NextRequest constructor.
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export class NextResponse extends Response {
  public cookies: ResponseCookies;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    // Bind cookies helper to this Response's headers so set() appends Set-Cookie
    this.cookies = new ResponseCookies(this.headers as any);
  }

  static json(
    body: unknown,
    init?: { status?: number; headers?: Record<string, string> },
  ): NextResponse {
    const status = init?.status ?? 200;
    const headers = new Headers({
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    });
    return new NextResponse(JSON.stringify(body), { status, headers });
  }

  static next(): NextResponse {
    const headers = new Headers({ "x-middleware-next": "1" });
    return new NextResponse(null, { status: 200, headers });
  }

  static redirect(url: string | URL, init?: number | ResponseInit): NextResponse {
    const status = typeof init === "number" ? init : (init as ResponseInit | undefined)?.status || 307;
    const headers = new Headers(
      typeof init === "number" ? undefined : (init as ResponseInit | undefined)?.headers,
    );
    headers.set("location", url.toString());
    return new NextResponse(null, { status, headers });
  }
}

export class NextRequest extends Request {
  public cookies: { get: (name: string) => { name: string; value: string } | undefined };
  public nextUrl: URL;
  constructor(input: string | URL, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(typeof input === 'string' ? input : input.toString());
    const cookieHeader = new Headers(init?.headers as any).get('cookie') ?? '';
    this.cookies = {
      get: (name: string) => {
        const parts = cookieHeader.split(/;\s*/).filter(Boolean);
        for (const part of parts) {
          const [k, v] = part.split('=');
          if (k === name) return { name, value: v } as const;
        }
        return undefined;
      },
    };
  }
}

export default {} as never;
