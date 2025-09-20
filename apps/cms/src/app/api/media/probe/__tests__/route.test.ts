import { __setMockSession } from "next-auth";
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

let GET: typeof import("../route").GET;

const originalFetch = global.fetch;
let fetchMock: jest.MockedFunction<typeof fetch>;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn<typeof fetch>();
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = originalFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("GET", () => {
  it("returns content type for valid authenticated probe", async () => {
    __setMockSession({ user: { id: "user" } } as any);
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "content-type": "image/png" },
      })
    );

    const target = encodeURIComponent("https://cdn.example/assets/logo.png");
    const res = await GET(new Request(`https://cms.local/api/media/probe?url=${target}`));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [urlArg, initArg] = fetchMock.mock.calls[0];
    expect(urlArg).toBeInstanceOf(URL);
    expect((urlArg as URL).href).toBe("https://cdn.example/assets/logo.png");
    expect(initArg).toEqual({ method: "HEAD" });
  });

  it("returns 401 for unauthenticated requests", async () => {
    __setMockSession(null as any);

    const res = await GET(
      new Request(
        `https://cms.local/api/media/probe?url=${encodeURIComponent("https://example.com/image.jpg")}`
      )
    );

    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects requests targeting private networks", async () => {
    __setMockSession({ user: { id: "user" } } as any);

    const res = await GET(
      new Request(
        `https://cms.local/api/media/probe?url=${encodeURIComponent("http://127.0.0.1/internal.png")}`
      )
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid url");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
