type TermsOfSaleEuPartAProps = {
  bulletClassName: string;
  linkClassName: string;
  sectionClassName: string;
};

export default function TermsOfSaleEuPartA({
  bulletClassName,
  sectionClassName,
}: TermsOfSaleEuPartAProps) {
  return (
    <>
      <section id="scope-and-definitions" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          2) Scope and definitions
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          2.1 Who these Terms apply to
        </h3>
        <p>
          These Terms apply to purchases made by consumers (individuals acting for
          purposes outside their trade, business, craft, or profession).
        </p>
        <p>
          If you are purchasing as a business customer, please contact us before
          ordering; additional or different terms may apply.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          2.2 Definitions
        </h3>
        <ul className={bulletClassName}>
          <li>
            “Consumer” means a natural person acting outside a trade, business, craft,
            or profession.
          </li>
          <li>“Goods” means the physical products sold on the Store.</li>
          <li>“Order” means the purchase request you submit through the checkout.</li>
          <li>
            “Working day” means Monday to Friday, excluding public holidays in Italy.
          </li>
          <li>
            “Standard delivery” means the least expensive delivery option we offer for
            a given Order at checkout.
          </li>
        </ul>
      </section>

      <section id="products" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          3) Products and product information
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          3.1 What we sell
        </h3>
        <p>
          We sell children’s headbands and related accessories intended to help hold
          behind‑the‑ear sound processors more securely during everyday use. Our main
          product families include:
        </p>
        <ul className={bulletClassName}>
          <li>Comfort Bands</li>
          <li>Sport Wear</li>
          <li>Water Wear (Type 1 and Type 2)</li>
          <li>Spare Loops (sew‑on replacement loops)</li>
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          3.2 Compatibility and brand references
        </h3>
        <p>
          Our products are designed to be compatible with behind‑the‑ear sound
          processor setups. Where we reference third‑party brands, those names are
          trademarks of their respective owners. Skylar SRL is not affiliated with or
          endorsed by any third‑party brand unless explicitly stated.
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          3.3 No medical claims
        </h3>
        <p>
          Our Goods are accessories. We do not make medical claims about hearing
          outcomes or device performance. Any references to “comfort”, “fit”, “secure
          feel”, “confidence”, or “appearance” are not medical claims.
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          3.4 Patterns, colours, and images
        </h3>
        <p>
          Patterns and colours may appear slightly different due to lighting, screen
          settings, and material batches. For patterned items, pattern placement may
          vary. This does not affect your statutory rights.
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          3.5 Small parts / supervision
        </h3>
        <p>
          Some components (including Spare Loops) may be small parts. Keep small parts
          away from young children and use with appropriate adult supervision.
        </p>
      </section>

      <section id="ordering" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          4) Ordering and contract formation
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          4.1 Placing an order
        </h3>
        <p>You place an Order by completing checkout and submitting payment.</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          4.2 When the contract is formed
        </h3>
        <p>
          A contract is formed when we accept your Order by sending an order
          confirmation email and taking payment (or confirming payment capture).
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          4.3 Order limits and refusal
        </h3>
        <p>We may refuse or cancel an Order if:</p>
        <ul className={bulletClassName}>
          <li>the Goods are unavailable,</li>
          <li>the delivery address is not supported or is in an excluded region,</li>
          <li>there is an obvious pricing or listing error,</li>
          <li>we reasonably suspect fraud or misuse.</li>
        </ul>
        <p>If we cancel an Order after payment, we will refund you.</p>
      </section>

      <section id="prices-vat-promotions" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          5) Prices, VAT, and promotions
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          5.1 Currency and VAT
        </h3>
        <p>
          Prices are shown in EUR and include VAT where applicable, unless clearly
          stated otherwise on the Store.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          5.2 Shipping costs
        </h3>
        <p>
          Shipping costs are not included in product prices and are shown at checkout
          based on your delivery address and chosen delivery option.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          5.3 Promotions and bundles
        </h3>
        <p>
          We may offer discounts and bundles with fixed bundle pricing. If you return
          part of a discounted bundle order, refunds are calculated based on the
          discounted effective value allocated to each item (see Section 9.4).
        </p>
      </section>

      <section id="payment" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          6) Payment
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          6.1 Accepted payment methods
        </h3>
        <p>At launch, we accept:</p>
        <ul className={bulletClassName}>
          <li>Cards (via Stripe)</li>
          <li>Apple Pay / Google Pay (where available)</li>
        </ul>
        <p>Additional payment methods may be added later.</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          6.2 Payment security
        </h3>
        <p>
          Payments are processed by our payment provider. We do not store full payment
          card details on our servers.
        </p>
      </section>
    </>
  );
}

