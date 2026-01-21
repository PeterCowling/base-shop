import React from "react";
import { renderToString } from "react-dom/server";

import { preloadNamespacesWithFallback } from "./apps/brikette/src/utils/loadI18nNs";
import i18n from "./apps/brikette/src/i18n";
import GuideContent from "./apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent";

async function main() {
  await preloadNamespacesWithFallback("en" as any, ["guides", "guidesFallback"], { optional: true });
  await i18n.changeLanguage("en");
  const html = renderToString(
    <GuideContent
      lang={"en" as any}
      guideKey={"santaMariaDelCastelloHike" as any}
      namespace={"experiences" as any}
      section={"experiences" as any}
    />
  );
  console.log(html.slice(0, 200));
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
