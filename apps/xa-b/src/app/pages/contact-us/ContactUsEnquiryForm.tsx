/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy contact enquiry form pending design/i18n overhaul */
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@acme/ui/components/atoms";
import { FormField } from "@acme/ui/components/molecules";
import { Stack } from "@acme/ui/components/atoms/primitives/Stack";

import { contactPreferences, countries, queryTypes } from "./content";

export function ContactUsEnquiryForm({ supportEmail }: { supportEmail: string }) {
  return (
    <div className="rounded-lg border p-6">
      <Stack gap={4}>
        <div>
          <h2 className="text-lg font-semibold">Help &amp; Contact Us</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the form and click send to submit an enquiry. We’ll follow up using your preferred contact
            method.
          </p>
        </div>

        <form className="space-y-4">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" autoComplete="name" />
          </FormField>
          <FormField
            label="Email"
            htmlFor="email"
            required
            error={supportEmail ? undefined : "Email responses are paused in stealth mode."}
          >
            <Input id="email" name="email" type="email" autoComplete="email" />
          </FormField>
          <FormField label="Contact preferences" htmlFor="contact-preference" required>
            <Select defaultValue={contactPreferences[0]?.value}>
              <SelectTrigger id="contact-preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactPreferences.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Country/region" htmlFor="country" required>
            <Select defaultValue={countries[0]}>
              <SelectTrigger id="country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Query type" htmlFor="query-type" required>
            <Select defaultValue={queryTypes[0]}>
              <SelectTrigger id="query-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {queryTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Subject" htmlFor="subject">
            <Input id="subject" name="subject" />
          </FormField>
          <FormField label="Message" htmlFor="message">
            <Textarea id="message" name="message" rows={4} />
          </FormField>
          <FormField label="Attachments" htmlFor="attachments">
            <Input id="attachments" name="attachments" type="file" />
            <p className="text-sm text-muted-foreground">Optional</p>
          </FormField>
          <Button type="submit" className="w-full md:w-auto">
            Send
          </Button>
        </form>
      </Stack>
    </div>
  );
}
