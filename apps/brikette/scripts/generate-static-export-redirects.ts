import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildLocalizedStaticRedirectRules,
  formatRedirectRules,
} from "../src/routing/staticExportRedirects";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const REDIRECTS_PATH = path.join(APP_ROOT, "public", "_redirects");

const START_MARKER = "# BEGIN GENERATED LOCALIZED STATIC-EXPORT REDIRECTS";
const END_MARKER = "# END GENERATED LOCALIZED STATIC-EXPORT REDIRECTS";

async function main(): Promise<void> {
  const generatedRules = formatRedirectRules(buildLocalizedStaticRedirectRules());

  const fileLines = [
    "# Cloudflare Pages redirects",
    "# https://developers.cloudflare.com/pages/configuration/redirects/",
    "# This file is deployed alongside static HTML for edge-level redirects",
    "",
    "# Root URL -> English homepage (permanent, slashless target)",
    "/  /en  301",
    "",
    "# Health check endpoint -> homepage (no API routes on static deploy)",
    "/api/health  /en/  302",
    "",
    "# Legacy /directions/* URLs (no lang prefix) -> English how-to-get-here routes",
    "/directions/:slug  /en/how-to-get-here/:slug  301",
    "",
    "# stepfreepositano.com -> private rooms hub (requires custom domain on Pages project)",
    "# Once DNS is configured, these catch requests to the custom domain.",
    "https://stepfreepositano.com  /en/private-rooms/  301",
    "https://stepfreepositano.com/  /en/private-rooms/  301",
    "https://stepfreepositano.com/*  /en/private-rooms/:splat  301",
    "https://www.stepfreepositano.com  /en/private-rooms/  301",
    "https://www.stepfreepositano.com/  /en/private-rooms/  301",
    "https://www.stepfreepositano.com/*  /en/private-rooms/:splat  301",
    "",
    "# Legacy /en/rooms/* -> /en/dorms/* (route renamed for SEO)",
    "/en/rooms  /en/dorms  301",
    "/en/rooms/  /en/dorms/  301",
    "/en/rooms/:splat  /en/dorms/:splat  301",
    "",
    "# Legacy /en/apartment/* -> /en/private-rooms/* (route renamed for SEO)",
    "/en/apartment  /en/private-rooms  301",
    "/en/apartment/  /en/private-rooms/  301",
    "/en/apartment/:splat  /en/private-rooms/:splat  301",
    "",
    "# Legacy /en/dorms/double_room -> /en/private-rooms/double-room (private room moved)",
    "/en/dorms/double_room  /en/private-rooms/double-room  301",
    "/en/dorms/double_room/  /en/private-rooms/double-room/  301",
    "",
    "# Legacy localized apartment slugs (pre-private-rooms rename) -> new private-rooms slugs",
    "/de/wohnungen  /de/privatzimmer  301",
    "/de/wohnungen/  /de/privatzimmer/  301",
    "/de/wohnungen/:splat  /de/privatzimmer/:splat  301",
    "/es/apartamentos  /es/habitaciones-privadas  301",
    "/es/apartamentos/  /es/habitaciones-privadas/  301",
    "/es/apartamentos/:splat  /es/habitaciones-privadas/:splat  301",
    "/fr/appartements  /fr/chambres-privees  301",
    "/fr/appartements/  /fr/chambres-privees/  301",
    "/fr/appartements/:splat  /fr/chambres-privees/:splat  301",
    "/it/appartamenti  /it/camere-private  301",
    "/it/appartamenti/  /it/camere-private/  301",
    "/it/appartamenti/:splat  /it/camere-private/:splat  301",
    "/ja/apaato  /ja/kojin-heya  301",
    "/ja/apaato/  /ja/kojin-heya/  301",
    "/ja/apaato/:splat  /ja/kojin-heya/:splat  301",
    "/ko/apateu  /ko/gaein-sil  301",
    "/ko/apateu/  /ko/gaein-sil/  301",
    "/ko/apateu/:splat  /ko/gaein-sil/:splat  301",
    "/pt/apartamentos  /pt/quartos-privados  301",
    "/pt/apartamentos/  /pt/quartos-privados/  301",
    "/pt/apartamentos/:splat  /pt/quartos-privados/:splat  301",
    "/ru/kvartiry  /ru/chastnye-nomera  301",
    "/ru/kvartiry/  /ru/chastnye-nomera/  301",
    "/ru/kvartiry/:splat  /ru/chastnye-nomera/:splat  301",
    "/zh/gongyu  /zh/siren-kefang  301",
    "/zh/gongyu/  /zh/siren-kefang/  301",
    "/zh/gongyu/:splat  /zh/siren-kefang/:splat  301",
    "/ar/shuqaq  /ar/ghuraf-khassa  301",
    "/ar/shuqaq/  /ar/ghuraf-khassa/  301",
    "/ar/shuqaq/:splat  /ar/ghuraf-khassa/:splat  301",
    "/hi/awas  /hi/niji-kamre  301",
    "/hi/awas/  /hi/niji-kamre/  301",
    "/hi/awas/:splat  /hi/niji-kamre/:splat  301",
    "/vi/can-ho  /vi/phong-rieng  301",
    "/vi/can-ho/  /vi/phong-rieng/  301",
    "/vi/can-ho/:splat  /vi/phong-rieng/:splat  301",
    "/pl/apartamenty  /pl/pokoje-prywatne  301",
    "/pl/apartamenty/  /pl/pokoje-prywatne/  301",
    "/pl/apartamenty/:splat  /pl/pokoje-prywatne/:splat  301",
    "/sv/lagenheter  /sv/privata-rum  301",
    "/sv/lagenheter/  /sv/privata-rum/  301",
    "/sv/lagenheter/:splat  /sv/privata-rum/:splat  301",
    "/no/leiligheter  /no/private-rom  301",
    "/no/leiligheter/  /no/private-rom/  301",
    "/no/leiligheter/:splat  /no/private-rom/:splat  301",
    "/da/lejligheder  /da/private-vaerelser  301",
    "/da/lejligheder/  /da/private-vaerelser/  301",
    "/da/lejligheder/:splat  /da/private-vaerelser/:splat  301",
    "/hu/apartmanok  /hu/privat-szobak  301",
    "/hu/apartmanok/  /hu/privat-szobak/  301",
    "/hu/apartmanok/:splat  /hu/privat-szobak/:splat  301",
    "",
    `${START_MARKER}`,
    ...generatedRules,
    `${END_MARKER}`,
    "",
  ];

  await writeFile(REDIRECTS_PATH, `${fileLines.join("\n")}`, "utf8");
  process.stdout.write(
    `Updated ${REDIRECTS_PATH} with ${generatedRules.length} generated redirect rules.\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
