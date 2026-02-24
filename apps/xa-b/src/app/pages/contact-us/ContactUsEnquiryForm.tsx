import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@acme/design-system/atoms";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";
import { Stack } from "@acme/design-system/primitives/Stack";

import { xaI18n } from "../../../lib/xaI18n";

import { contactPreferences, countries, queryTypes } from "./content";

export function ContactUsEnquiryForm({ supportEmail }: { supportEmail: string }) {
  return (
    <div className="rounded-lg border p-6">
      <Stack gap={4}>
        <div>
          <h2 className="text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l21c49")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l22c61")}</p>
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
          <FormField label={xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l40c28")} htmlFor={xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l40c58")} required>
            <Select defaultValue={contactPreferences[0]?.value}>
              <SelectTrigger id={xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l42c33")}>
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
          <FormField label={xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l54c28")} htmlFor="country" required>
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
