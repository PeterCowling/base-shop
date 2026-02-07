// i18n-exempt file -- HAND-0004 [ttl=2026-12-31]: viewer palette data, not user-facing copy.
/* eslint-disable ds/no-raw-color -- HAND-0008 [ttl=2026-12-31]: swatch palette hex values for 3D material preview */
import type { ProductConfigSchema } from "@acme/product-configurator";

const swatchPalette: Record<string, string> = {
  calf_black: "#1f1f1d",
  calf_cream: "#f2e7d6",
  leather: "#c29a6b",
  pattern_a: "#c29a6b",
  pattern_b: "#c29a6b",
  pattern_c: "#c29a6b",
  black: "#1b1b1b",
  espresso: "#3a2a1e",
  chestnut: "#6b3f2a",
  tan: "#c29a6b",
  red: "#b23a2f",
  navy: "#1f3a5f",
  forest: "#1f4d3a",
  cream: "#e8ddc9",
  slate: "#6b6f76",
  burgundy: "#5b1f2a",
  sand: "#dac8aa",
  gold: "#c4a467",
  silver: "#c6cbd4",
  gunmetal: "#2b2b2e",
  microfiber_tan: "#c8a27a",
  microfiber_black: "#1c1c1c",
  none: "#f4eee4",
  embossed: "#d8c6b2",
  classic: "#c86555",
  buckle: "#3a6fcf",
};

const texturePebble = [
  "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.35), transparent 45%)",
  "radial-gradient(circle at 70% 75%, rgba(0,0,0,0.25), transparent 55%)",
  "repeating-radial-gradient(circle at 25% 30%, rgba(255,255,255,0.08) 0 2px, transparent 2px 5px)",
].join(", ");

const texturePebbleSoft = [
  "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.22), transparent 50%)",
  "radial-gradient(circle at 70% 75%, rgba(0,0,0,0.18), transparent 55%)",
  "repeating-radial-gradient(circle at 20% 25%, rgba(255,255,255,0.05) 0 2px, transparent 2px 6px)",
].join(", ");

const textureSmooth = [
  "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.4), transparent 50%)",
  "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(0,0,0,0.12))",
].join(", ");

const textureMicrofiber = [
  "linear-gradient(45deg, rgba(255,255,255,0.18) 0%, transparent 55%)",
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 6px)",
].join(", ");

const texturePatternA = [
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 14px)",
  "linear-gradient(135deg, rgba(0,0,0,0.08), transparent)",
].join(", ");

const texturePatternB = [
  "radial-gradient(circle at 35% 40%, rgba(255,255,255,0.18) 0 8%, transparent 9%)",
  "radial-gradient(circle at 70% 65%, rgba(0,0,0,0.1) 0 10%, transparent 11%)",
  "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0 2px, transparent 2px 7px)",
].join(", ");

const texturePatternC = [
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.14) 0 8px, transparent 8px 18px)",
  "repeating-linear-gradient(45deg, rgba(0,0,0,0.08) 0 10px, transparent 10px 22px)",
].join(", ");

const textureMetal = [
  "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(0,0,0,0.2))",
  "linear-gradient(45deg, rgba(255,255,255,0.25), transparent 60%)",
].join(", ");

const textureColor = [
  "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(0,0,0,0.15))",
  texturePebbleSoft,
].join(", ");

const swatchTextureMap: Record<string, string> = {
  calf_black: texturePebble,
  calf_cream: texturePebble,
  leather: texturePebbleSoft,
  pattern_a: texturePatternA,
  pattern_b: texturePatternB,
  pattern_c: texturePatternC,
  black: texturePebbleSoft,
  cream: texturePebbleSoft,
  tan: texturePebbleSoft,
  espresso: texturePebbleSoft,
  chestnut: texturePebbleSoft,
  red: texturePebbleSoft,
  navy: texturePebbleSoft,
  forest: texturePebbleSoft,
  slate: texturePebbleSoft,
  burgundy: texturePebbleSoft,
  sand: texturePebbleSoft,
  microfiber_tan: textureMicrofiber,
  microfiber_black: textureMicrofiber,
  gold: textureMetal,
  silver: textureMetal,
  gunmetal: textureMetal,
  none: textureSmooth,
  embossed: textureSmooth,
};

const hashToHsl = (input: string, saturation: number, lightness: number) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const getSwatchStyle = (
  value: string,
  kind: "material" | "color" | "metal",
) => {
  const base =
    swatchPalette[value] ??
    (kind === "material" ? hashToHsl(value, 12, 84) : hashToHsl(value, 48, 64));
  const texture =
    swatchTextureMap[value] ??
    (kind === "metal"
      ? textureMetal
      : kind === "material"
        ? texturePebble
        : textureColor);
  return {
    backgroundColor: base,
    backgroundImage: texture,
  } as const;
};

export const getSwatchKind = (
  property: ProductConfigSchema["properties"][number],
): "material" | "color" | "metal" => {
  const key = property.key.toLowerCase();
  const label = property.displayName.toLowerCase();
  if (key.includes("hardware") || label.includes("hardware")) return "metal";
  if (key.includes("material") || label.includes("material")) return "material";
  if (key.includes("lining") || label.includes("lining")) return "material";
  const hasBindings = property.values.some(
    (value) => (value.materialBindings?.length ?? 0) > 0,
  );
  return hasBindings ? "material" : "color";
};
