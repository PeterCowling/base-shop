import { jest } from "@jest/globals";
import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import jwt from "jsonwebtoken";
import path from "path";

import { logger } from "@acme/lib/logger";

jest.mock("@acme/lib/logger", () => ({
  logger: { warn: jest.fn() },
}));
jest.mock("@acme/lib/context", () => ({
  withRequestContext: (_ctx: unknown, fn: () => unknown) => fn(),
}));
jest.mock("fs", () => ({ readFileSync: jest.fn(), writeFileSync: jest.fn() }));
jest.mock("child_process", () => ({ spawn: jest.fn() }));

export { jwt,logger, readFileSync, spawn, writeFileSync };

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

export const authorize = () => {
  process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
  return jwt.sign({}, "secret");
};
