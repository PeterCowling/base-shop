/* eslint-disable ds/no-hardcoded-copy, security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] deterministic e2e harness with temp filesystem paths */

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const SERVER_START_TIMEOUT_MS = 180_000;
const STUB_CONTRACT_TOKEN = "xa-e2e-stub-token";
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

function appendCapped(buffer: string, chunk: Buffer, maxChars: number): string {
  const next = `${buffer}${chunk.toString("utf8")}`;
  return next.length <= maxChars ? next : next.slice(next.length - maxChars);
}

function startStubContractServer(port: number): Promise<http.Server> {
  return new Promise<http.Server>((resolve, reject) => {
    const stubServer = http.createServer((req, res) => {
      // Drain any request body to avoid socket hangs
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => {
        if (chunks.reduce((acc, c) => acc + c.byteLength, 0) < 1_048_576) {
          chunks.push(chunk);
        }
      });
      req.on("end", () => {
        if (req.method === "PUT") {
          const body = JSON.stringify({
            ok: true,
            version: "v-e2e-test",
            publishedAt: new Date().toISOString(),
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(body);
        } else {
          res.writeHead(405);
          res.end();
        }
      });
    });

    stubServer.once("error", reject);
    stubServer.listen(port, "127.0.0.1", () => {
      resolve(stubServer);
    });
  });
}

export async function createUploaderHarness(): Promise<UploaderHarness> {
  const appRoot = process.cwd();
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
  const stubPort = await reservePort();
  const distDir = `.next-e2e-${port}`;
  const distDirPath = path.join(appRoot, distDir);
  const baseUrl = `http://localhost:${port}`;
  const contractBaseUrl = `http://127.0.0.1:${stubPort}`;
  let server: ChildProcessWithoutNullStreams | null = null;
  let stubServer: http.Server | null = null;
  let stdoutTail = "";
  let stderrTail = "";
  const maxLogChars = 8_000;

  return {
    adminToken,
    baseUrl,
    imageRelativePath,
    start: async () => {
      if (server) return;
      stdoutTail = "";
      stderrTail = "";

      stubServer = await startStubContractServer(stubPort);

      server = spawn("pnpm", ["exec", "next", "dev", "--webpack", "-p", String(port)], {
        cwd: appRoot,
        env: {
          ...process.env,
          NEXT_TELEMETRY_DISABLED: "1",
          XA_UPLOADER_MODE: "internal",
          XA_UPLOADER_E2E_ADMIN_TOKEN: adminToken,
          XA_UPLOADER_ADMIN_TOKEN: adminToken,
          XA_UPLOADER_SESSION_SECRET: sessionSecret,
          XA_UPLOADER_PRODUCTS_CSV_PATH: csvPath,
          XA_UPLOADER_MIN_IMAGE_EDGE: "1",
          XA_UPLOADER_NEXT_DIST_DIR: distDir,
          NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE: "1",
          XA_CATALOG_CONTRACT_BASE_URL: contractBaseUrl,
          XA_CATALOG_CONTRACT_WRITE_TOKEN: STUB_CONTRACT_TOKEN,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      server.stdout.on("data", (chunk: Buffer) => {
        stdoutTail = appendCapped(stdoutTail, chunk, maxLogChars);
      });
      server.stderr.on("data", (chunk: Buffer) => {
        stderrTail = appendCapped(stderrTail, chunk, maxLogChars);
      });

      let ready = false;
      const readyPromise = new Promise<void>((resolve) => {
        server?.stdout.on("data", (chunk: Buffer) => {
          const text = chunk.toString("utf8");
          if (ready) return;
          if (/ready in|ready - started server on/i.test(text)) {
            ready = true;
            resolve();
          }
        });
      });

      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              [
                `Timed out waiting for XA uploader dev server startup at ${baseUrl}`,
                stdoutTail ? `stdout tail:\n${stdoutTail}` : "",
                stderrTail ? `stderr tail:\n${stderrTail}` : "",
              ]
                .filter(Boolean)
                .join("\n\n"),
            ),
          );
        }, SERVER_START_TIMEOUT_MS);
      });

      const exitPromise = new Promise<never>((_resolve, reject) => {
        server?.once("error", (error) => {
          reject(
            new Error(
              [
                `XA uploader dev server failed to start: ${error.message}`,
                stdoutTail ? `stdout tail:\n${stdoutTail}` : "",
                stderrTail ? `stderr tail:\n${stderrTail}` : "",
              ]
                .filter(Boolean)
                .join("\n\n"),
            ),
          );
        });
        server?.once("exit", (code, signal) => {
          reject(
            new Error(
              [
                `XA uploader dev server exited before startup check (code=${String(code)} signal=${String(signal)}).`,
                stdoutTail ? `stdout tail:\n${stdoutTail}` : "",
                stderrTail ? `stderr tail:\n${stderrTail}` : "",
              ]
                .filter(Boolean)
                .join("\n\n"),
            ),
          );
        });
      });

      await Promise.race([readyPromise, timeoutPromise, exitPromise]);
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
      if (stubServer) {
        await new Promise<void>((resolve) => {
          stubServer?.close(() => resolve());
          setTimeout(() => resolve(), 5_000);
        });
        stubServer = null;
      }
      await rm(distDirPath, { recursive: true, force: true });
      await rm(tempRoot, { recursive: true, force: true });
    },
  };
}
