import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";

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
          <div className={`text-xs uppercase xa-tracking-045 ${mono.className}`}>
            Access console
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold md:text-4xl">Gate operations</h1>
            <div className={`flex flex-wrap items-center gap-4 text-xs uppercase xa-tracking-035 ${gateClassNames.mutedText}`}>
              <Link href="/access" className="hover:underline">
                Return to gate
              </Link>
            </div>
          </div>
          <p className={`max-w-xl text-sm ${gateClassNames.mutedText}`}>
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
