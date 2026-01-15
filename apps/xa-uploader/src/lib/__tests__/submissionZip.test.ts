/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader zip tests rely on temp fs operations */

import { describe, expect, it } from "@jest/globals";

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWriteStream } from "node:fs";

import yauzl from "yauzl";

import { buildSubmissionZipStream } from "../submissionZip";

async function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return await new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function writeBuffer(filePath: string, buffer: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(filePath, { flags: "w" });
    out.on("error", reject);
    out.on("close", () => resolve());
    out.end(buffer);
  });
}

async function unzipToMemory(zipPath: string): Promise<Record<string, Buffer>> {
  return await new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err || new Error("Unable to open zip."));
        return;
      }

      const files: Record<string, Buffer> = {};
      zipfile.readEntry();
      zipfile.on("entry", (entry: yauzl.Entry) => {
        if (entry.fileName.endsWith("/")) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr || !readStream) {
            zipfile.close();
            reject(streamErr || new Error("Unable to read zip entry."));
            return;
          }
          const chunks: Buffer[] = [];
          readStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          readStream.on("error", (readErr) => {
            zipfile.close();
            reject(readErr);
          });
          readStream.on("end", () => {
            files[entry.fileName] = Buffer.concat(chunks);
            zipfile.readEntry();
          });
        });
      });

      zipfile.on("end", () => {
        zipfile.close();
        resolve(files);
      });
      zipfile.on("error", (zipErr) => {
        zipfile.close();
        reject(zipErr);
      });
    });
  });
}

function parseProductsCsv(csv: string): Array<Record<string, string>> {
  const lines = csv.trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    for (const [idx, key] of header.entries()) row[key] = (cells[idx] ?? "").replace(/^"|"$/g, "");
    return row;
  });
}

describe("submissionZip", () => {
  it("exports a zip with rewritten image paths and randomized filenames", async () => {
    const prevMinEdge = process.env.XA_UPLOADER_MIN_IMAGE_EDGE;
    process.env.XA_UPLOADER_MIN_IMAGE_EDGE = "1";
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "xa-submission-"));
    try {
      const imagesDir = path.join(tempDir, "vendor-images");
      await mkdir(imagesDir, { recursive: true });
      const tinyPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Zf5cAAAAASUVORK5CYII=",
        "base64",
      );
      await writeFile(path.join(imagesDir, "one.png"), tinyPng);
      await writeFile(path.join(imagesDir, "two.png"), tinyPng);

      const { filename, stream } = await buildSubmissionZipStream({
        products: [
          {
            id: "p1",
            slug: "studio-jacket",
            title: "Studio jacket",
            brandHandle: "atelier-x",
            collectionHandle: "outerwear",
            collectionTitle: "Outerwear",
            price: "189",
            description: "A structured layer.",
            createdAt: "2025-12-01T12:00:00.000Z",
            deposit: "0",
            stock: "0",
            forSale: true,
            forRental: false,
            popularity: "0",
            sizes: "S|M|L",
            taxonomy: {
              department: "women",
              category: "clothing",
              subcategory: "outerwear",
              color: "black",
              material: "wool",
            },
            imageFiles: "vendor-images/*.png",
            imageAltTexts: "Studio jacket images",
            details: {},
          },
        ],
        productsCsvPath: path.join(tempDir, "products.csv"),
        options: { maxProducts: 10, maxBytes: 50 * 1024 * 1024, recursiveDirs: true },
      });

      expect(filename).toMatch(/submission\.\d{4}-\d{2}-\d{2}\.[a-f0-9]{32}\.zip/);

      const zipBuffer = await readStreamToBuffer(stream);
      const zipPath = path.join(tempDir, "out.zip");
      await writeBuffer(zipPath, zipBuffer);
      const files = await unzipToMemory(zipPath);

      expect(files["products.csv"]).toBeDefined();
      expect(files["manifest.json"]).toBeDefined();
      const productCsv = files["products.csv"].toString("utf8");
      const rows = parseProductsCsv(productCsv);
      expect(rows).toHaveLength(1);

      const imageFilesCell = rows[0]["image_files"];
      expect(imageFilesCell).toContain("images/studio-jacket/");
      expect(imageFilesCell).not.toContain("vendor-images");
      expect(imageFilesCell.split("|")).toHaveLength(2);

      const imageEntries = Object.keys(files).filter((key) => key.startsWith("images/studio-jacket/"));
      expect(imageEntries).toHaveLength(2);
      expect(imageEntries.some((key) => key.includes("one.png"))).toBe(false);
      expect(imageEntries.some((key) => key.includes("two.png"))).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
      if (prevMinEdge === undefined) delete process.env.XA_UPLOADER_MIN_IMAGE_EDGE;
      else process.env.XA_UPLOADER_MIN_IMAGE_EDGE = prevMinEdge;
    }
  });
});
