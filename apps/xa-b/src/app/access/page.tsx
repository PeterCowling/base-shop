import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";

import { Button, Input } from "@acme/design-system/atoms";
import { ElevatedPanel } from "@acme/ui/components/organisms/ElevatedPanel";

import { siteConfig } from "../../lib/siteConfig";

import styles from "./access.module.css";
import AccessGateClient from "./AccessGate.client";
import AccessSignals from "./AccessSignals.client";
import { gateClassNames } from "./gateClasses";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

type AccessPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

function resolveErrorMessage(error?: string) {
  if (error === "invalid") {
    return "That key is not recognized. Check spacing and try again.";
  }
  if (error === "closed") {
    return "Invites are paused. Submit a request to be considered.";
  }
  if (error === "missing") {
    return "Enter an access key to continue.";
  }
  if (error === "rate_limited") {
    return "Too many attempts. Pause, then try again.";
  }
  return null;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const errorMessage = resolveErrorMessage(resolvedSearchParams?.error);
  const nextValue = resolvedSearchParams?.next ?? "";
  const dropLabel = (
    process.env.XA_STEALTH_DROP_LABEL ?? process.env.STEALTH_DROP_LABEL ?? ""
  ).trim();
  const dropOpensAt = (
    process.env.XA_STEALTH_DROP_OPENS_AT ??
    process.env.STEALTH_DROP_OPENS_AT ??
    ""
  ).trim();
  const keysRemaining = (
    process.env.XA_STEALTH_KEYS_REMAINING ??
    process.env.STEALTH_KEYS_REMAINING ??
    ""
  ).trim();
  const remainingCount = Number.parseInt(keysRemaining, 10);
  const hasKeysRemaining = Number.isFinite(remainingCount)
    ? remainingCount > 0
    : true;
  const keySeries = (
    process.env.XA_STEALTH_KEY_SERIES ??
    process.env.STEALTH_KEY_SERIES ??
    ""
  )
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return (
    <main className={`${display.className} ${gateClassNames.pageRoot}`}>
      <div className={gateClassNames.pageFrame}>
        <div className={`space-y-6 ${styles.gateFade}`}>
          <div className={`text-xs uppercase xa-tracking-045 ${mono.className}`}>
            Invite only // Private network
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              {siteConfig.brandName}
            </h1>
            <p className={`max-w-xl text-base md:text-lg ${gateClassNames.mutedText}`}>
              Underground preview access. Keys are issued sparingly and move hand to hand.
            </p>
          </div>
        </div>

        <div className={`mt-10 xa-grid-access-panels ${styles.gateFade} ${styles.gateDelay}`}>
          <ElevatedPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-xs uppercase xa-tracking-035 ${mono.className}`}>
                  Access key
                </div>
                <p className={`mt-2 text-sm ${gateClassNames.mutedText}`}>
                  {hasKeysRemaining
                    ? "Enter a valid key to unlock the drop."
                    : "Keys are offline. Requests only."}
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 text-xs ${gateClassNames.mutedText}`}>
                <span className={gateClassNames.statusDot} />
                Signal live
              </div>
            </div>

            <AccessSignals
              dropLabel={dropLabel}
              dropOpensAt={dropOpensAt}
              keysRemaining={keysRemaining}
              keySeries={keySeries}
              monoClassName={mono.className}
            />

            {errorMessage ? (
              <div className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger-fg">
                {errorMessage}
              </div>
            ) : null}

            <form action="/api/access" method="post" className="mt-6 space-y-4">
              <label className={gateClassNames.fieldLabel}>
                Key slot
                <Input
                  name="code"
                  placeholder="XXXX-XXXX"
                  className={`${gateClassNames.fieldInput} uppercase xa-tracking-035`}
                  autoComplete="off"
                  required
                />
              </label>
              <Input type="hidden" name="next" value={nextValue} className="hidden" />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  className={gateClassNames.primaryButton}
                >
                  Unlock
                </Button>
                <div className={`text-xs ${gateClassNames.mutedText}`}>
                  Keys are case-insensitive. Do not share in public.
                </div>
              </div>
            </form>
          </ElevatedPanel>

          <ElevatedPanel>
            <AccessGateClient monoClassName={mono.className} />
          </ElevatedPanel>
        </div>

        <div className={`mt-12 flex flex-wrap items-center gap-6 text-xs uppercase xa-tracking-035 ${gateClassNames.mutedText} ${mono.className}`}>
          <span>Silent launch</span>
          <span>Closed loop</span>
          <span>Zero indexing</span>
          <Link
            href="/"
            className={`inline-flex items-center gap-2 ${gateClassNames.inkText} hover:underline`}
          >
            Return to gate
          </Link>
        </div>
      </div>
    </main>
  );
}
