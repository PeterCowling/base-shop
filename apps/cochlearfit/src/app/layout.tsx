import "./globals.css";

import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";

import HtmlLangUpdater from "@/components/HtmlLangUpdater";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <HtmlLangUpdater />
        {children}
      </body>
    </html>
  );
}
