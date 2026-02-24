export class PayloadTooLargeError extends Error {
  override name = "PayloadTooLargeError";
}

export class InvalidJsonError extends Error {
  override name = "InvalidJsonError";
}

export async function readJsonBodyWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      throw new PayloadTooLargeError("payload_too_large");
    }
  }

  const text = await request.text();
  const bodyBytes = Buffer.byteLength(text, "utf8");
  if (bodyBytes > maxBytes) {
    throw new PayloadTooLargeError("payload_too_large");
  }
  if (bodyBytes === 0) {
    throw new InvalidJsonError("invalid_json");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidJsonError("invalid_json");
  }
}
