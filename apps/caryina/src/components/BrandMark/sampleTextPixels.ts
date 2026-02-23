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
};

const sampledTextCache = new Map<string, SampledText>();

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

function makeCacheKey({
  text,
  font,
  sampleStep,
  padding,
  alphaThreshold,
}: Required<SampleTextPixelsOptions>): string {
  return [text, font, sampleStep, padding, alphaThreshold].join("::");
}

export function clearSampleTextPixelsCache(): void {
  sampledTextCache.clear();
}

export function sampleTextPixels(options: SampleTextPixelsOptions): SampledText {
  const text = options.text;
  const font = options.font;

  if (!text || !font) {
    return { points: [], width: 0, height: 0 };
  }

  const sampleStep = Math.max(1, Math.floor(options.sampleStep ?? 2));
  const padding = Math.max(0, Math.floor(options.padding ?? 8));
  const alphaThreshold = Math.max(0, Math.min(255, Math.floor(options.alphaThreshold ?? 100)));

  const key = makeCacheKey({
    text,
    font,
    sampleStep,
    padding,
    alphaThreshold,
  });

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
  const width = Math.max(1, Math.ceil(ctx.measureText(text).width) + padding * 2);
  const height = Math.max(1, Math.ceil(parseFontPx(font)) + padding * 2);

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgb(255 255 255)";
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillText(text, padding, padding);

  const pixelData = ctx.getImageData(0, 0, width, height).data;
  const points: SampledPoint[] = [];

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const alpha = pixelData[(y * width + x) * 4 + 3];
      if (alpha >= alphaThreshold) {
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
