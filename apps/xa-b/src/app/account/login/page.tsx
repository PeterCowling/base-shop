"use client";


import Link from "next/link";

import { Button, Input } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

import { xaI18n } from "../../../lib/xaI18n";

export default function LoginPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Login</h1>
      </Section>

      <Section padding="default" className="max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <FormField label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" />
          </FormField>
          <FormField label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete={xaI18n.t("xaB.src.app.account.login.page.l26c63")} />
          </FormField>
          <Button type="submit" className="w-full">
            CONFIRM
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
