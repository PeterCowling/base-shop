"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

import { xaI18n } from "../../../lib/xaI18n";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [skype, setSkype] = React.useState("");
  const [preferredChannel, setPreferredChannel] = React.useState("whatsapp");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">{xaI18n.t("xaB.src.app.account.register.page.l12c48")}</h1>
      </Section>

      <Section padding="default" className="max-w-md">
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setBusy(true);
            try {
              const response = await fetch("/api/account/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email,
                  password,
                  whatsapp,
                  skype,
                  preferredChannel,
                }),
              });

              if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as
                  | { error?: string }
                  | null;
                if (payload?.error === "exists") {
                  setError("An account with this email already exists."); // i18n-exempt -- XA-0111: auth UX copy
                } else if (payload?.error === "invalid_credentials") {
                  setError("Use a valid email and a password with at least 8 characters."); // i18n-exempt -- XA-0111: auth UX copy
                } else if (response.status === 429) {
                  setError("Too many attempts. Try again later."); // i18n-exempt -- XA-0111: auth UX copy
                } else {
                  setError("Unable to create your account right now."); // i18n-exempt -- XA-0111: auth UX copy
                }
                return;
              }

              router.push("/account/orders");
            } catch {
              setError("Unable to create your account right now."); // i18n-exempt -- XA-0111: auth UX copy
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <FormField label={xaI18n.t("xaB.src.app.account.register.page.l26c28")} htmlFor="whatsapp">
            <Input
              id="whatsapp"
              type="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
            />
          </FormField>
          <FormField label={xaI18n.t("xaB.src.app.account.register.page.l29c28")} htmlFor="skype">
            <Input
              id="skype"
              type="text"
              autoComplete="off"
              value={skype}
              onChange={(event) => setSkype(event.target.value)}
            />
          </FormField>
          <FormField label={xaI18n.t("xaB.src.app.account.register.page.l32c28")} htmlFor="channel">
            <Select value={preferredChannel} onValueChange={setPreferredChannel}>
              <SelectTrigger id="channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="wechat">WeChat</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {error ? (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account..." : "CONFIRM"}
          </Button>
        </form>
      </Section>
    </main>
  );
}
