/* eslint-disable ds/no-hardcoded-copy, security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] deterministic e2e harness with temp filesystem paths */

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const SERVER_START_TIMEOUT_MS = 180_000;
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAf8LQZgAAAAASUVORK5CYII=";

export type UploaderHarness = {
  adminToken: string;
  baseUrl: string;
  imageRelativePath: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

async function reservePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to reserve a TCP port.")));
        return;
      }
      const { port } = address;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForServer(baseUrl: string, timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for XA uploader dev server at ${baseUrl}`);
}

export async function createUploaderHarness(): Promise<UploaderHarness> {
  const repoRoot = process.cwd();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "xa-uploader-e2e-"));
  const fixturesDir = path.join(tempRoot, "fixtures");
  await mkdir(fixturesDir, { recursive: true });

  const imageFile = path.join(fixturesDir, "sample.png");
  await writeFile(imageFile, Buffer.from(SAMPLE_PNG_BASE64, "base64"));

  const csvPath = path.join(tempRoot, "products.e2e.csv");
  await writeFile(csvPath, "", "utf8");
  const imageRelativePath = path.join("fixtures", "sample.png");

  const adminToken = "xa-uploader-e2e-token";
  const sessionSecret = "xa-uploader-e2e-session-secret-32-char";
  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let server: ChildProcessWithoutNullStreams | null = null;

  return {
    adminToken,
    baseUrl,
    imageRelativePath,
    start: async () => {
      if (server) return;
      server = spawn(
        "pnpm",
        ["--filter", "@apps/xa-uploader", "exec", "next", "dev", "--webpack", "-p", String(port)],
        {
          cwd: repoRoot,
          env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: "1",
            XA_UPLOADER_MODE: "internal",
            XA_UPLOADER_E2E_ADMIN_TOKEN: adminToken,
            XA_UPLOADER_ADMIN_TOKEN: adminToken,
            XA_UPLOADER_SESSION_SECRET: sessionSecret,
            XA_UPLOADER_PRODUCTS_CSV_PATH: csvPath,
            XA_UPLOADER_MIN_IMAGE_EDGE: "1",
            NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE: "1",
          },
          stdio: "ignore",
        },
      );
      await waitForServer(baseUrl, SERVER_START_TIMEOUT_MS);
    },
    stop: async () => {
      if (server) {
        server.kill("SIGTERM");
        await new Promise<void>((resolve) => {
          if (!server) {
            resolve();
            return;
          }
          server.once("exit", () => resolve());
          setTimeout(() => resolve(), 10_000);
        });
        server = null;
      }
      await rm(tempRoot, { recursive: true, force: true });
    },
  };
}
