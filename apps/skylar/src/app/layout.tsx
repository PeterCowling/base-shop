import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skylar SRL" /* i18n-exempt -- DS-000 metadata not localized [ttl=2026-12-31] */,
  description:
    "Product design, China sourcing, custom distribution, and multilingual platforms from the Skylar SRL team." /* i18n-exempt -- DS-000 metadata not localized [ttl=2026-12-31] */,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
