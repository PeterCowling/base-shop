import { type NextRequest } from "next/server";
import path from "path";
import { __setMockSession } from "next-auth";
const setupSanityBlog = jest.fn();
const parseJsonBody = jest.fn();

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));
jest.mock("@cms/actions/setupSanityBlog", () => ({ setupSanityBlog }));
jest.mock("@shared-utils", () => ({ parseJsonBody }));

const mkdir = jest.fn();
const writeFile = jest.fn();
jest.mock("fs", () => ({ promises: { mkdir, writeFile } }));

const resolveDataRoot = jest.fn();
jest.mock("@acme/platform-core/dataRoot", () => ({ resolveDataRoot }));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
  resolveDataRoot.mockReturnValue("/data");
  mkdir.mockResolvedValue(undefined);
  writeFile.mockResolvedValue(undefined);
  setupSanityBlog.mockResolvedValue(undefined as any);
});

function req(body: Record<string, string>): NextRequest {
  parseJsonBody.mockResolvedValue({ data: body });
  return {} as NextRequest;
}

describe("POST", () => {
  it("writes env vars and sets up blog", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const res = await POST(
      req({
        SANITY_PROJECT_ID: "p",
        SANITY_DATASET: "d",
        SANITY_TOKEN: "t",
        ENABLE_EDITORIAL: "true",
        PROMOTE_SCHEDULE: "0 0 * * *",
        FOO: "bar",
      }),
      { params: Promise.resolve({ shopId: "s1" }) },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mkdir).toHaveBeenCalledWith(path.join("/data", "s1"), {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      path.join("/data", "s1", ".env"),
      expect.stringContaining("FOO=bar"),
      "utf8",
    );
    expect(setupSanityBlog).toHaveBeenCalledWith(
      { projectId: "p", dataset: "d", token: "t" },
      { enabled: true, promoteSchedule: "0 0 * * *" },
    );
  });

  it("returns 400 when write fails", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    writeFile.mockRejectedValueOnce(new Error("disk"));
    const res = await POST(req({ FOO: "bar" }), {
      params: Promise.resolve({ shopId: "s1" }),
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "disk" });
  });
});
