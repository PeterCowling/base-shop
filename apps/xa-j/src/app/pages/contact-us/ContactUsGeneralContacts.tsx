/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy contact copy pending design/i18n overhaul */
import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives/Stack";

import { siteConfig } from "../../../lib/siteConfig";

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
        <div className="text-lg font-semibold">General contacts</div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground">Customer Service</div>
            {supportEmail ? <div>Email: {supportEmail}</div> : null}
            {whatsappNumber ? <div>Phone/WhatsApp: {whatsappNumber}</div> : null}
            {!supportEmail && !whatsappNumber ? <div>Contact details are available on request.</div> : null}
          </div>
          <div>
            <div className="font-semibold text-foreground">Press</div>
            {pressEmail ? (
              <div>
                Email: <a href={`mailto:${pressEmail}`}>{pressEmail}</a>
              </div>
            ) : (
              <div>Press enquiries are offline in stealth mode.</div>
            )}
          </div>
          <div>
            <div className="font-semibold text-foreground">Retail Partners</div>
            {retailPartnersEmail ? (
              <div>
                Email: <a href={`mailto:${retailPartnersEmail}`}>{retailPartnersEmail}</a>
              </div>
            ) : (
              <div>Partnership enquiries are offline in stealth mode.</div>
            )}
          </div>
          <div>
            <div className="font-semibold text-foreground">Jobs</div>
            <div>
              Interested in a career with {siteConfig.brandName}?{" "}
              <Link href="/pages/about-us" className="underline">
                Visit our careers page
              </Link>
              . Please apply through the careers site instead of emailing a CV.
            </div>
          </div>
          <div>
            <div className="font-semibold text-foreground">Buying</div>
            <p>
              We operate as a marketplace with partner boutiques and brand partners. Buying is handled directly
              with partners rather than through a central buying team.
            </p>
          </div>
          <div id="speak-up">
            <div className="font-semibold text-foreground">Speak Up Line</div>
            <p>
              To raise an ethics concern or code of conduct issue, use our Speak Up Line. This inbox is not for
              customer service.
            </p>
            <Button variant="ghost" asChild className="px-0">
              <a
                href={speakUpHref}
                target={isSpeakUpExternal ? "_blank" : undefined}
                rel={isSpeakUpExternal ? "noreferrer noopener" : undefined}
              >
                Report a concern
              </a>
            </Button>
          </div>
          {siteConfig.showLegalInfo && siteConfig.legalAddress ? (
            <div>
              <div className="font-semibold text-foreground">Head office</div>
              <div>{siteConfig.legalAddress}</div>
              <p className="mt-1">Please do not ship returns to this address. Use the return label provided.</p>
            </div>
          ) : null}
        </div>
      </Stack>
    </div>
  );
}
