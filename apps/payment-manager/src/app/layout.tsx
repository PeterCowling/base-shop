import "./globals.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Manager",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline theme init — runs before paint to prevent FOUC on dark-mode pages */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pm-theme");if(t!=="light"){document.documentElement.setAttribute("data-theme","dark");document.documentElement.classList.add("theme-dark")}}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.classList.add("theme-dark")}})()`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-gate-bg text-gate-ink antialiased">
        {children}
      </body>
    </html>
  );
}
