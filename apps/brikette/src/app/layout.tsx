import "@/styles/global.css";
import "react-datepicker/dist/react-datepicker.css";
import "swiper/css";
import "swiper/css/navigation";

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { NOINDEX_PREVIEW, PUBLIC_DOMAIN, SITE_DOMAIN } from "@/config/env";
import { BASE_URL } from "@/config/site";
import { BRAND_PRIMARY_DARK_RGB, BRAND_PRIMARY_RGB, toRgb } from "@/root/theme";
import { getThemeInitScript } from "@/utils/themeInit";

// Determine if noindex should be applied (staging/preview environments)
const shouldNoIndex =
  NOINDEX_PREVIEW === "1" ||
  Boolean(SITE_DOMAIN?.includes("staging.") || PUBLIC_DOMAIN?.includes("staging."));

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL || "https://hostel-positano.com"),
  openGraph: {
    siteName: "Hostel Brikette",
  },
  twitter: {
    site: "@hostelbrikette",
    creator: "@hostelbrikette",
  },
  ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: toRgb(BRAND_PRIMARY_RGB) },
    { media: "(prefers-color-scheme: dark)", color: toRgb(BRAND_PRIMARY_DARK_RGB) },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Theme init script - runs before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
