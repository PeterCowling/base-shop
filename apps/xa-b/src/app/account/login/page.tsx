"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

import { xaI18n } from "../../../lib/xaI18n";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/account/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { authenticated?: boolean };
      })
      .then((payload) => {
        if (cancelled) return;
        if (payload?.authenticated) {
          router.replace("/account/orders");
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Login</h1>
      </Section>

      <Section padding="default" className="max-w-md">
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setBusy(true);
            try {
              const response = await fetch("/api/account/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });

              if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as
                  | { error?: string }
                  | null;
                if (response.status === 429) {
                  setError("Too many attempts. Try again in a few minutes."); // i18n-exempt -- XA-0111: auth UX copy
                } else if (payload?.error === "unauthorized") {
                  setError("Invalid email or password."); // i18n-exempt -- XA-0111: auth UX copy
                } else {
                  setError("Unable to sign in right now."); // i18n-exempt -- XA-0111: auth UX copy
                }
                return;
              }

              router.push("/account/orders");
            } catch {
              setError("Unable to sign in right now."); // i18n-exempt -- XA-0111: auth UX copy
            } finally {
              setBusy(false);
            }
          }}
        >
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete={xaI18n.t("xaB.src.app.account.login.page.l26c63")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>

          {error ? (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "CONFIRM"}
          </Button>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="#" className="underline">{xaI18n.t("xaB.src.app.account.login.page.l32c50")}</Link>
            <Link href="/account/register" className="underline">{xaI18n.t("xaB.src.app.account.login.page.l35c66")}</Link>
          </div>
        </form>
      </Section>
    </main>
  );
}
