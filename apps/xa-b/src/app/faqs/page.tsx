/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy FAQ experience pending design/i18n overhaul */
import Link from "next/link";
import type { ReactNode } from "react";

import { Section } from "@acme/design-system/atoms/Section";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Button } from "@acme/design-system/atoms";
import Accordion from "@acme/design-system/molecules/Accordion";
import { siteConfig } from "../../lib/siteConfig";

type FaqItem = {
  question: string;
  content: ReactNode;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

const brandName = siteConfig.brandName;
const productDescriptor = siteConfig.catalog.productDescriptor;
const packagingItems = siteConfig.catalog.packagingItems;

const faqSections: FaqSection[] = [
  {
    title: "How to shop and place an order",
    items: [
      {
        question: "Do I need an account to place an order?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>No, all you need is an email address to place and track orders.</p>
            <p>
              If you want faster checkout, wishlist access, and order updates, set up a {brandName}
              account. When you create an account and place an order you are automatically enrolled
              in the Access loyalty programme for perks like early sale access, priority support,
              unlimited free shipping, and styling help.
            </p>
            <p>
              <a
                href="/account/register"
                className="text-foreground underline"
              >
                Learn more about the Access loyalty programme
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        question: "I've forgotten my password, what should I do?",
        content: (
          <p className="text-sm text-muted-foreground">
            Follow the{" "}
            <Link href="/account/login" className="underline">
              forgot your password
            </Link>{" "}
            link on the Sign In page and enter your email address. You will get an email to reset
            your password.
          </p>
        ),
      },
      {
        question: `How do I receive ${brandName} email updates?`,
        content: (
          <p className="text-sm text-muted-foreground">
            Enter your email address at the bottom of our homepage to get new arrivals, trends, and
            exclusive promotions. You can update preferences in your account.
          </p>
        ),
      },
      {
        question: "How do I place an order on your website?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Here is how:</div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Choose a category or brand or search for a specific style.</li>
              <li>
                Select your item and click <span className="font-semibold">Add To Bag</span>. When
                everything is in the bag, start checkout.
              </li>
              <li>Sign in or continue as a guest.</li>
            </ol>
            <p>
              Add your address, payment method, and delivery details to place the order. We will
              confirm it and prepare it with updates along the way.
            </p>
          </div>
        ),
      },
      {
        question: "Can I place an order over the phone?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes. Our global Customer Service advisors can place orders for you.
          </p>
        ),
      },
      {
        question: `Can I cancel my ${brandName} order or make changes to it?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              You may be able to cancel items before we prepare the order. Go to{" "}
              <Link href="/account" className="underline">
                Orders &amp; Returns
              </Link>
              , or if you checked out as a guest,{" "}
              <a href="/account/trackingorder" className="underline">
                enter your guest order details
              </a>
              .
            </p>
            <p>
              You cannot add items to an existing order. Place a new order for anything else. For
              more details,{" "}
              <a href="/pages/shipping-policy" className="underline">
                view the Orders &amp; Deliveries page
              </a>
              .
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: `${brandName} pricing and payment`,
    items: [
      {
        question: `Why is ${brandName} pricing different?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              You are shopping items from luxury brands and partner boutiques worldwide. Prices are
              set by each brand or boutique, so the same item can vary by origin and your
              destination. Adding to bag or wishlist does not reserve a price.
            </p>
            <p>
              We will always show the best price available to your destination at checkout. Select
              your delivery destination to see accurate prices.
            </p>
          </div>
        ),
      },
      {
        question: "Which currencies can I shop in?",
        content: (
          <p className="text-sm text-muted-foreground">
            The currency depends on your delivery destination and is shown at checkout. If your
            local currency is unavailable, you will be charged in USD using a competitive exchange
            rate.
          </p>
        ),
      },
      {
        question: "When will my card be charged?",
        content: (
          <p className="text-sm text-muted-foreground">
            For debit card, cryptocurrency, or PayPal payments, {brandName} charges when you place the
            order.
          </p>
        ),
      },
      {
        question: "Which payment methods do you accept?",
        content: (
          <div className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Visa, MasterCard, Maestro, American Express, Discover, Diners, JCB</li>
              <li>JDpay (China Mainland only), PayPal, Tamara, Apple Pay, Afterpay (US and AU)</li>
              <li>
                Alipay (US, Canada, China Mainland, Hong Kong SAR, Macau SAR), HB Pay (China
                Mainland and Hong Kong), Klarna (selected countries), WeChat (China Mainland, Hong
                Kong SAR, Macau SAR), UnionPay, iDEAL (Netherlands), Boleto (Brazil)
              </li>
              <li>
                Cryptocurrency (
                <a
                  href="/pages/cryptocurrency-payment"
                  className="underline text-foreground"
                >
                  see the supported list
                </a>
                )
              </li>
            </ul>
            <p>
              We accept Klarna, Afterpay, and Tamara in selected countries. Credit card instalments
              are available only in Brazil and Mexico.
            </p>
            <p>
              Maximum spends: France (1500 EUR), Italy (2000 EUR), United Kingdom (1500 GBP), United
              States (1500 USD), Germany/Austria/Switzerland/Belgium (5000 EUR or CHF), Sweden
              (16500 SEK), Netherlands (1500 EUR). CA resident loans are subject to the California
              Financing Law license.
            </p>
            <p>Security checks are performed on all payments.</p>
          </div>
        ),
      },
      {
        question: "Will my personal details stay safe?",
        content: (
            <p className="text-sm text-muted-foreground">
              Yes. We keep your personal data private and confidential and only share it with your
              consent or when legally permitted.{" "}
              <a href="/pages/privacy-policy" className="underline">
              View the {brandName} Privacy Policy
              </a>
              .
            </p>
        ),
      },
    ],
  },
  {
    title: "Product availability, authenticity and pre-owned items",
    items: [
      {
        question: "Are you going to have my size again?",
        content: (
          <p className="text-sm text-muted-foreground">
            On the product page, select your size and choose{" "}
            <span className="font-semibold text-foreground">size missing</span>, then enter your
            email address and size to get notified when it is back in stock.
          </p>
        ),
      },
      {
        question: "Can I reserve an item to buy later?",
        content: (
          <p className="text-sm text-muted-foreground">
            No. To keep things fair on limited items, we do not offer reservations.
          </p>
        ),
      },
      {
        question: `Are ${brandName} items guaranteed authentic?`,
        content: (
          <p className="text-sm text-muted-foreground">
            Yes. The assortment is curated by luxury brands and boutiques worldwide and all items
            are guaranteed authentic.
          </p>
        ),
      },
      {
        question: "How will my order be packaged?",
        content: (
          <p className="text-sm text-muted-foreground">
            Orders are prepared in protective {brandName} packaging. If the designer provides branded{" "}
            {packagingItems}, they will be included.
          </p>
        ),
      },
      {
        question: "Do your pre-owned items come in different conditions?",
        content: (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Yes. Pre-owned items are graded:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Unworn with tags:</span> previously
                owned, never used, original condition with tags.
              </li>
              <li>
                <span className="font-semibold text-foreground">Unworn:</span> previously owned,
                never used, original condition without tags.
              </li>
              <li>
                <span className="font-semibold text-foreground">Excellent:</span> previously worn,
                like new with almost no signs of use.
              </li>
              <li>
                <span className="font-semibold text-foreground">Good:</span> previously worn with
                signs of use such as fading, patina, or scratches.
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    title: "Delivery, duties and taxes",
    items: [
      {
        question: "How much will I be charged for delivery?",
        content: (
          <p className="text-sm text-muted-foreground">
            Delivery cost depends on size, weight, and destination. Orders above the One Delivery
            Fee threshold can ship multiple pieces from multiple locations for a single fee shown at
            checkout.
          </p>
        ),
      },
      {
        question: "When will I receive my item and how can I track delivery?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Once confirmed, orders are sent within 2 business days. Delivery takes 2-7 business
              days depending on location and method. Items from multiple brands arrive separately.
            </p>
            <p>
              We email tracking and an estimated delivery date for each shipment. You can also track
              in <Link href="/account" className="underline">Orders &amp; Returns</Link> or, for
              guest checkout,{" "}
              <a href="/account/trackingorder" className="underline">
                track your guest order
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        question: "Will I need to pay duties and taxes?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {brandName} ships Delivery Duties Paid (DDP) to: European Union (excluding Canary
              Islands), United Kingdom, USA, Canada, China Mainland, Australia, New Zealand, Puerto
              Rico, Switzerland, Singapore, Republic of Korea, Kuwait, Mexico, Qatar, India, Norway,
              Saudi Arabia, Taiwan Region, Thailand, U.A.E, Japan, Brazil, Isle of Man, San Marino,
              Colombia, Chile, Argentina, Egypt, Lebanon, Hong Kong SAR, and Bahrain. Duties and
              taxes are included in the final price and no extra costs are due on delivery.
            </p>
            <p>
              For Delivery At Place (DAP) destinations, prices exclude import duties and sales taxes
              which you pay to the courier to clear customs.
            </p>
            <p>
              US customers: {brandName} does not collect sales or use tax in all states. You may need to
              file a year-end return for taxable purchases that were not taxed. Check with your tax
              authority or{" "}
              <a href="/pages/shipping-policy" className="underline">
                view Duties and Taxes information
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        question: "Why can't certain items be delivered to me?",
        content: (
          <p className="text-sm text-muted-foreground">
            Brands control where their items are distributed, so some styles are unavailable in all
            regions. Certain materials or finishes may also be restricted by customs.
            If you have questions,{" "}
            <a href="/pages/contact-us" className="underline">
              contact Customer Service
            </a>
            .
          </p>
        ),
      },
      {
        question: "I didn't receive my invoice with my order. Where can I find it?",
        content: (
          <p className="text-sm text-muted-foreground">
            Invoices have been removed to reduce waste. Sign in to download a digital invoice or, if
            you checked out as a guest,{" "}
            <a href="/account/trackingorder" className="underline">
              enter your guest order details
            </a>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: "Returns and refunds",
    items: [
      {
        question: `What is the ${brandName} returns policy?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Returns are accepted within 30 days of delivery, excluding delivery costs. Free
              Collection is available.
            </p>
            <p>
              Cryptocurrency refunds are processed by{" "}
              <a href="https://triple-a.io/" className="underline">
                TripleA
              </a>{" "}
              in the original cryptocurrency at the current exchange rate once the return is
              accepted.
            </p>
            <p>
              Start a return in <Link href="/account" className="underline">Orders &amp; Returns</Link>{" "}
              or, for guests,{" "}
              <a href="/account/trackingorder" className="underline">
                enter your guest order details
              </a>
              . Book collection within 7 days of delivery to stay within the window. Items must be
              unworn, undamaged, unused, with tags and any designer {packagingItems} included. Missing
              or damaged items may void the refund.{" "}
              <a href="/pages/return-policy" className="underline">
                Read the full Returns Policy
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        question: "How do I book a free collection or return in store?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Request a return in <Link href="/account" className="underline">Orders &amp; Returns</Link>{" "}
              or, for guests,{" "}
              <a href="/account/trackingorder" className="underline">
                enter your guest order details
              </a>
              .
            </p>
            <p>
              Choose courier collection, pick a date, and we will email next steps. You can reschedule
              in Orders &amp; Returns. For drop-off, choose the option, prepare your package, and
              take it to your selected location with the confirmation email.
            </p>
          </div>
        ),
      },
      {
        question: "I want to return my order but I need my invoice for customs clearance. Will it still be included?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes. Invoices for customs clearance are still included. When preparing the return, place
            the Return Note outside the {brandName} package.
          </p>
        ),
      },
      {
        question: "How do I return my item?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Here is what you need to do:</div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Go to <Link href="/account" className="underline">Orders &amp; Returns</Link> or, for
                guests,{" "}
                <a href="/account/trackingorder" className="underline">
                  enter your guest order details
                </a>
                .
              </li>
              <li>Find the order, click Return Item(s), and select each item with a return reason.</li>
            </ol>
            <p className="font-medium text-foreground">
              There are two ways to return items. Depending on your location, one will always be available.
            </p>
            <div className="space-y-1">
              <div className="font-semibold text-foreground">1. Book a free returns collection</div>
              <p>Select your collection address, number of packages, date, and time, then book.</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-foreground">2. Return for free at a drop-off point</div>
              <p>
                Select the in-store or drop-off option and take the return to your chosen partner boutique
                or courier drop-off point.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-foreground">Prepare your return</div>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  Place the item and any brand {packagingItems} inside the {brandName} packaging.
                </li>
                <li>Attach the Return Label to the outside of the package.</li>
                <li>
                  If you received a Return Note, attach it to the outside of the package. For multiple items
                  shipped separately, re-use the packaging setup with new Return Labels.
                </li>
              </ol>
              <p>
                Ask the courier to scan the label at pickup or drop-off so you can track the return. Items
                from different boutiques should be packaged separately with the correct
                Return Label on each parcel.
              </p>
            </div>
          </div>
        ),
      },
      {
        question: "How do I package my item for return?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Follow these steps:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Place unwanted items with any brand {packagingItems} inside the reusable {brandName} packaging.
              </li>
              <li>
                Attach the Return Label and Return Note to the outside. Do not attach labels to designer
                packaging.
              </li>
            </ol>
            <p>
              If returning to multiple locations, pack items separately and attach the corresponding Return
              Label to each.{" "}
              <a href="/pages/return-policy" className="underline">
                Learn more about preparing your package
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        question: `Does my order need to be returned in the ${brandName} package it arrived in?`,
        content: (
          <p className="text-sm text-muted-foreground">
            We recommend using the reusable {brandName} package, but you can use another sturdy box if needed.
            Items must be returned undamaged, unused, with all tags and original packaging or branded boxes.
          </p>
        ),
      },
      {
        question: "Will the courier collect multiple packages?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes, the courier may collect multiple packages. If returning items to multiple boutiques, request
            a separate collection for each package in your account or{" "}
            <a href="/account/trackingorder" className="underline">
              guest order lookup
            </a>
            .
          </p>
        ),
      },
      {
        question: "When will I receive my refund?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Track returns using the Return Label tracking number. Once received, returns can take up to 6
              calendar days to process. We email confirmation when accepted.
            </p>
            <p>
              Refunds go to your original payment method and can take up to 14 days to appear depending on your
              provider.
            </p>
          </div>
        ),
      },
      {
        question: "Will delivery costs and duties be refunded on return?",
        content: (
          <p className="text-sm text-muted-foreground">
            The original delivery cost is not refunded. For DAP destinations, taxes and duties are not
            refundable through {brandName} (check with customs). For DDP destinations, taxes and duties are
            refundable through {brandName}.
          </p>
        ),
      },
      {
        question: "Can I return my made-to-order item?",
        content: (
          <p className="text-sm text-muted-foreground">
            No. Customised items are created to your specification and are not eligible for return.
          </p>
        ),
      },
    ],
  },
  {
    title: "Pre-order",
    items: [
      {
        question: "What does pre-order mean?",
        content: (
          <p className="text-sm text-muted-foreground">
            You can buy next season's pieces before release and receive them once available.
          </p>
        ),
      },
      {
        question: "When will my pre-order item arrive?",
        content: (
          <p className="text-sm text-muted-foreground">
            We email you with an estimated delivery date as soon as the item is released and ready to
            send.
          </p>
        ),
      },
      {
        question: "When do I have to pay?",
        content: (
          <p className="text-sm text-muted-foreground">Pre-order items require full payment at checkout.</p>
        ),
      },
      {
        question: "Can I cancel a pre-order?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Some brands and boutiques allow cancellation before we prepare your order.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Go to <Link href="/account" className="underline">Orders &amp; Returns</Link> or, for guests,{" "}
                <a href="/account/trackingorder" className="underline">
                  enter your guest order number and email
                </a>
                .
              </li>
              <li>Select the items to cancel and provide a reason.</li>
              <li>We will email confirmation of the cancelled order.</li>
            </ol>
            <p>
              If the order has been prepared, it cannot be cancelled, but you can use the Free Returns service.
            </p>
          </div>
        ),
      },
      {
        question: "Can I change my delivery address?",
        content: (
          <p className="text-sm text-muted-foreground">
            Check Order Details in your {brandName} account. You may not be able to change it if the item has been
            sent.
          </p>
        ),
      },
      {
        question: "Are pre-order items refundable?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes, if they meet the conditions in the{" "}
            <a href="/pages/return-policy" className="underline">
              Returns Policy
            </a>
            .
          </p>
        ),
      },
      {
        question: "Will pre-order items be delivered with my other orders?",
        content: (
          <p className="text-sm text-muted-foreground">
            No. Pre-order items ship separately based on their expected release date.
          </p>
        ),
      },
      {
        question: "Is there a limit on purchasing pre-order items?",
        content: (
          <p className="text-sm text-muted-foreground">
            Some pre-order items have limits so everyone has a chance to purchase.
          </p>
        ),
      },
    ],
  },
  {
    title: "Size and fit",
    items: [
      {
        question: "Where can I find size conversion charts?",
        content: (
          <p className="text-sm text-muted-foreground">
            On the product page, select <span className="font-semibold text-foreground">Size Guide</span> above
            the size menu to view conversions.
          </p>
        ),
      },
      {
        question: "How can I get a better understanding on how a piece will fit?",
        content: (
          <p className="text-sm text-muted-foreground">
            On the product page, open the <span className="font-semibold text-foreground">Size &amp; Fit</span>{" "}
            tab for size, fit, cut, and model measurements. Material and care instructions are in{" "}
            <span className="font-semibold text-foreground">The Details</span> tab.
          </p>
        ),
      },
      {
        question: "What's the difference between size, fit, cut and material?",
        content: (
          <p className="text-sm text-muted-foreground">
            Size is the designer label size. Fit describes how it wears, cut is the silhouette, and material is
            what the item is made from. Check The Details and Size &amp; Fit tabs on the product page.
          </p>
        ),
      },
      {
        question: "Why do designer sizes vary?",
        content: (
          <p className="text-sm text-muted-foreground">
            International sizing differs and designers fit differently. That is why we provide item-specific
            guidance.
          </p>
        ),
      },
      {
        question: "What if my item doesn't fit?",
        content: (
          <p className="text-sm text-muted-foreground">
            Use free returns if it does not fit. To order a different size you can place a new order or{" "}
            <a href="/pages/contact-us" className="underline">
              contact Customer Service
            </a>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: "Promotions",
    items: [
      {
        question: "How do I find out about the latest promotions?",
        content: (
          <p className="text-sm text-muted-foreground">
            <a href="#newsletter" className="underline">
              Sign up to emails
            </a>{" "}
            for promotions, new arrivals, and early sale access.
          </p>
        ),
      },
      {
        question: "What different types of promotions are there?",
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              See all promotions on the{" "}
              <a href="/pages/payment-and-pricing#promotions" className="underline">
                Promotion Terms &amp; Conditions page
              </a>
              .
            </p>
            <p>If you are an Access member, check your Access dashboard for promotional rewards.</p>
          </div>
        ),
      },
      {
        question: "How do I apply a promo code?",
        content: (
          <p className="text-sm text-muted-foreground">
            Add eligible items to your bag. Some promo codes apply automatically; others can be entered at
            checkout. If you need help,{" "}
            <a href="/pages/contact-us" className="underline">
              contact Customer Service
            </a>
            .
          </p>
        ),
      },
      {
        question: "Are there any brands excluded from promotional discounts?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes. Promotions apply only to selected brands and items. Items labelled for promotions may be
            eligible. See the{" "}
            <a href="/pages/payment-and-pricing#promotions" className="underline">
              Promotion Terms &amp; Conditions
            </a>{" "}
            for details.
          </p>
        ),
      },
      {
        question: "How do I know if my item is eligible for a promotion?",
        content: (
          <p className="text-sm text-muted-foreground">
            Items labelled or shown on the promotions page may be eligible. If a minimum spend applies, it must
            be met in a single transaction. Check the Promotion Terms &amp; Conditions for each campaign.
          </p>
        ),
      },
      {
        question: "The item I want is part of the promotion but my size isn't discounted. Why does this happen?",
        content: (
          <p className="text-sm text-muted-foreground">
            {brandName} sources from global brands and boutiques. If your size comes from a boutique that is not
            participating in the promotion, it will not be discounted.
          </p>
        ),
      },
      {
        question: "My promo code has expired. Can I request another one?",
        content: (
          <p className="text-sm text-muted-foreground">
            Promotional discounts cannot be reactivated and are non-transferable with no cash alternative.
          </p>
        ),
      },
      {
        question: "Can I combine two promotions simultaneously?",
        content: (
          <p className="text-sm text-muted-foreground">
            Some promotions cannot be combined. If two offers are available, choose which to apply. If a
            campaign is auto-applied at checkout, adding another promo code will overwrite it.
          </p>
        ),
      },
    ],
  },
  {
    title: 'European Union Digital Services Act ("DSA")',
    items: [
      {
        question: `Who is the ${brandName} Legal Representative for the purposes of the DSA?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {brandName} Portugal Unipessoal, Lda is the appointed legal representative under Article 13 of the
              EU DSA. Communications about the DSA can be sent:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Email: dsa@xa.com</li>
              <li>
                Post: {brandName} at Rua da Lionesa, no 446, Edificio G12 4465-671, Leca do Balio, Porto – Portugal
              </li>
              <li>Phone: +351 220430530</li>
            </ul>
            <p>
              Please indicate that your communication relates to the DSA and provide an English translation if
              possible. For urgent queries, email is fastest.
            </p>
          </div>
        ),
      },
      {
        question: `What is the average number of active recipients of services on the ${brandName} Marketplace in the EEA?`,
        content: (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Over the past 6 months, the average number of active recipients in the EEA is:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Website: Below 15 million</li>
              <li>App: Below 5 million</li>
            </ul>
          </div>
        ),
      },
      {
        question: "Compliance with all laws",
        content: (
          <p className="text-sm text-muted-foreground">
            {brandName} requires marketplace sellers to offer products that comply with applicable EU product
            safety and compliance rules.
          </p>
        ),
      },
      {
        question: "Tax Strategy",
        content: (
          <p className="text-sm text-muted-foreground">
            You can consult the {brandName} Tax Strategy{" "}
            <a
              href="/pages/terms-of-service"
              className="underline"
            >
              here
            </a>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: "Fashion Concierge",
    items: [
      {
        question: "What is Fashion Concierge On Demand?",
        content: (
          <p className="text-sm text-muted-foreground">
            Fashion Concierge On Demand is an exclusive service for premium {brandName} customers to source rare,
            unique, or sold-out pieces. Access it through the Membership section of your profile.
          </p>
        ),
      },
      {
        question: "How does Fashion Concierge work?",
        content: (
          <p className="text-sm text-muted-foreground">
            Dedicated teams in the US, UK, Hong Kong, France, and the Middle East source the items you want.
            Timing and pricing vary by location. Communication happens via email after your request.
          </p>
        ),
      },
      {
        question: "How is pricing determined?",
        content: (
          <p className="text-sm text-muted-foreground">
            Pricing depends on the supplier's location. Import taxes and partnerships with luxury brands may
            affect cost, and it can exceed retail in some cases.
          </p>
        ),
      },
      {
        question: "What is the delivery time for Fashion Concierge orders?",
        content: (
          <p className="text-sm text-muted-foreground">
            All items are inspected before delivery, which impacts processing time. Delivery depends on both
            item and customer location, and may take longer than usual.
          </p>
        ),
      },
      {
        question: "What is the returns policy for Fashion Concierge orders?",
        content: (
          <p className="text-sm text-muted-foreground">
            Returns depend on brand, supplier, and location. You are notified by email about final sale status.
            Read and confirm agreement; without your response, Fashion Concierge will not proceed.
          </p>
        ),
      },
      {
        question: "Can I place pre-orders through Fashion Concierge?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes. Pre-orders require full payment upfront. You will receive details on ETA, return policy, and
            price before confirming.
          </p>
        ),
      },
      {
        question: "Is there a minimum order value for Fashion Concierge?",
        content: (
          <p className="text-sm text-muted-foreground">
            Yes. The service focuses on rare pieces with a minimum order value of 1,000 USD. Requests below that
            threshold should use the Fashion Concierge edit for curated items.
          </p>
        ),
      },
      {
        question: "Are there restrictions on hazardous or regulated materials?",
        content: (
          <p className="text-sm text-muted-foreground">
            Some materials require special export documentation or carrier approval that can add time to
            processing. Customs clearance may involve risk or delays, but we handle the process.
          </p>
        ),
      },
      {
        question: "What about items made from regulated materials?",
        content: (
          <p className="text-sm text-muted-foreground">
            These items may require additional documentation or approvals before shipment. We will confirm
            timelines during the order process.
          </p>
        ),
      },
      {
        question: "Can items be held for purchase at a later time?",
        content: (
          <p className="text-sm text-muted-foreground">
            No. Items cannot be held; availability is not guaranteed without purchase.
          </p>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  const toSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";

  return (
    <main className="sf-content">
      <Section padding="wide" className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Help &amp; support</p>
        <h1 className="text-3xl font-semibold">FAQs</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          All the essentials for shopping, delivery, returns, payments, sizing, promotions, and more for{" "}
          {productDescriptor}. Browse by topic or expand a question to see the details exactly as on {brandName}.
        </p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 4 }} gap={10}>
          <aside className="md:col-span-1">
            <div className="sticky top-28 space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Browse topics</div>
              <div className="flex flex-col gap-2">
                {faqSections.map((section) => {
                  const id = toSlug(section.title);
                  return (
                    <a
                      key={section.title}
                      href={`#${id}`}
                      className="rounded border px-3 py-2 text-sm hover:border-foreground hover:text-foreground"
                    >
                      {section.title}
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="md:col-span-3 space-y-12">
            {faqSections.map((section) => {
              const id = toSlug(section.title);
              return (
                <div key={section.title} className="space-y-4 scroll-mt-28" id={id}>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  <Accordion
                    items={section.items.map((item) => ({
                      title: item.question,
                      content: item.content,
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </Grid>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 2 }} gap={6}>
          <div id="newsletter" className="rounded-lg border p-5 space-y-3">
            <div className="text-lg font-semibold">Tell us what you think</div>
            <p className="text-sm text-muted-foreground">
              Was this content helpful?
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">Yes</Button>
              <Button variant="outline">Not really</Button>
            </div>
          </div>
          <div className="rounded-lg border p-5 space-y-3">
            <div className="text-lg font-semibold">Never miss a thing</div>
            <p className="text-sm text-muted-foreground">
              Sign up for promotions, new arrivals, stock updates, and more.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <Button className="sm:w-auto">Sign up</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to receive marketing emails and acknowledge the{" "}
              <a href="/pages/privacy-policy" className="underline">
                Privacy Policy
              </a>
              . Unsubscribe anytime.
            </p>
          </div>
        </Grid>
      </Section>
    </main>
  );
}
