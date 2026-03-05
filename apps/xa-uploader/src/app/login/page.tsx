import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasUploaderSessionFromCookieHeader } from "../../lib/uploaderAuth";
import { UploaderI18nProvider } from "../../lib/uploaderI18n.client";
import styles from "../uploader.module.css";

import { UploaderLoginClient } from "./UploaderLogin.client";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default async function XaUploaderLoginPage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasUploaderSessionFromCookieHeader(cookieHeader);
  if (authenticated) {
    redirect("/");
  }

  return (
    <UploaderI18nProvider>
      <main className={`${display.className} relative min-h-dvh overflow-hidden bg-gate-bg text-gate-ink`}>
        {/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool page layout */}
        <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16">
          <div className={`w-full rounded-xl border border-gate-border bg-gate-surface p-8 shadow-elevation-2 ${styles.uploaderFade}`}>
            <div className="mb-6 space-y-1 text-center">
              <div className={`text-2xs uppercase tracking-label-xl text-gate-muted ${mono.className}`}>
                XA Catalog
              </div>
              {/* eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 app branding */}
              <h1 className="text-xl font-semibold text-gate-ink">Operations Console</h1>
            </div>
            <UploaderLoginClient />
          </div>
        </div>
      </main>
    </UploaderI18nProvider>
  );
}
