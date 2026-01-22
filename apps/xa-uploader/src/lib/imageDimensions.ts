import { open } from "node:fs/promises";

export type ImageDimensions = {
  format: "jpeg" | "png" | "webp";
  width: number;
  height: number;
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RIFF_SIGNATURE = Buffer.from("RIFF");
const WEBP_SIGNATURE = Buffer.from("WEBP");

function isJpegStart(buf: Buffer): boolean {
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
}

function isPngStart(buf: Buffer): boolean {
  return buf.length >= PNG_SIGNATURE.length && buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

function isWebpStart(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.subarray(0, 4).equals(RIFF_SIGNATURE) &&
    buf.subarray(8, 12).equals(WEBP_SIGNATURE)
  );
}

function isJpegSofMarker(marker: number): boolean {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  );
}

function parsePngDimensions(buf: Buffer): ImageDimensions | null {
  if (!isPngStart(buf)) return null;
  if (buf.length < 24) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return null;
  return { format: "png", width, height };
}

function parseJpegDimensions(buf: Buffer): ImageDimensions | null {
  if (!isJpegStart(buf)) return null;

  let offset = 2;
  while (offset < buf.length) {
    while (offset < buf.length && buf[offset] !== 0xff) offset += 1;
    if (offset >= buf.length) break;

    while (offset < buf.length && buf[offset] === 0xff) offset += 1;
    if (offset >= buf.length) break;

    const marker = buf[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;

    if (offset + 2 > buf.length) return null;
    const length = buf.readUInt16BE(offset);
    offset += 2;
    if (length < 2) return null;

    if (isJpegSofMarker(marker)) {
      if (offset + 5 > buf.length) return null;
      const height = buf.readUInt16BE(offset + 1);
      const width = buf.readUInt16BE(offset + 3);
      if (!width || !height) return null;
      return { format: "jpeg", width, height };
    }

    offset += length - 2;
  }

  return null;
}

type WebpChunkParseResult =
  | { kind: "skip" }
  | { kind: "invalid" }
  | { kind: "dimensions"; width: number; height: number };

function parseWebpChunk(
  buf: Buffer,
  chunkType: string,
  chunkSize: number,
  dataOffset: number,
): WebpChunkParseResult {
  if (chunkType === "VP8X") {
    if (chunkSize < 10 || dataOffset + 10 > buf.length) return { kind: "invalid" };
    const widthMinus1 = buf.readUIntLE(dataOffset + 4, 3);
    const heightMinus1 = buf.readUIntLE(dataOffset + 7, 3);
    const width = widthMinus1 + 1;
    const height = heightMinus1 + 1;
    if (!width || !height) return { kind: "invalid" };
    return { kind: "dimensions", width, height };
  }

  if (chunkType === "VP8 ") {
    if (chunkSize < 10 || dataOffset + 10 > buf.length) return { kind: "invalid" };
    const startCode = buf.subarray(dataOffset + 3, dataOffset + 6);
    if (startCode[0] !== 0x9d || startCode[1] !== 0x01 || startCode[2] !== 0x2a) {
      return { kind: "invalid" };
    }
    const width = buf.readUInt16LE(dataOffset + 6) & 0x3fff;
    const height = buf.readUInt16LE(dataOffset + 8) & 0x3fff;
    if (!width || !height) return { kind: "invalid" };
    return { kind: "dimensions", width, height };
  }

  if (chunkType === "VP8L") {
    if (chunkSize < 5 || dataOffset + 5 > buf.length) return { kind: "invalid" };
    if (buf[dataOffset] !== 0x2f) return { kind: "invalid" };
    const bits = buf.readUInt32LE(dataOffset + 1);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    if (!width || !height) return { kind: "invalid" };
    return { kind: "dimensions", width, height };
  }

  return { kind: "skip" };
}

function parseWebpDimensions(buf: Buffer): ImageDimensions | null {
  if (!isWebpStart(buf)) return null;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkType = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkSize > buf.length) break;

    const parsedChunk = parseWebpChunk(buf, chunkType, chunkSize, dataOffset);
    if (parsedChunk.kind === "invalid") return null;
    if (parsedChunk.kind === "dimensions") {
      return { format: "webp", width: parsedChunk.width, height: parsedChunk.height };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

async function readHeader(filePath: string, maxBytes: number): Promise<Buffer> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 caller provides validated file paths
  const handle = await open(filePath, "r");
  try {
    const info = await handle.stat();
    const toRead = Math.max(0, Math.min(maxBytes, info.size));
    const buf = Buffer.alloc(toRead);
    const { bytesRead } = await handle.read(buf, 0, toRead, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export async function readImageDimensions(filePath: string): Promise<ImageDimensions> {
  const header = await readHeader(filePath, 512 * 1024);
  const png = parsePngDimensions(header);
  if (png) return png;
  const jpeg = parseJpegDimensions(header);
  if (jpeg) return jpeg;
  const webp = parseWebpDimensions(header);
  if (webp) return webp;
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
  throw new Error("Unsupported image format (use JPG, PNG, or WebP).");
}
