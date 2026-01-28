import "@/styles/global.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

/* eslint-disable ds/no-hardcoded-copy -- BOS-04 */
// i18n-exempt -- BOS-04 [ttl=2026-03-01] Scaffold page; real UI in BOS-11+
export const metadata: Metadata = {
  title: "Business OS",
  description: "Repo-native Business OS + Kanban system",
};
/* eslint-enable ds/no-hardcoded-copy */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
