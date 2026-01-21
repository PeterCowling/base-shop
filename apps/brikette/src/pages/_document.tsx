import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

import { getThemeInitScript } from "@/utils/themeInit";

const THEME_INIT_SCRIPT_ID = "theme-init"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Script id token
const THEME_INIT_STRATEGY = "beforeInteractive"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Next.js script strategy token

export default function Document(): JSX.Element {
  return (
    <Html>
      <Head>
        <Script
          id={THEME_INIT_SCRIPT_ID}
          strategy={THEME_INIT_STRATEGY}
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
