"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy registration page pending i18n overhaul */

import { Section } from "@acme/design-system/atoms/Section";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/atoms";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

export default function RegisterPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Create account</h1>
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
          <FormField label="WhatsApp (optional)" htmlFor="whatsapp">
            <Input id="whatsapp" type="tel" autoComplete="tel" />
          </FormField>
          <FormField label="Skype (optional)" htmlFor="skype">
            <Input id="skype" type="text" autoComplete="off" />
          </FormField>
          <FormField label="Preferred support channel" htmlFor="channel">
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
