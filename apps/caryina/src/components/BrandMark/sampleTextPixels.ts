export type SampledPoint = {
  x: number;
  y: number;
};

export type SampledText = {
  points: ReadonlyArray<SampledPoint>;
  width: number;
  height: number;
};

export type SampleTextPixelsOptions = {
  text: string;
  font: string;
  sampleStep?: number;
  padding?: number;
  alphaThreshold?: number;
  maxWidthPx?: number;
  lineHeightPx?: number;
  letterSpacingPx?: number;
};

const sampledTextCache = new Map<string, SampledText>();

type NormalizedSampleOptions = {
  text: string;
  font: string;
  sampleStep: number;
  padding: number;
  alphaThreshold: number;
  maxWidthPx: number;
  lineHeightPx: number;
  letterSpacingPx: number;
};

function parseFontPx(font: string): number {
  const tokens = font.trim().split(" ");
  for (const token of tokens) {
    if (!token.endsWith("px")) {
      continue;
    }

    const numeric = Number(token.slice(0, -2));
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 24;
}

function normalizeOptions(options: SampleTextPixelsOptions): NormalizedSampleOptions {
  const text = options.text;
  const font = options.font;
  const sampleStep = Math.max(1, Math.floor(options.sampleStep ?? 2));
  const padding = Math.max(0, Math.floor(options.padding ?? 0));
  const alphaThreshold = Math.max(0, Math.min(255, Math.floor(options.alphaThreshold ?? 100)));
  const maxWidthPx =
    Number.isFinite(options.maxWidthPx) && (options.maxWidthPx ?? 0) > 0
      ? Math.max(1, Math.floor(options.maxWidthPx as number))
      : Number.POSITIVE_INFINITY;
  const fontPx = parseFontPx(font);
  const lineHeightPx =
    Number.isFinite(options.lineHeightPx) && (options.lineHeightPx ?? 0) > 0
      ? (options.lineHeightPx as number)
      : fontPx;
  const letterSpacingPx =
    Number.isFinite(options.letterSpacingPx) && (options.letterSpacingPx as number) > 0
      ? (options.letterSpacingPx as number)
      : 0;

  return {
    text,
    font,
    sampleStep,
    padding,
    alphaThreshold,
    maxWidthPx,
    lineHeightPx,
    letterSpacingPx,
  };
}

function makeCacheKey(options: NormalizedSampleOptions): string {
  return [
    options.text,
    options.font,
    options.sampleStep,
    options.padding,
    options.alphaThreshold,
    options.maxWidthPx,
    options.lineHeightPx,
    options.letterSpacingPx,
  ].join("::");
}

function measureWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacingPx: number
): number {
  if (!text) return 0;

  const base = ctx.measureText(text).width;
  const extra = Math.max(0, text.length - 1) * Math.max(0, letterSpacingPx);
  return base + extra;
}

function wrapByWords(params: {
  ctx: CanvasRenderingContext2D;
  text: string;
  maxWidthPx: number;
  letterSpacingPx: number;
}): string[] {
  const { ctx, text, maxWidthPx, letterSpacingPx } = params;
  const words = text.trim().split(/\s+/);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const width = measureWithLetterSpacing(ctx, nextLine, letterSpacingPx);
    if (width <= maxWidthPx || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

function drawWithLetterSpacing(params: {
  ctx: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  letterSpacingPx: number;
}): void {
  const { ctx, text, x, y, letterSpacingPx } = params;
  if (letterSpacingPx <= 0) {
    ctx.fillText(text, x, y);
    return;
  }

  let cursor = x;
  for (const character of text) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + letterSpacingPx;
  }
}

function resolveLines(params: {
  ctx: CanvasRenderingContext2D;
  text: string;
  maxWidthPx: number;
  padding: number;
  letterSpacingPx: number;
}): string[] {
  const { ctx, text, maxWidthPx, padding, letterSpacingPx } = params;
  if (!Number.isFinite(maxWidthPx)) {
    return [text];
  }

  const innerWidth = Math.max(1, maxWidthPx - padding * 2);
  return wrapByWords({
    ctx,
    text,
    maxWidthPx: innerWidth,
    letterSpacingPx,
  });
}

function resolveCanvasWidth(params: {
  ctx: CanvasRenderingContext2D;
  lines: string[];
  maxWidthPx: number;
  padding: number;
  letterSpacingPx: number;
}): number {
  const { ctx, lines, maxWidthPx, padding, letterSpacingPx } = params;
  if (Number.isFinite(maxWidthPx)) {
    return Math.max(1, Math.floor(maxWidthPx));
  }

  const longestLine = lines.reduce((max, line) => {
    return Math.max(max, measureWithLetterSpacing(ctx, line, letterSpacingPx));
  }, 0);

  return Math.max(1, Math.ceil(longestLine + padding * 2));
}

function resolveCanvasHeight(params: {
  lineCount: number;
  lineHeightPx: number;
  padding: number;
}): number {
  const { lineCount, lineHeightPx, padding } = params;
  return Math.max(1, Math.ceil(lineCount * lineHeightPx + padding * 2));
}

export function clearSampleTextPixelsCache(): void {
  sampledTextCache.clear();
}

export function sampleTextPixels(options: SampleTextPixelsOptions): SampledText {
  const normalized = normalizeOptions(options);
  const text = normalized.text;
  const font = normalized.font;

  if (!text || !font) {
    return { points: [], width: 0, height: 0 };
  }

  const key = makeCacheKey(normalized);

  const cached = sampledTextCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  } as CanvasRenderingContext2DSettings);

  if (!ctx) {
    return { points: [], width: 0, height: 0 };
  }

  ctx.font = font;
  const lines = resolveLines({
    ctx,
    text,
    maxWidthPx: normalized.maxWidthPx,
    padding: normalized.padding,
    letterSpacingPx: normalized.letterSpacingPx,
  });

  const width = resolveCanvasWidth({
    ctx,
    lines,
    maxWidthPx: normalized.maxWidthPx,
    padding: normalized.padding,
    letterSpacingPx: normalized.letterSpacingPx,
  });
  const height = resolveCanvasHeight({
    lineCount: Math.max(1, lines.length),
    lineHeightPx: normalized.lineHeightPx,
    padding: normalized.padding,
  });

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgb(255 255 255)";
  ctx.font = font;
  ctx.textBaseline = "top";

  for (let index = 0; index < lines.length; index += 1) {
    drawWithLetterSpacing({
      ctx,
      text: lines[index],
      x: normalized.padding,
      y: normalized.padding + index * normalized.lineHeightPx,
      letterSpacingPx: normalized.letterSpacingPx,
    });
  }

  const pixelData = ctx.getImageData(0, 0, width, height).data;
  const points: SampledPoint[] = [];

  for (let y = 0; y < height; y += normalized.sampleStep) {
    for (let x = 0; x < width; x += normalized.sampleStep) {
      const alpha = pixelData[(y * width + x) * 4 + 3];
      if (alpha >= normalized.alphaThreshold) {
        points.push({ x, y });
      }
    }
  }

  const sampled = {
    points,
    width,
    height,
  };

  sampledTextCache.set(key, sampled);
  return sampled;
}
