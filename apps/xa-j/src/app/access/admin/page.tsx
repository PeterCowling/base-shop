/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy gate palette and copy pending design/i18n overhaul */
import type { CSSProperties } from "react";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";

import AdminConsole from "./AdminConsole.client";
import styles from "./admin.module.css";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function AccessAdminPage() {
  return (
    <main
      className={`${display.className} relative min-h-dvh overflow-hidden bg-[color:var(--gate-bg)] text-[color:var(--gate-ink)]`}
      style={
        {
          "--gate-bg": "#ffffff",
          "--gate-ink": "#111111",
          "--gate-muted": "#6b6b6b",
          "--gate-accent": "#111111",
        } as CSSProperties
      }
    >
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-16">
        <div className={`space-y-3 ${styles.adminFade}`}>
          <div className={`text-xs uppercase tracking-[0.45em] ${mono.className}`}>
            Access console
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold md:text-4xl">Gate operations</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
              <Link href="/access" className="hover:underline">
                Return to gate
              </Link>
            </div>
          </div>
          <p className="max-w-xl text-sm text-[color:var(--gate-muted)]">
            Issue and revoke keys, review inbound signals, and keep the drop sealed.
          </p>
        </div>

        <div className={`mt-10 ${styles.adminFade}`}>
          <AdminConsole monoClassName={mono.className} />
        </div>
      </div>
    </main>
  );
}
