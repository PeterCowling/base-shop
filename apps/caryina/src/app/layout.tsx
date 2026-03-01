import "../styles/global.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { initTheme } from "@acme/platform-core/utils";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant-garamond",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-dm-sans",
});

const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3018");

export const metadata: Metadata = {
  metadataBase,
  // i18n-exempt -- CARYINA-101 [ttl=2026-12-31]
  title: "Caryina",
  // i18n-exempt -- CARYINA-102 [ttl=2026-12-31]
  description:
    "Caryina mini bag charms and micro accessories designed in Positano, Italy.",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    // i18n-exempt -- CARYINA-101 [ttl=2026-12-31]
    title: "Caryina",
    // i18n-exempt -- CARYINA-102 [ttl=2026-12-31]
    description:
      "Caryina mini bag charms and micro accessories designed in Positano, Italy.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        // i18n-exempt -- CARYINA-101 [ttl=2026-12-31]
        alt: "Caryina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
