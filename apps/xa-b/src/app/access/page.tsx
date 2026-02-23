import type { CSSProperties } from "react";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";

import { Button, Input } from "@acme/design-system/atoms";
import { ElevatedPanel } from "@acme/ui/components/organisms/ElevatedPanel";

import { siteConfig } from "../../lib/siteConfig";

import styles from "./access.module.css";
import AccessGateClient from "./AccessGate.client";
import AccessSignals from "./AccessSignals.client";

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
        <div className={`space-y-6 ${styles.gateFade}`}>
          <div className={`text-xs uppercase tracking-[0.45em] ${mono.className}`}>
            Invite only // Private network
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              {siteConfig.brandName}
            </h1>
            <p className="max-w-xl text-base text-[color:var(--gate-muted)] md:text-lg">
              Underground preview access. Keys are issued sparingly and move hand to hand.
            </p>
          </div>
        </div>

        <div className={`mt-10 grid gap-8 md:grid-cols-[1.1fr_0.9fr] ${styles.gateFade} ${styles.gateDelay}`}>
          <ElevatedPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-xs uppercase tracking-[0.35em] ${mono.className}`}>
                  Access key
                </div>
                <p className="mt-2 text-sm text-[color:var(--gate-muted)]">
                  {hasKeysRemaining
                    ? "Enter a valid key to unlock the drop."
                    : "Keys are offline. Requests only."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-[color:var(--gate-muted)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--gate-ink)]" />
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
              <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form action="/api/access" method="post" className="mt-6 space-y-4">
              <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
                Key slot
                <Input
                  name="code"
                  placeholder="XXXX-XXXX"
                  className="mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-3 text-sm uppercase tracking-[0.35em] text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:ring-[color:var(--gate-ink)]/20"
                  autoComplete="off"
                  required
                />
              </label>
              <Input type="hidden" name="next" value={nextValue} className="hidden" />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  className="h-auto inline-flex items-center gap-2 rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-sm font-semibold text-primary-fg transition hover:opacity-90"
                >
                  Unlock
                </Button>
                <div className="text-xs text-[color:var(--gate-muted)]">
                  Keys are case-insensitive. Do not share in public.
                </div>
              </div>
            </form>
          </ElevatedPanel>

          <ElevatedPanel>
            <AccessGateClient monoClassName={mono.className} />
          </ElevatedPanel>
        </div>

        <div className={`mt-12 flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)] ${mono.className}`}>
          <span>Silent launch</span>
          <span>Closed loop</span>
          <span>Zero indexing</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[color:var(--gate-ink)] hover:underline"
          >
            Return to gate
          </Link>
        </div>
      </div>
    </main>
  );
}
