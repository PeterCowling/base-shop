import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import Busboy from "busboy";
import { fileTypeFromBuffer } from "file-type/core";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { validateShopName } from "@platform-core/shops";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { shop: rawShop } = await context.params;
    const shop = validateShopName(rawShop);
    const dir = path.join(resolveDataRoot(), shop);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "products.csv");

    const busboy = Busboy({
      headers: Object.fromEntries(req.headers as any),
      limits: { fileSize: MAX_SIZE, files: 1 },
    });

    return await new Promise<NextResponse>((resolve, reject) => {
      let resolved = false;
      let fileFound = false;

      busboy.on("file", (_name, file, info) => {
        fileFound = true;
        const { mimeType } = info;
        const writeStream = fs.createWriteStream(filePath);
        let firstChunk: Buffer | undefined;

        file.on("data", (data: Buffer) => {
          if (!firstChunk) firstChunk = data;
        });

        file.on("limit", () => {
          if (resolved) return;
          resolved = true;
          writeStream.destroy();
          void unlink(filePath).catch(() => {});
          resolve(
            NextResponse.json({ error: "File too large" }, { status: 413 })
          );
        });

        writeStream.on("finish", () => {
          if (resolved) return;
          if (!firstChunk) {
            resolved = true;
            resolve(
              NextResponse.json({ error: "Missing file" }, { status: 400 })
            );
            return;
          }

          fileTypeFromBuffer(firstChunk)
            .then((type) => {
              const isCsv =
                (type && type.mime === "text/csv") ||
                (!type && mimeType === "text/csv");
              if (!isCsv) {
                void unlink(filePath).catch(() => {});
                resolved = true;
                resolve(
                  NextResponse.json(
                    { error: "Invalid file type" },
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
          reject(err);
        });

        file.pipe(writeStream);
      });

      busboy.on("finish", () => {
        if (!resolved && !fileFound) {
          resolved = true;
          resolve(NextResponse.json({ error: "Missing file" }, { status: 400 }));
        }
      });

      busboy.on("error", (err) => {
        if (resolved) return;
        resolved = true;
        reject(err);
      });

      if (req.body) {
        Readable.fromWeb(req.body as any).pipe(busboy);
      } else {
        resolved = true;
        resolve(NextResponse.json({ error: "No body" }, { status: 400 }));
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

