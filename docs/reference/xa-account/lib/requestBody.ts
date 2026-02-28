export class PayloadTooLargeError extends Error {
  override name = "PayloadTooLargeError";
}

export class InvalidBodyError extends Error {
  override name = "InvalidBodyError";
}

function byteLengthOfText(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

async function readBodyTextWithLimit(request: Request, maxBytes: number): Promise<string> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      throw new PayloadTooLargeError("payload_too_large");
    }
  }

  if (!request.body) {
    throw new InvalidBodyError("invalid_body");
  }

  const body = request.body as ReadableStream<Uint8Array> & {
    getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
  };
  const hasStreamReader = typeof body.getReader === "function";
  if (!hasStreamReader) {
    let text = "";
    try {
      text = await request.text();
    } catch {
      throw new InvalidBodyError("invalid_body");
    }
    if (!text) throw new InvalidBodyError("invalid_body");
    if (byteLengthOfText(text) > maxBytes) {
      throw new PayloadTooLargeError("payload_too_large");
    }
    return text;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new PayloadTooLargeError("payload_too_large");
    }
    chunks.push(value);
  }

  if (total === 0) {
    throw new InvalidBodyError("invalid_body");
  }

  const decoder = new TextDecoder();
  let text = "";
  for (const chunk of chunks) {
    text += decoder.decode(chunk, { stream: true });
  }
  text += decoder.decode();
  return text;
}

export async function readJsonBodyWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const text = await readBodyTextWithLimit(request, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidBodyError("invalid_json");
  }
}

export async function readFormBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<URLSearchParams> {
  const text = await readBodyTextWithLimit(request, maxBytes);
  return new URLSearchParams(text);
}
