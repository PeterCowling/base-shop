import type { Locale } from "@acme/i18n/locales";

export type LegalDocumentKind = "terms" | "privacy" | "returns" | "shipping" | "cookie";

export type LegalSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  summary: string;
  effectiveDate: string;
  intro: string[];
  sections: LegalSection[];
};

const EFFECTIVE_DATE = "13 March 2026";
export const LEGAL_ENTITY_NAME = "Skylar SRL";
export const TRADING_NAME = "Caryina";
export const REGISTERED_OFFICE = "Via Guglielmo Marconi, 358, 84017, Positano, Salerno, Italy";
export const PROPERTY_ADDRESS = "Via Guglielmo Marconi, 358, 84017, Positano, Salerno, Italy";
export const CONTACT_EMAIL = "hostelpositano@gmail.com";
export const VAT_NUMBER = "05476940654";
export const COMPANY_WEBSITE = "https://hostel-positano.com";

const LEGAL_DOCUMENTS: Record<LegalDocumentKind, LegalDocument> = {
  terms: {
    title: "Terms of Sale and Website Use",
    summary:
      "These terms govern purchases made on the Caryina website and your use of the website. They are drafted for retail sales from Italy to customers in Italy, Germany, and the United Kingdom.",
    effectiveDate: EFFECTIVE_DATE,
    intro: [
      "These terms apply when you browse this website or place an order with Caryina. They form the contract between you and Caryina for the sale of products ordered through the website.",
      "Mandatory consumer rights that apply in your country of residence continue to apply. Nothing in these terms limits rights that cannot legally be excluded, including EU consumer protections for customers in Italy and Germany and mandatory UK consumer protections for customers in the United Kingdom.",
    ],
    sections: [
      {
        id: "scope",
        heading: "1. Scope and who we are",
        paragraphs: [
          `${TRADING_NAME} is the trading name used on this website for the design and sale of fashion accessories and handbag charms. The website is intended for consumers buying for personal use rather than resale.`,
          `${LEGAL_ENTITY_NAME} operates ${TRADING_NAME}. Registered office: ${REGISTERED_OFFICE}. Operating address: ${PROPERTY_ADDRESS}. VAT number: ${VAT_NUMBER}. Official contact email: ${CONTACT_EMAIL}. Company website: ${COMPANY_WEBSITE}.`,
        ],
      },
      {
        id: "orders",
        heading: "2. Orders and contract formation",
        paragraphs: [
          "Product listings, prices, and dispatch estimates on the website are an invitation to place an order, not a binding offer from Caryina.",
          "Your order is placed when you complete checkout. The sales contract is formed only when payment is accepted and the order is confirmed. Caryina may refuse or cancel an order before dispatch where there is a genuine stock error, pricing error, suspected fraud, or legal/compliance issue.",
        ],
      },
      {
        id: "products",
        heading: "3. Product information and availability",
        paragraphs: [
          "We aim to present products, colours, dimensions, and materials as accurately as possible. Screen settings, hand-finishing, and batch variation may cause minor differences that do not affect the product's conformity with the contract.",
          "All products are sold subject to availability. If stock becomes unavailable after checkout, Caryina may cancel the affected item and refund the amount paid for that item.",
        ],
      },
      {
        id: "pricing",
        heading: "4. Pricing, taxes, and customs",
        paragraphs: [
          "Prices shown on the website are in euro unless stated otherwise. The checkout total should show the amount payable before you submit payment.",
          "For deliveries within the European Union, prices are intended to be shown consistently with the store's EU tax setup. For deliveries to the United Kingdom, import VAT, customs duties, clearance fees, or similar charges may be collected by the carrier or customs authorities unless the checkout expressly states they are included.",
        ],
      },
      {
        id: "payment",
        heading: "5. Payment",
        paragraphs: [
          "Payments are processed by authorised payment providers used by Caryina. Caryina does not intentionally store raw payment-card details on the website beyond what is necessary for the active payment flow.",
          "If your payment is declined, the order will not be accepted. Caryina may use fraud-prevention checks where reasonably necessary to protect the business and customers.",
        ],
      },
      {
        id: "delivery",
        heading: "6. Delivery and risk",
        paragraphs: [
          "Estimated dispatch and delivery windows are not guaranteed unless the checkout or a separate written confirmation says otherwise. Caryina is not responsible for delay caused by customs checks, carrier disruption, incorrect address details supplied by you, or events outside reasonable control.",
          "Risk in the goods passes to you when the goods are delivered to you or to a person identified by you to receive them.",
        ],
      },
      {
        id: "returns",
        heading: "7. Cancellation, returns, and faulty goods",
        paragraphs: [
          "Your statutory cancellation, return, refund, exchange, and faulty-goods rights are explained in the Returns Policy, which forms part of these terms.",
          "If a product is faulty, not as described, or otherwise non-conforming, your statutory remedies continue to apply regardless of any voluntary exchange policy. For EU consumer sales this generally includes the legal guarantee framework under applicable consumer law. For UK consumer sales this includes mandatory remedies for faulty goods under UK consumer law.",
        ],
      },
      {
        id: "website-use",
        heading: "8. Website use and intellectual property",
        paragraphs: [
          "All content on this website, including text, product photography, graphics, branding, and layout, belongs to Caryina or its licensors and is protected by intellectual-property law.",
          "You may use the website only for lawful personal shopping and information purposes. You must not misuse the website, attempt to interfere with its operation, copy substantial parts of it for commercial use, frame it, or use automated tools to extract protected content except where permitted by law.",
        ],
      },
      {
        id: "liability",
        heading: "9. Liability",
        paragraphs: [
          "Nothing in these terms excludes liability that cannot legally be excluded, including liability for death or personal injury caused by negligence, fraud, or defective products where mandatory law provides protection.",
          "Subject to that, Caryina is not liable for indirect or consequential loss arising from your use of the website or delay in delivery. This does not affect liability for the goods themselves where mandatory consumer law provides a remedy.",
        ],
      },
      {
        id: "law",
        heading: "10. Governing law and disputes",
        paragraphs: [
          "These terms are governed by Italian law except to the extent mandatory consumer law in your country of residence gives you additional protection that cannot be displaced.",
          "If you are a consumer, you may usually bring claims in the courts that mandatory law allows for your place of residence. Caryina encourages customers to contact support first so most issues can be resolved without formal proceedings.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary:
      "This policy explains what personal data Caryina uses, why it is used, who it is shared with, and the rights available to customers and website visitors in Italy, Germany, and the United Kingdom.",
    effectiveDate: EFFECTIVE_DATE,
    intro: [
      "Caryina uses personal data only where there is a lawful basis to do so, including to run the website, complete orders, answer customer-service requests, prevent fraud, and meet legal obligations.",
      "This policy is written to align with the EU GDPR for customers in Italy and Germany and the UK GDPR/Data Protection Act 2018 for customers in the United Kingdom. Where a local rule gives you stronger protection, that rule continues to apply.",
    ],
    sections: [
      {
        id: "controller",
        heading: "1. Controller and contact",
        paragraphs: [
          `For purchases and website interactions handled through this site, the controller is ${LEGAL_ENTITY_NAME}, operating as ${TRADING_NAME}. Registered office: ${REGISTERED_OFFICE}. Operating address: ${PROPERTY_ADDRESS}. VAT number: ${VAT_NUMBER}.`,
          `Privacy and data-rights requests can be sent to ${CONTACT_EMAIL}, through the Support page contact route, or by replying to an order-related email. Please include enough information to identify your request and the order or email address concerned.`,
        ],
      },
      {
        id: "data-we-collect",
        heading: "2. Data we collect",
        paragraphs: [
          "Depending on how you use the site, Caryina may collect contact details, delivery details, billing details, order contents, payment status data supplied by payment providers, customer-service correspondence, and technical usage data such as device, browser, IP-derived location, and analytics events.",
          "If you ask to be notified when a product is available, Caryina may also collect your email address together with the product reference and your consent record.",
        ],
      },
      {
        id: "purposes-bases",
        heading: "3. Why we use your data and our lawful bases",
        paragraphs: [
          "Caryina uses personal data to perform the contract with you, including taking payment, shipping orders, dealing with cancellations and refunds, and providing customer support.",
          "Caryina also uses personal data where necessary for legitimate interests, such as keeping the website secure, preventing abuse or fraud, improving the store, and understanding how customers use the site, provided those interests are not overridden by your rights.",
          "Where optional analytics or product-reminder messages rely on consent, Caryina asks for that consent and you can withdraw it later. Caryina may also process data where needed to comply with tax, accounting, consumer-protection, or other legal obligations.",
        ],
      },
      {
        id: "sharing",
        heading: "4. Who we share data with",
        paragraphs: [
          "Caryina may share relevant personal data with payment processors, hosting and infrastructure providers, analytics providers, delivery and customs partners, customer-support tools, professional advisers, and public authorities where disclosure is required by law.",
          "Caryina does not sell personal data as a standalone business model. Service providers may process data only on Caryina's instructions or under their own legal responsibilities for services such as payments and regulated delivery handling.",
        ],
      },
      {
        id: "transfers",
        heading: "5. International transfers",
        paragraphs: [
          "Some service providers used to run the website or process payments may process personal data outside the EEA or the UK. Where that happens, Caryina expects the transfer to be covered by an adequacy decision, standard contractual clauses, or another lawful transfer mechanism.",
        ],
      },
      {
        id: "retention",
        heading: "6. Retention",
        paragraphs: [
          "Caryina keeps order and payment records for as long as reasonably necessary for customer service, accounting, fraud-prevention, and legal compliance. Support requests and product-notification records are kept only as long as needed for the purpose they were collected for, unless a longer period is required by law or to resolve a dispute.",
        ],
      },
      {
        id: "cookies",
        heading: "7. Cookies and analytics",
        paragraphs: [
          "The website uses essential technologies needed for core operation, such as cart and checkout continuity. Where non-essential analytics are used, Caryina asks for consent through the site's consent controls before activating them.",
        ],
      },
      {
        id: "rights",
        heading: "8. Your rights",
        paragraphs: [
          "Depending on your location and the circumstances, you may have rights to be informed, access your personal data, correct inaccurate data, erase data, restrict processing, object to processing, and receive portable copies of certain data.",
          "Customers in the UK also have the rights recognised under the UK GDPR and the Data Protection Act 2018, including rights relating to automated decision-making where applicable. Caryina does not currently use solely automated decisions to make legally significant decisions about ordinary retail customers.",
        ],
        bullets: [
          "Italy: you may complain to the Garante per la protezione dei dati personali.",
          "Germany: you may complain to the competent German supervisory authority, which may be your Land authority or another competent authority depending on the case.",
          "United Kingdom: you may complain to the Information Commissioner's Office (ICO).",
        ],
      },
      {
        id: "security",
        heading: "9. Security",
        paragraphs: [
          "Caryina uses reasonable technical and organisational measures to protect personal data. No internet transmission or storage system can be guaranteed to be perfectly secure, but Caryina aims to limit access to data to people and providers who need it for legitimate business purposes.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns, Cancellation and Refunds",
    summary:
      "This policy explains the statutory 14-day cancellation right for distance sales, Caryina's voluntary exchange handling, and the process for faulty, incorrect, or damaged items.",
    effectiveDate: EFFECTIVE_DATE,
    intro: [
      "This policy applies to orders placed on the Caryina website for delivery in Italy, Germany, and the United Kingdom.",
      "It distinguishes between your statutory cancellation rights and Caryina's separate commercial exchange handling. The commercial policy never reduces rights you have under mandatory consumer law.",
    ],
    sections: [
      {
        id: "cooling-off",
        heading: "1. Statutory cancellation right for online orders",
        paragraphs: [
          "If you buy from Caryina online as a consumer, you normally have 14 days from the day after delivery to tell Caryina that you want to cancel the contract without giving a reason.",
          "After telling Caryina you want to cancel, you normally have another 14 days to send the goods back. Refunds for valid cancellations are usually made within 14 days of Caryina receiving the returned goods or receiving evidence that they have been sent back, subject to the rules that apply in your country.",
          "Once we receive and inspect the returned item, we will process your refund within 14 days. Refunds are made to the original payment method.",
          "If you wish to cancel your order before it is dispatched, contact us immediately via the Support page or email. We will do our best to intercept the order. If it has already been dispatched, the standard 14-day cancellation right applies on receipt.",
        ],
      },
      {
        id: "condition",
        heading: "2. Condition of returned items",
        paragraphs: [
          "For a change-of-mind cancellation, you should handle the item only to the extent reasonably necessary to inspect it as you would in a shop. If the item has been used beyond that, Caryina may reduce the refund to reflect diminished value where the law allows.",
          "Please return the item with any accessories, dust bags, tags, or packaging that came with it if they are still available. Missing packaging alone does not automatically cancel statutory rights, but damage or excessive handling may affect the refund where permitted by law.",
        ],
      },
      {
        id: "costs",
        heading: "3. Return shipping costs and original delivery charges",
        paragraphs: [
          "For change-of-mind cancellations, you are responsible for the direct cost of return shipping unless Caryina expressly agrees otherwise or applicable law requires a different result because you were not properly informed before purchase.",
          "Where a cancellation refund is due, Caryina will also refund the standard outbound delivery charge paid for the order. If you selected a premium or expedited delivery option, only the standard delivery amount is refundable unless the law requires more.",
        ],
      },
      {
        id: "voluntary-exchange",
        heading: "4. Caryina's voluntary exchange handling",
        paragraphs: [
          "Separate from statutory cancellation rights, Caryina may try to accommodate exchange requests made within 30 days of delivery where the returned item is unused and replacement stock is available.",
          "An exchange is a commercial courtesy, not a substitute for your legal rights. If an exchange cannot be completed because the replacement is unavailable, Caryina may instead offer a refund or store-credit solution where lawful and appropriate.",
          "If the item you wish to exchange for is out of stock at the time of your request, we will offer you a full refund as an alternative.",
        ],
      },
      {
        id: "faulty",
        heading: "5. Faulty, incorrect, or damaged items",
        paragraphs: [
          "If the item arrives faulty, damaged, or not as described, contact Caryina as soon as reasonably possible with your order number and clear photos where available.",
          "In those cases Caryina will work with you on the remedy required by law, which may include repair, replacement, price reduction, or refund. Caryina will bear the return cost for items that are faulty, damaged in transit, or sent in error.",
        ],
      },
      {
        id: "exceptions",
        heading: "6. Exceptions and non-returnable items",
        paragraphs: [
          "The normal cancellation right does not apply to goods made to your specification or clearly personalised for you, and may not apply in other cases where mandatory law recognises an exception.",
          "At present Caryina's standard fashion-accessory products are generally expected to be returnable if the ordinary conditions above are met.",
        ],
      },
      {
        id: "how-to-return",
        heading: "7. How to start a return or cancellation",
        paragraphs: [
          `To start a cancellation, return, exchange, or faulty-item claim, contact ${TRADING_NAME} through the Support page, email ${CONTACT_EMAIL}, or reply to your order email. Include your name, order number, the item concerned, and whether you want a cancellation, exchange, or faulty-item remedy.`,
          `${LEGAL_ENTITY_NAME} will reply with the next return instructions, including the return address and any evidence needed to assess damage, non-conformity, or exchange availability. Unless different return instructions are given for the specific case, the business address used for returns correspondence is ${PROPERTY_ADDRESS}.`,
          // TODO: PLACEHOLDER — operator may choose to list the returns address directly here:
          // Via Guglielmo Marconi, 358, 84017, Positano, Salerno, Italy
          "To obtain the return address, contact us via the Support page or email. We will provide return instructions and the address within 48 hours of your request.",
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping and Delivery Policy",
    summary:
      "This policy covers dispatch timing, delivery estimates, customs and import charges, and what happens if a shipment is delayed, lost, or refused.",
    effectiveDate: EFFECTIVE_DATE,
    intro: [
      "Caryina ships from the business's operating base in Italy unless the checkout or product page says otherwise.",
      "Delivery windows are estimates and may change because of carrier capacity, customs processing, seasonal pressure, or address issues outside Caryina's reasonable control.",
    ],
    sections: [
      {
        id: "dispatch",
        heading: "1. Dispatch and delivery windows",
        paragraphs: [
          "We ship via DHL. In-stock items are usually dispatched within a short handling window after payment confirmation. The product page, cart, or checkout may show the current estimate.",
          "Deliveries within Italy and Germany are generally expected to move under normal EU parcel timelines. Deliveries to the United Kingdom may take longer because of customs and import handling.",
        ],
      },
      {
        id: "address",
        heading: "2. Delivery addresses",
        paragraphs: [
          "You are responsible for providing a complete and accurate delivery address. Caryina is not responsible for delays or extra carrier charges caused by incorrect or incomplete address information supplied at checkout.",
          `${TRADING_NAME} ships from the business address at ${PROPERTY_ADDRESS} unless the checkout or dispatch confirmation states otherwise.`,
        ],
      },
      {
        id: "customs",
        heading: "3. Customs, import VAT, and local charges",
        paragraphs: [
          "Orders delivered within the EU should not normally attract separate customs duties. Orders delivered to the United Kingdom may be subject to import VAT, customs duty, brokerage, or handling charges unless the checkout clearly states those charges are already collected.",
          "Any such import-side charges are your responsibility unless Caryina expressly states otherwise before purchase.",
        ],
      },
      {
        id: "delays",
        heading: "4. Delays, loss, and failed delivery",
        paragraphs: [
          "If a parcel is delayed, appears lost, or is marked delivered but not received, contact Caryina promptly so a carrier trace can be opened where available.",
          "If delivery fails because the parcel is refused, unclaimed, or undeliverable due to customer-supplied information, Caryina may deduct direct return or re-shipping costs from any refund where the law allows.",
        ],
      },
      {
        id: "split",
        heading: "5. Split shipments and force majeure",
        paragraphs: [
          "Where an order contains multiple items, Caryina may ship them separately if reasonably necessary. Caryina is not responsible for delay caused by events outside its reasonable control, including carrier strikes, severe weather, border disruption, or similar force-majeure events.",
        ],
      },
    ],
  },
  cookie: {
    title: "Cookie Policy",
    summary:
      "This policy explains which cookies and similar technologies Caryina uses, which are essential, and how analytics consent works on the website.",
    effectiveDate: EFFECTIVE_DATE,
    intro: [
      "Caryina uses a limited set of first-party technologies to keep the storefront working and, where consent is given, to understand how visitors use the site.",
      "This Cookie Policy should be read together with the Privacy Policy. If the consent choices on the site conflict with a previous preference, the most recent recorded choice on your browser will control until you change it again.",
    ],
    sections: [
      {
        id: "what-are-cookies",
        heading: "1. What cookies are",
        paragraphs: [
          "Cookies are small text files stored on your device when you visit a website. Similar technologies can include local browser storage or other device identifiers used to remember settings or measure usage.",
        ],
      },
      {
        id: "essential-cookies",
        heading: "2. Essential website cookies",
        paragraphs: [
          "Caryina uses essential first-party technologies needed for the storefront to function, such as maintaining cart state, checkout continuity, locale preferences, and basic security-related behavior.",
          "These technologies are used because they are necessary to provide the service you request when using the website and do not rely on optional analytics consent.",
        ],
      },
      {
        id: "analytics-cookies",
        heading: "3. Analytics cookies",
        paragraphs: [
          "If you accept analytics cookies through the consent banner, Caryina may enable analytics measurement to understand visits, page usage, and conversion behavior. The current store configuration uses Google Analytics as the analytics provider.",
          "If you decline analytics cookies, Caryina stores that refusal choice and should not activate optional analytics tracking until you change your preference.",
        ],
      },
      {
        id: "consent-cookie",
        heading: "4. Consent record used by this site",
        paragraphs: [
          "Caryina stores your analytics choice in a first-party cookie named consent.analytics. The value records whether analytics consent was accepted or declined so the banner does not continue to show on every visit.",
          "This cookie is kept for up to one year unless you clear it earlier in your browser settings.",
        ],
      },
      {
        id: "manage-cookies",
        heading: "5. Managing your preferences",
        paragraphs: [
          `You can manage cookies through your browser settings and by deleting stored site data. If you clear the consent cookie, Caryina may ask for your preference again on a later visit.`,
          `If you need help changing a consent choice or have questions about analytics on the site, contact ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
};

export function getLegalDocument(
  _locale: Locale,
  kind: LegalDocumentKind,
): LegalDocument {
  return LEGAL_DOCUMENTS[kind];
}
