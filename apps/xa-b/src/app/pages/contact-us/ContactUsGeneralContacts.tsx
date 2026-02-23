import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives/Stack";

import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

type ContactUsGeneralContactsProps = {
  supportEmail: string;
  whatsappNumber: string;
  pressEmail: string;
  retailPartnersEmail: string;
  speakUpHref: string;
};

export function ContactUsGeneralContacts({
  supportEmail,
  whatsappNumber,
  pressEmail,
  retailPartnersEmail,
  speakUpHref,
}: ContactUsGeneralContactsProps) {
  const isSpeakUpExternal = speakUpHref.startsWith("http");

  return (
    <div className="rounded-lg border p-6">
      <Stack gap={3}>
        <div className="text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l28c48")}</div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l31c60")}</div>
            {supportEmail ? <div>Email: {supportEmail}</div> : null}
            {whatsappNumber ? <div>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l33c36")}{whatsappNumber}</div> : null}
            {!supportEmail && !whatsappNumber ? <div>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l34c54")}</div> : null}
          </div>
          <div>
            <div className="font-semibold text-foreground">Press</div>
            {pressEmail ? (
              <div>
                Email: <a href={`mailto:${pressEmail}`}>{pressEmail}</a>
              </div>
            ) : (
              <div>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l43c20")}</div>
            )}
          </div>
          <div>
            <div className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l47c60")}</div>
            {retailPartnersEmail ? (
              <div>
                Email: <a href={`mailto:${retailPartnersEmail}`}>{retailPartnersEmail}</a>
              </div>
            ) : (
              <div>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l53c20")}</div>
            )}
          </div>
          <div>
            <div className="font-semibold text-foreground">Jobs</div>
            <div>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l58c18")}{siteConfig.brandName}?{" "}
              <Link href="/pages/about-us" className="underline">{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l60c66")}</Link>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l62c22")}</div>
          </div>
          <div>
            <div className="font-semibold text-foreground">Buying</div>
            <p>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l68c16")}</p>
          </div>
          <div id="speak-up">
            <div className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l74c60")}</div>
            <p>{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l75c16")}</p>
            <Button variant="ghost" asChild className="px-0">
              <a
                href={speakUpHref}
                target={isSpeakUpExternal ? "_blank" : undefined}
                rel={isSpeakUpExternal ? xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l83c42") : undefined}
              >{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l84c16")}</a>
            </Button>
          </div>
          {siteConfig.showLegalInfo && siteConfig.legalAddress ? (
            <div>
              <div className="font-semibold text-foreground">Head office</div>
              <div>{siteConfig.legalAddress}</div>
              <p className="mt-1">{xaI18n.t("xaB.src.app.pages.contact.us.contactusgeneralcontacts.l93c35")}</p>
            </div>
          ) : null}
        </div>
      </Stack>
    </div>
  );
}
