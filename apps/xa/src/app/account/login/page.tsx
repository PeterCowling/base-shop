"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy account login page pending i18n overhaul */

import Link from "next/link";

import { Section } from "@ui/atoms/Section";
import { Button, Input } from "@ui/components/atoms";
import { FormField } from "@ui/components/molecules";

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
            <Input id="password" type="password" autoComplete="current-password" />
          </FormField>
          <Button type="submit" className="w-full">
            CONFIRM
          </Button>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="#" className="underline">
              Reset password
            </Link>
            <Link href="/account/register" className="underline">
              Create account
            </Link>
          </div>
        </form>
      </Section>
    </main>
  );
}
