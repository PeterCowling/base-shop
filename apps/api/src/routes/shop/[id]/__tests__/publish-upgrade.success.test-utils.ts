import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  authorize,
  readFileSync,
  root,
  spawn,
  writeFileSync,
} from "./publish-upgrade.test-helpers";

type JsonRecord = Record<string, unknown>;

export const mockPackageState = ({
  packageJson,
  shopJson = { componentVersions: {} },
}: {
  packageJson: JsonRecord;
  shopJson?: JsonRecord;
}) => {
  readFileSync.mockImplementation((file: string) => {
    if (file.endsWith("package.json")) {
      return JSON.stringify(packageJson);
    }
    if (file.endsWith("shop.json")) {
      return JSON.stringify(shopJson);
    }
    return "";
  });
};

export const postUpgrade = async (
  onRequestPost: OnRequestPost,
  id: string,
  {
    body,
    rawBody,
    headers,
  }: {
    body?: unknown;
    rawBody?: string | null;
    headers?: Record<string, string>;
  } = {}
) => {
  const token = authorize();
  let requestBody: string | null | undefined;
  if (rawBody !== undefined) {
    requestBody = rawBody;
  } else if (body === undefined) {
    requestBody = undefined;
  } else if (body === null) {
    requestBody = null;
  } else {
    requestBody = JSON.stringify(body);
  }

  return onRequestPost({
    params: { id },
    request: new Request("http://example.com", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, ...headers },
      body: requestBody,
    }),
  });
};

export const expectComponentsWritten = (
  id: string,
  expected: Record<string, string>
) => {
  expect(writeFileSync).toHaveBeenCalledTimes(1);
  const [shopPath, data] = writeFileSync.mock.calls[0];
  expect(shopPath).toContain(`data/shops/${id}/shop.json`);
  const written = JSON.parse(data as string);
  expect(written.componentVersions).toEqual(expected);
  expect(typeof written.lastUpgrade).toBe("string");
  return written as { componentVersions: Record<string, string>; lastUpgrade: string };
};

export const expectBuildAndDeployForShop = (id: string) => {
  expect(spawn).toHaveBeenNthCalledWith(
    1,
    "pnpm",
    ["--filter", `apps/shop-${id}`, "build"],
    { cwd: root, stdio: "inherit" }
  );
  expect(spawn).toHaveBeenNthCalledWith(
    2,
    "pnpm",
    ["--filter", `apps/shop-${id}`, "deploy"],
    { cwd: root, stdio: "inherit" }
  );
};
