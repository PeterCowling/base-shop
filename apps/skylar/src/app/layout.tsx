import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/loket-nav.css";
import "./styles/loket-english-typography.css";
import "./styles/loket-hero.css";
import "./styles/loket-link.css";
import "./styles/loket-intro.css";
import "./styles/loket-massive.css";
import "./styles/loket-category.css";
import "./styles/loket-split.css";
import "./styles/loket-marquee.css";
import "./styles/loket-showcase.css";
import "./styles/loket-services.css";
import "./styles/loket-real.css";
import "./styles/loket-people.css";
import "./styles/loket-footer.css";
import "./styles/products-en.css";
import "./styles/real-estate.css";
import "./styles/people-en.css";
import "./styles/zh.css";
import "./styles/milan-base.css";
import "./styles/milan-home.css";
import "./styles/milan-products.css";
import "./styles/milan-real-estate.css";
import "./styles/milan-people.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Skylar SRL" /* i18n-exempt -- DS-000 metadata not localized [ttl=2026-12-31] */,
  description:
    "Product design, China sourcing, custom distribution, and multilingual platforms from the Skylar SRL team." /* i18n-exempt -- DS-000 metadata not localized [ttl=2026-12-31] */,
  metadataBase: new URL("https://skylarsrl.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} font-sans`}>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
