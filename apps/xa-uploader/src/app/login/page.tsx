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
        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-6 py-16">
          <div className={`space-y-3 ${styles.uploaderFade} ${mono.className}`} />
          <div className={`mt-10 ${styles.uploaderFade}`}>
            <UploaderLoginClient />
          </div>
        </div>
      </main>
    </UploaderI18nProvider>
  );
}
