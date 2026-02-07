import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type CommonsExtMetadata = Record<
  string,
  | {
      value?: string;
    }
  | undefined
>;

type CommonsImageInfo = {
  url?: string;
  descriptionurl?: string;
  extmetadata?: CommonsExtMetadata;
};

function usage(): never {
  // eslint-disable-next-line no-console
  console.error(
    [
      "Usage:",
      "  pnpm tsx scripts/download-commons-image.ts --file <FileName> --out <publicPath> [--width 1600] [--quality 86]",
      "",
      "Examples:",
      "  pnpm tsx scripts/download-commons-image.ts --file Amalfi_02_View_from_Ferry_Dock.jpg --out public/img/guides/amalfi-positano-ferry/01-amalfi-dock.webp",
      "  pnpm tsx scripts/download-commons-image.ts --file Fiordo_di_Furore_bridge,_as_seen_from_the_sea,_Furore,_2010.jpg --out public/img/guides/amalfi-positano-ferry/04-furore-fiord.webp --width 1600",
    ].join("\n"),
  );
  process.exit(2);
}

function getArgValue(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function stripHtml(input: string): string {
  return input
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll(/&nbsp;/g, " ")
    .replaceAll(/&amp;/g, "&")
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&#039;/g, "'")
    .replaceAll(/&lt;/g, "<")
    .replaceAll(/&gt;/g, ">")
    .replaceAll(/\s+/g, " ")
    .trim();
}

async function fetchCommonsImageInfo(fileName: string): Promise<CommonsImageInfo> {
  const title = fileName.startsWith("File:") ? fileName : `File:${fileName}`;

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata");

  const resp = await fetch(url.toString(), {
    headers: { "user-agent": "base-shop/brikette download-commons-image script" },
  });
  if (!resp.ok) {
    throw new Error(`Commons API request failed (${resp.status}): ${await resp.text()}`);
  }

  const json = (await resp.json()) as {
    query?: { pages?: Record<string, { imageinfo?: CommonsImageInfo[] }> };
  };

  const pages = json.query?.pages;
  if (!pages) throw new Error("Commons API response missing query.pages");

  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`No imageinfo found for title: ${title}`);

  return info;
}

function buildCreditLine(params: {
  fileName: string;
  descriptionUrl?: string;
  ext: CommonsExtMetadata | undefined;
}): string {
  const commonsFileUrl =
    params.descriptionUrl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(params.fileName)}`;

  const artist = stripHtml(params.ext?.Artist?.value ?? "Unknown author");
  const licenseShort = stripHtml(params.ext?.LicenseShortName?.value ?? "Unknown license");
  const licenseUrl = stripHtml(params.ext?.LicenseUrl?.value ?? "https://commons.wikimedia.org/wiki/Commons:Licensing");

  return `Photo credit: %URL:${commonsFileUrl}|${artist}% (%URL:${licenseUrl}|${licenseShort}%).`;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  const fileName = getArgValue(argv, "--file");
  const outPathArg = getArgValue(argv, "--out");
  const widthArg = getArgValue(argv, "--width");
  const qualityArg = getArgValue(argv, "--quality");

  if (!fileName || !outPathArg) usage();

  const width = widthArg ? Number(widthArg) : 1600;
  const quality = qualityArg ? Number(qualityArg) : 86;
  if (!Number.isFinite(width) || width <= 0) throw new Error(`Invalid --width: ${widthArg}`);
  if (!Number.isFinite(quality) || quality <= 0 || quality > 100) throw new Error(`Invalid --quality: ${qualityArg}`);

  const info = await fetchCommonsImageInfo(fileName);
  if (!info.url) throw new Error("Commons API response missing image URL");

  const imgResp = await fetch(info.url, {
    headers: { "user-agent": "base-shop/brikette download-commons-image script" },
  });
  if (!imgResp.ok) {
    throw new Error(`Image download failed (${imgResp.status}): ${await imgResp.text()}`);
  }

  const arrayBuf = await imgResp.arrayBuffer();
  const inputBuf = Buffer.from(arrayBuf);

  const { dir } = path.parse(outPathArg);
  await mkdir(dir, { recursive: true });

  const pipeline = sharp(inputBuf).rotate();
  const metadata = await pipeline.metadata();

  const resized =
    metadata.width && metadata.width > width ? pipeline.resize({ width, withoutEnlargement: true }) : pipeline;

  const webp = await resized.webp({ quality }).toBuffer();
  await writeFile(outPathArg, webp);

  const credit = buildCreditLine({
    fileName,
    descriptionUrl: info.descriptionurl,
    ext: info.extmetadata,
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        file: fileName,
        sourceUrl: info.descriptionurl ?? null,
        license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? ""),
        licenseUrl: stripHtml(info.extmetadata?.LicenseUrl?.value ?? ""),
        artist: stripHtml(info.extmetadata?.Artist?.value ?? ""),
        outPath: outPathArg,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        credit,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

