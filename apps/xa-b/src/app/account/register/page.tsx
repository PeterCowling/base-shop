"use client";


import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

import { xaI18n } from "../../../lib/xaI18n";

export default function RegisterPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">{xaI18n.t("xaB.src.app.account.register.page.l12c48")}</h1>
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
            <Input id="password" type="password" autoComplete="new-password" />
          </FormField>
          <FormField label={xaI18n.t("xaB.src.app.account.register.page.l26c28")} htmlFor="whatsapp">
            <Input id="whatsapp" type="tel" autoComplete="tel" />
          </FormField>
          <FormField label={xaI18n.t("xaB.src.app.account.register.page.l29c28")} htmlFor="skype">
            <Input id="skype" type="text" autoComplete="off" />
          </FormField>
          <FormField label={xaI18n.t("xaB.src.app.account.register.page.l32c28")} htmlFor="channel">
            <Select defaultValue="whatsapp">
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
          <Button type="submit" className="w-full">
            CONFIRM
          </Button>
        </form>
      </Section>
    </main>
  );
}
