import { jest } from "@jest/globals";
import path from "path";

jest.mock("@acme/shared-utils", () => ({ logger: { warn: jest.fn() } }));
jest.mock("fs", () => ({ readFileSync: jest.fn(), writeFileSync: jest.fn() }));
jest.mock("child_process", () => ({ spawn: jest.fn() }));

import { logger } from "@acme/shared-utils";
import { readFileSync, writeFileSync } from "fs";
import { spawn } from "child_process";

export { logger, readFileSync, writeFileSync, spawn };
export { default as jwt } from "jsonwebtoken";

export const root = path.resolve(__dirname, "..", "../../../../../..");
export const defaultShopId = "test-shop";

export type OnRequestPost = typeof import("../publish-upgrade").onRequestPost;

export const loadOnRequestPost = async (): Promise<OnRequestPost> => {
  const module = await import("../publish-upgrade");
  return module.onRequestPost;
};

export const resetTestState = () => {
  (readFileSync as jest.Mock).mockReset();
  (writeFileSync as jest.Mock).mockReset();
  (spawn as jest.Mock).mockReset();
  (logger.warn as jest.Mock).mockReset();
  delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
};

export const mockSuccessfulSpawn = () => {
  (spawn as jest.Mock).mockImplementation(() => ({
    on: (event: string, cb: (code: number) => void) => {
      if (event === "close") cb(0);
    },
  }));
};
