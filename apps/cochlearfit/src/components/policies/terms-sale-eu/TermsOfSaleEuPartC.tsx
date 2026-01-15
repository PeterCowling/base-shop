import { SUPPORT_EMAIL } from "@/lib/site";

type TermsOfSaleEuPartCProps = {
  bulletClassName: string;
  linkClassName: string;
  sectionClassName: string;
};

export default function TermsOfSaleEuPartC({
  bulletClassName,
  linkClassName,
  sectionClassName,
}: TermsOfSaleEuPartCProps) {
  return (
    <>
      <section id="returns-address" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          11) Returns address and instructions
        </h2>
        <p>Unless we instruct otherwise, returns should be sent to:</p>
        <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
          <div className="space-y-1">
            <div className="font-semibold text-foreground">Skylar SRL</div>
            <div>Via Guglielmo Marconi 358</div>
            <div>Positano, 84017</div>
            <div>Italy</div>
          </div>
        </div>
        <p>
          We may provide additional instructions to ensure correct routing and efficient processing.
        </p>
      </section>

      <section id="customer-service" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          12) Customer service and complaints
        </h2>
        <p>
          If you have a complaint, please contact customer support (see Section 1). We aim to respond within a reasonable time.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Online Dispute Resolution (ODR)
        </h3>
        <p>
          The EU’s former Online Dispute Resolution platform has been discontinued. If you need assistance with cross‑border consumer issues, you may consult EU consumer redress resources and your local consumer authority.
        </p>
      </section>

      <section id="liability" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          13) Limitation of liability
        </h2>
        <p>
          Nothing in these Terms limits or excludes liability where it would be unlawful to do so, including liability for death or personal injury caused by negligence, fraud, or any non‑waivable consumer rights.
        </p>
        <p>Subject to the above:</p>
        <ul className={bulletClassName}>
          <li>
            We are not liable for losses caused by events beyond our reasonable control (see Force Majeure).
          </li>
          <li>
            We are not responsible for delays or failures caused by carriers, provided we have dispatched the Goods as described.
          </li>
        </ul>
      </section>

      <section id="force-majeure" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          14) Force majeure
        </h2>
        <p>
          We are not responsible for failure or delay in performing obligations due to events beyond our reasonable control, including (without limitation) carrier disruptions, strikes, severe weather, and other events outside our control.
        </p>
      </section>

      <section id="governing-law" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          15) Governing law and jurisdiction
        </h2>
        <p>
          These Terms are governed by the laws of Italy, without prejudice to mandatory consumer protection rules that apply in your country of residence within the EU.
        </p>
        <p>
          If you are a consumer, you may bring proceedings in the courts of your Member State of residence, where applicable, and we may be required to bring proceedings there as well.
        </p>
      </section>

      <section id="changes" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          16) Changes to these Terms
        </h2>
        <p>
          We may update these Terms from time to time. The version published on the Store at the time you place your Order applies to that Order.
        </p>
      </section>

      <section id="annex-a" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Annex A — Model withdrawal form
        </h2>
        <p>(Complete and return this form only if you wish to withdraw from the contract.)</p>
        <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
          <div className="space-y-2">
            <p>
              To: Skylar SRL, Via Guglielmo Marconi 358, Positano, 84017, Italy —{" "}
              <a className={linkClassName} href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p>
              I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods:
            </p>
            <p>______________________________________________</p>
            <p>Ordered on (*) / received on (*): ______________________________</p>
            <p>Name of consumer(s): ______________________________</p>
            <p>Address of consumer(s): ______________________________</p>
            <p>
              Signature of consumer(s) (only if this form is notified on paper): ______________________________
            </p>
            <p>Date: ______________________________</p>
            <p className="text-xs text-muted-foreground">(*) Delete as appropriate.</p>
          </div>
        </div>
      </section>
    </>
  );
}

