"use client";

import * as React from "react";

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

type FormNotice = {
  tone: "error" | "info" | "success";
  message: string;
};

const CONTACT_FORM_IDS = {
  name: "contact-name", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  email: "contact-email", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  contactPreference: "contact-preference", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  country: "contact-country", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  queryType: "contact-query-type", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  subject: "contact-subject", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  message: "contact-message", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
  attachments: "contact-attachments", // i18n-exempt -- XA-0142 [ttl=2026-12-31] stable DOM id
} as const;

const MAILTO_WINDOW_TARGET = "_blank"; // i18n-exempt -- XA-0142 [ttl=2026-12-31] browser API target
const MAILTO_WINDOW_FEATURES = "noopener,noreferrer"; // i18n-exempt -- XA-0142 [ttl=2026-12-31] browser API features

export function ContactUsEnquiryForm({ supportEmail }: { supportEmail: string }) {
  const copy = {
    formUnavailable: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.formUnavailable",
    ),
    requiredFields: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.requiredFields",
    ),
    subjectPrefix: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.subjectPrefix"),
    bodyName: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyName"),
    bodyEmail: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyEmail"),
    bodyPreferredContact: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyPreferredContact",
    ),
    bodyCountry: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyCountry"),
    bodyQueryType: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyQueryType"),
    bodyMessageHeading: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyMessageHeading",
    ),
    bodyAttachmentsHeading: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.bodyAttachmentsHeading",
    ),
    noticeDraftOpenedWithAttachments: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.noticeDraftOpenedWithAttachments",
    ),
    noticeDraftOpened: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.noticeDraftOpened",
    ),
    errorStealthPaused: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.errorStealthPaused",
    ),
    labelName: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelName"),
    labelEmail: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelEmail"),
    labelPreferredContact: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelPreferredContact",
    ),
    labelCountryRegion: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelCountryRegion",
    ),
    labelQueryType: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelQueryType",
    ),
    labelSubject: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelSubject"),
    labelMessage: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelMessage"),
    labelAttachments: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.labelAttachments",
    ),
    attachmentsHelp: xaI18n.t(
      "xaB.src.app.pages.contact.us.contactusenquiryform.copy.attachmentsHelp",
    ),
    send: xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.copy.send"),
  };
  const defaultContactPreference = contactPreferences[0]?.value ?? "";
  const defaultCountry = countries[0] ?? "";
  const defaultQueryType = queryTypes[0] ?? "";

  const [contactPreference, setContactPreference] = React.useState<string>(
    defaultContactPreference,
  );
  const [country, setCountry] = React.useState<string>(defaultCountry);
  const [queryType, setQueryType] = React.useState<string>(defaultQueryType);
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [notice, setNotice] = React.useState<FormNotice | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportEmail) {
      setNotice({
        tone: "error",
        message: copy.formUnavailable,
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setNotice({
        tone: "error",
        message: copy.requiredFields,
      });
      return;
    }

    const subjectLine = [copy.subjectPrefix, queryType, subject || name]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" - ");

    const bodyLines = [
      `${copy.bodyName}: ${name}`,
      `${copy.bodyEmail}: ${email}`,
      `${copy.bodyPreferredContact}: ${contactPreference}`,
      `${copy.bodyCountry}: ${country}`,
      `${copy.bodyQueryType}: ${queryType}`,
      "",
      `${copy.bodyMessageHeading}:`,
      message,
    ];

    if (selectedFiles.length > 0) {
      bodyLines.push(
        "",
        `${copy.bodyAttachmentsHeading}:`,
        ...selectedFiles.map((fileName) => `- ${fileName}`),
      );
    }

    const params = new URLSearchParams({
      subject: subjectLine,
      body: bodyLines.join("\n"),
    });
    const mailtoHref = `mailto:${supportEmail}?${params.toString()}`;

    const popup = window.open(mailtoHref, MAILTO_WINDOW_TARGET, MAILTO_WINDOW_FEATURES);
    if (!popup) {
      window.location.assign(mailtoHref);
    }

    setNotice({
      tone: selectedFiles.length > 0 ? "info" : "success",
      message:
        selectedFiles.length > 0
          ? copy.noticeDraftOpenedWithAttachments
          : copy.noticeDraftOpened,
    });
  };

  const noticeClassName =
    notice?.tone === "error"
      ? "text-destructive"
      : notice?.tone === "info"
        ? "text-muted-foreground"
        : "text-foreground";

  return (
    <div className="rounded-lg border p-6">
      <Stack gap={4}>
        <div>
          <h2 className="text-lg font-semibold">
            {xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l21c49")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {xaI18n.t("xaB.src.app.pages.contact.us.contactusenquiryform.l22c61")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label={copy.labelName} htmlFor={CONTACT_FORM_IDS.name} required>
            <Input id={CONTACT_FORM_IDS.name} name="name" autoComplete="name" required />
          </FormField>
          <FormField
            label={copy.labelEmail}
            htmlFor={CONTACT_FORM_IDS.email}
            required
            error={supportEmail ? undefined : copy.errorStealthPaused}
          >
            <Input
              id={CONTACT_FORM_IDS.email}
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </FormField>
          <FormField
            label={copy.labelPreferredContact}
            htmlFor={CONTACT_FORM_IDS.contactPreference}
            required
          >
            <Select value={contactPreference} onValueChange={setContactPreference}>
              <SelectTrigger id={CONTACT_FORM_IDS.contactPreference}>
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
          <FormField label={copy.labelCountryRegion} htmlFor={CONTACT_FORM_IDS.country} required>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id={CONTACT_FORM_IDS.country}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={copy.labelQueryType} htmlFor={CONTACT_FORM_IDS.queryType} required>
            <Select value={queryType} onValueChange={setQueryType}>
              <SelectTrigger id={CONTACT_FORM_IDS.queryType}>
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
          <FormField label={copy.labelSubject} htmlFor={CONTACT_FORM_IDS.subject}>
            <Input id={CONTACT_FORM_IDS.subject} name="subject" />
          </FormField>
          <FormField label={copy.labelMessage} htmlFor={CONTACT_FORM_IDS.message} required>
            <Textarea id={CONTACT_FORM_IDS.message} name="message" rows={4} required />
          </FormField>
          <FormField label={copy.labelAttachments} htmlFor={CONTACT_FORM_IDS.attachments}>
            <Input
              id={CONTACT_FORM_IDS.attachments}
              name="attachments"
              type="file"
              multiple
              onChange={(event) => {
                const next = Array.from(event.currentTarget.files ?? []).map((file) => file.name);
                setSelectedFiles(next);
              }}
            />
            <p className="text-sm text-muted-foreground">{copy.attachmentsHelp}</p>
          </FormField>
          <Button type="submit" className="w-full md:w-auto" disabled={!supportEmail}>
            {copy.send}
          </Button>
          {notice ? <p className={`text-sm ${noticeClassName}`}>{notice.message}</p> : null}
        </form>
      </Stack>
    </div>
  );
}
