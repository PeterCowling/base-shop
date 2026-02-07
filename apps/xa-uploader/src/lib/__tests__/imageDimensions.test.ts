/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader image dimension tests rely on temp fs operations */

import { describe, expect, it } from "@jest/globals";

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { readImageDimensions } from "../imageDimensions";

function makeWebpVp8x(width: number, height: number): Buffer {
  const chunkData = Buffer.alloc(10);
  chunkData[0] = 0x00; // flags
  chunkData[1] = 0x00;
  chunkData[2] = 0x00;
  chunkData[3] = 0x00;
  chunkData.writeUIntLE(Math.max(0, width - 1), 4, 3);
  chunkData.writeUIntLE(Math.max(0, height - 1), 7, 3);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.write("VP8X", 0, "ascii");
  chunkHeader.writeUInt32LE(chunkData.length, 4);

  const riffHeader = Buffer.alloc(12);
  riffHeader.write("RIFF", 0, "ascii");
  riffHeader.writeUInt32LE(4 + chunkHeader.length + chunkData.length, 4);
  riffHeader.write("WEBP", 8, "ascii");

  return Buffer.concat([riffHeader, chunkHeader, chunkData]);
}

describe("imageDimensions", () => {
  it("reads PNG dimensions", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "xa-imgdims-"));
    try {
      const tinyPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Zf5cAAAAASUVORK5CYII=",
        "base64",
      );
      const filePath = path.join(tempDir, "tiny.png");
      await writeFile(filePath, tinyPng);
      await expect(readImageDimensions(filePath)).resolves.toEqual({
        format: "png",
        width: 1,
        height: 1,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("reads WebP VP8X dimensions", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "xa-imgdims-"));
    try {
      const filePath = path.join(tempDir, "image.webp");
      await writeFile(filePath, makeWebpVp8x(320, 240));
      await expect(readImageDimensions(filePath)).resolves.toEqual({
        format: "webp",
        width: 320,
        height: 240,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

