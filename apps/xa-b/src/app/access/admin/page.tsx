import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";

import { xaI18n } from "../../../lib/xaI18n";
import { gateClassNames } from "../gateClasses";

import styles from "./admin.module.css";
import AdminConsole from "./AdminConsole.client";

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
    <main className={`${display.className} ${gateClassNames.pageRoot}`}>
      <div className={gateClassNames.pageFrame}>
        <div className={`space-y-3 ${styles.adminFade}`}>
          <div className={`text-xs uppercase xa-tracking-045 ${mono.className}`}>{xaI18n.t("xaB.src.app.access.admin.page.l23c82")}</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold md:text-4xl">{xaI18n.t("xaB.src.app.access.admin.page.l27c64")}</h1>
            <div className={`flex flex-wrap items-center gap-4 text-xs uppercase xa-tracking-035 ${gateClassNames.mutedText}`}>
              <Link href="/access" className="hover:underline">{xaI18n.t("xaB.src.app.access.admin.page.l29c64")}</Link>
            </div>
          </div>
          <p className={`max-w-xl text-sm ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.admin.page.l34c73")}</p>
        </div>

        <div className={`mt-10 ${styles.adminFade}`}>
          <AdminConsole monoClassName={mono.className} />
        </div>
      </div>
    </main>
  );
}
