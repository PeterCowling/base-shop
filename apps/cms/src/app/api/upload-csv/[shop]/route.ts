import { type NextRequest,NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import Busboy, { type FileInfo } from "busboy";
import { fileTypeFromBuffer } from "file-type/core";
import fs from "fs";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";

function isWebReadableStream(
  stream: unknown,
): stream is NodeReadableStream {
  return (
    typeof stream === "object" &&
    stream !== null &&
    typeof (stream as NodeReadableStream).getReader === "function"
  );
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
): Promise<NextResponse> {
  try {
    const t = await getServerTranslations("en");
    const session = await ensureAuthorized();
    const role = session.user?.role;
    if (!role || !["admin", "ShopAdmin"].includes(role)) {
      return NextResponse.json({ error: t("api.common.forbidden") }, { status: 403 });
    }
  } catch {
    const t = await getServerTranslations("en");
    return NextResponse.json({ error: t("api.common.forbidden") }, { status: 403 });
  }

  try {
    const { shop: rawShop } = await context.params;
    const shop = validateShopName(rawShop);
    const dir = path.join(resolveDataRoot(), shop);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "products.csv");

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const busboy = Busboy({
      headers,
      limits: { fileSize: MAX_SIZE, files: 1 },
    });

    return await new Promise<NextResponse>(async (resolve, reject) => {
      const t = await getServerTranslations("en");
      let resolved = false;
      let fileFound = false;

      busboy.on("file", (_name, file: NodeJS.ReadableStream, _info: FileInfo) => {
        fileFound = true;
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
        const writeStream = fs.createWriteStream(filePath);
        let firstChunk: Buffer | undefined;

        file.on("data", (data: Buffer) => {
          if (!firstChunk) firstChunk = data;
        });

        file.on("limit", () => {
          if (resolved) return;
          resolved = true;
          writeStream.destroy();
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
          void unlink(filePath).catch(() => {});
          resolve(
            NextResponse.json({ error: t("api.uploadCsv.fileTooLarge") }, { status: 413 })
          );
        });

        writeStream.on("finish", () => {
          if (resolved) return;
          if (!firstChunk) {
            resolved = true;
            resolve(
              NextResponse.json({ error: t("api.uploadCsv.missingFile") }, { status: 400 })
            );
            return;
          }

          fileTypeFromBuffer(firstChunk)
            .then((type) => {
              // Security fix: Don't trust client-provided MIME type.
              // CSV files often have no magic bytes, so we validate content structure.
              // If magic bytes detect a non-text file type, reject immediately.
              if (type && type.mime !== "text/csv" && type.mime !== "text/plain") {
                // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
                void unlink(filePath).catch(() => {});
                resolved = true;
                resolve(
                  NextResponse.json(
                    { error: t("api.uploadCsv.invalidFileType") },
                    { status: 415 }
                  )
                );
                return;
              }
              // No magic bytes or text type - validate CSV structure
              const sample = firstChunk.toString("utf8", 0, Math.min(1024, firstChunk.length));
              const hasBinaryChars = /[\x00-\x08\x0E-\x1F]/.test(sample);
              const looksLikeCsv = !hasBinaryChars && (sample.includes(",") || sample.includes("\t"));
              if (!looksLikeCsv) {
                // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
                void unlink(filePath).catch(() => {});
                resolved = true;
                resolve(
                  NextResponse.json(
                    { error: t("api.uploadCsv.invalidFileType") },
                    { status: 415 }
                  )
                );
                return;
              }
              resolved = true;
              resolve(NextResponse.json({ success: true }));
            })
            .catch((err) => {
              resolved = true;
              reject(err);
            });
        });

        writeStream.on("error", (err) => {
          if (resolved) return;
          resolved = true;
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
          void unlink(filePath).catch(() => {});
          reject(err);
        });

        file.pipe(writeStream);
      });

      busboy.on("finish", () => {
        if (!resolved && !fileFound) {
          resolved = true;
          resolve(NextResponse.json({ error: t("api.uploadCsv.missingFile") }, { status: 400 }));
        }
      });

      busboy.on("error", (err) => {
        if (resolved) return;
        resolved = true;
        reject(err);
      });

      const body = req.body;
      if (body) {
        let stream: NodeJS.ReadableStream;
        if (isWebReadableStream(body)) {
          stream = Readable.fromWeb(body);
        } else if (Buffer.isBuffer(body)) {
          stream = Readable.from(body);
        } else if (body instanceof Readable) {
          stream = body as NodeJS.ReadableStream;
        } else {
          resolved = true;
          resolve(
            NextResponse.json({ error: t("api.uploadCsv.invalidBody") }, { status: 400 })
          );
          return;
        }
        stream.pipe(busboy);
      } else {
        resolved = true;
        resolve(NextResponse.json({ error: t("api.uploadCsv.noBody") }, { status: 400 }));
      }
    });
  } catch (err) {
    const t = await getServerTranslations("en");
    const message =
      err instanceof Error && err.message
        ? err.message
        : t("api.common.genericError");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
