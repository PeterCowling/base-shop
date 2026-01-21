/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy return policy content pending design/i18n overhaul */
import { Section } from "@acme/ui/atoms/Section";
import { siteConfig } from "../../../lib/siteConfig";

export default function ReturnPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Return policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Returns for {productDescriptor} purchased from {brandName} are handled under this policy.
          This page is a starter template. Replace placeholders with your legal entity details.
        </p>
      </Section>

      <Section padding="default">
        <div className="space-y-6">
          {siteConfig.showLegalInfo || siteConfig.showContactInfo ? (
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-semibold">Company</div>
              {siteConfig.showLegalInfo && siteConfig.legalEntityName ? (
                <div>{siteConfig.legalEntityName}</div>
              ) : null}
              {siteConfig.showLegalInfo && siteConfig.legalAddress ? (
                <div>{siteConfig.legalAddress}</div>
              ) : null}
              {siteConfig.showContactInfo && siteConfig.supportEmail ? (
                <div>Support: {siteConfig.supportEmail}</div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Refundable vs non-refundable</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-left">Situation</th>
                    <th className="p-3 text-left">Outcome</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="p-3">Out of stock after purchase</td>
                    <td className="p-3">Refundable</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Pre-order cancellation</td>
                    <td className="p-3">Non-refundable</td>
                  </tr>
                  <tr>
                    <td className="p-3">Change of mind</td>
                    <td className="p-3">Non-refundable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Contact</h2>
            {siteConfig.showContactInfo ? (
              <p className="text-sm text-muted-foreground">
                {siteConfig.showSocialLinks && siteConfig.whatsappNumber ? (
                  <>WhatsApp: {siteConfig.whatsappNumber} · </>
                ) : null}
                {siteConfig.supportEmail ? `Email: ${siteConfig.supportEmail}` : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact details are available on request.
              </p>
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}
