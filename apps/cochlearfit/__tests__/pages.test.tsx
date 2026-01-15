import "~test/resetNextMocks";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import * as navigation from "next/navigation";
import RootLayout, { metadata as rootMetadata } from "@/app/layout";
import RootRedirect from "@/app/page";
import RootNotFound from "@/app/not-found";
import LocaleLayout, { generateStaticParams as generateLocaleParams } from "@/app/[lang]/layout";
import LocaleNotFound from "@/app/[lang]/not-found";
import HomePage, { generateMetadata as generateHomeMetadata } from "@/app/[lang]/page";
import ShopPage, { generateMetadata as generateShopMetadata } from "@/app/[lang]/shop/page";
import AboutPage, { generateMetadata as generateAboutMetadata } from "@/app/[lang]/about/page";
import FaqPage, { generateMetadata as generateFaqMetadata } from "@/app/[lang]/faq/page";
import ContactPage, { generateMetadata as generateContactMetadata } from "@/app/[lang]/contact/page";
import SizingPage, { generateMetadata as generateSizingMetadata } from "@/app/[lang]/sizing/page";
import CartPage, { generateMetadata as generateCartMetadata } from "@/app/[lang]/cart/page";
import CheckoutPage, { generateMetadata as generateCheckoutMetadata } from "@/app/[lang]/checkout/page";
import ThankYouPage, { generateMetadata as generateThankYouMetadata } from "@/app/[lang]/thank-you/page";
import ShippingPage, { generateMetadata as generateShippingMetadata } from "@/app/[lang]/policies/shipping/page";
import ReturnsPage, { generateMetadata as generateReturnsMetadata } from "@/app/[lang]/policies/returns/page";
import PrivacyPage, { generateMetadata as generatePrivacyMetadata } from "@/app/[lang]/policies/privacy/page";
import TermsPage, { generateMetadata as generateTermsMetadata } from "@/app/[lang]/policies/terms/page";
import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams as generateProductParams,
} from "@/app/[lang]/product/[slug]/page";
import enMessages from "../i18n/en.json";
import { renderWithProviders } from "./testUtils";

jest.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "font-display" }),
  Space_Grotesk: () => ({ variable: "font-sans" }),
}));

const messages = enMessages as Record<string, string>;

const renderLocalePage = async (
  Page: (props: { params: Promise<{ lang?: string | string[] }> }) => Promise<React.ReactElement>
    | React.ReactElement,
  options?: Parameters<typeof renderWithProviders>[1]
) => {
  const element = await Page({ params: Promise.resolve({ lang: "en" }) });
  return renderWithProviders(element, options);
};

const getLocaleMetadata = async (
  generateMetadata: (props: {
    params: Promise<{ lang?: string | string[] }>;
  }) => Promise<{ title?: string }>
) => {
  return generateMetadata({ params: Promise.resolve({ lang: "en" }) });
};

describe("root pages", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("redirects root to /en", async () => {
    const replace = jest.fn();
    jest.spyOn(navigation, "useRouter").mockReturnValue({
      replace,
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });

    render(<RootRedirect />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/en");
    });
  });

  it("renders root layout and metadata", () => {
    const element = RootLayout({ children: <div>Root child</div> });
    expect(element.type).toBe("html");
    const body = element.props.children;
    const bodyChildren = React.Children.toArray(body.props.children);
    const hasChild = bodyChildren.some(
      (child) => React.isValidElement(child) && child.props.children === "Root child"
    );
    expect(hasChild).toBe(true);
    expect(rootMetadata.title).toBeTruthy();
  });

  it("renders root not found content", async () => {
    renderWithProviders(await RootNotFound());
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en"
    );
  });
});

describe("locale layout", () => {
  it("generates locale params", () => {
    expect(generateLocaleParams()).toEqual([
      { lang: "en" },
      { lang: "it" },
      { lang: "es" },
      { lang: "de" },
    ]);
  });

  it("renders locale layout children", async () => {
    const element = await LocaleLayout({
      children: <div>Locale child</div>,
      params: Promise.resolve({ lang: "en" }),
    });
    render(element);
    expect(screen.getByText("Locale child")).toBeInTheDocument();
  });

  it("renders locale not found content", async () => {
    renderWithProviders(
      await LocaleNotFound({ params: Promise.resolve({ lang: "en" }) })
    );
    expect(screen.getByText(messages["notFound.title"])).toBeInTheDocument();
  });
});

describe("localized pages", () => {
  it("renders home page and metadata", async () => {
    await renderLocalePage(HomePage);
    expect(screen.getByText(messages["home.hero.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateHomeMetadata);
    expect(metadata.title).toBe(messages["home.meta.title"]);
  });

  it("renders shop page and metadata", async () => {
    await renderLocalePage(ShopPage);
    expect(screen.getByText(messages["shop.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateShopMetadata);
    expect(metadata.title).toBe(messages["shop.meta.title"]);
  });

  it("renders about page and metadata", async () => {
    await renderLocalePage(AboutPage);
    expect(screen.getByText(messages["about.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateAboutMetadata);
    expect(metadata.title).toBe(messages["about.meta.title"]);
  });

  it("renders faq page and metadata", async () => {
    await renderLocalePage(FaqPage);
    expect(screen.getByText(messages["faq.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateFaqMetadata);
    expect(metadata.title).toBe(messages["faq.meta.title"]);
  });

  it("renders contact page and metadata", async () => {
    await renderLocalePage(ContactPage);
    expect(screen.getByText(messages["contact.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateContactMetadata);
    expect(metadata.title).toBe(messages["contact.meta.title"]);
  });

  it("renders sizing page and metadata", async () => {
    await renderLocalePage(SizingPage);
    expect(screen.getByText(messages["sizing.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateSizingMetadata);
    expect(metadata.title).toBe(messages["sizing.meta.title"]);
  });

  it("renders cart page and metadata", async () => {
    await renderLocalePage(CartPage, { withCart: true });
    expect(screen.getByText(messages["cart.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateCartMetadata);
    expect(metadata.title).toBe(messages["cart.meta.title"]);
  });

  it("renders checkout page and metadata", async () => {
    await renderLocalePage(CheckoutPage, { withCart: true });
    expect(screen.getByText(messages["checkout.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateCheckoutMetadata);
    expect(metadata.title).toBe(messages["checkout.meta.title"]);
  });

  it("renders thank you page and metadata", async () => {
    await renderLocalePage(ThankYouPage);
    expect(screen.getByText(messages["thankyou.title"])).toBeInTheDocument();
    const metadata = await getLocaleMetadata(generateThankYouMetadata);
    expect(metadata.title).toBe(messages["thankyou.meta.title"]);
  });

  it("renders shipping policy page and metadata", async () => {
    await renderLocalePage(ShippingPage);
    expect(screen.getByText(messages["policy.shipping.title"])).toBeInTheDocument();
    expect((await getLocaleMetadata(generateShippingMetadata)).title).toBe(
      messages["policy.shipping.meta.title"]
    );
  });

  it("renders returns policy page and metadata", async () => {
    await renderLocalePage(ReturnsPage);
    expect(screen.getByText(messages["policy.returns.title"])).toBeInTheDocument();
    expect((await getLocaleMetadata(generateReturnsMetadata)).title).toBe(
      messages["policy.returns.meta.title"]
    );
  });

  it("renders privacy policy page and metadata", async () => {
    await renderLocalePage(PrivacyPage);
    expect(screen.getByText(messages["policy.privacy.title"])).toBeInTheDocument();
    expect((await getLocaleMetadata(generatePrivacyMetadata)).title).toBe(
      messages["policy.privacy.meta.title"]
    );
  });

  it("renders terms policy page and metadata", async () => {
    await renderLocalePage(TermsPage);
    expect(screen.getByText(messages["policy.terms.title"])).toBeInTheDocument();
    expect((await getLocaleMetadata(generateTermsMetadata)).title).toBe(
      messages["policy.terms.meta.title"]
    );
  });
});

describe("product pages", () => {
  it("generates product params and metadata", async () => {
    const params = await generateProductParams();
    expect(params).toEqual(
      expect.arrayContaining([
        { lang: "en", slug: "classic" },
        { lang: "it", slug: "sport" },
      ])
    );

    const metadata = await generateProductMetadata({
      params: Promise.resolve({ lang: "en", slug: "classic" }),
    });
    expect(metadata.title).toBe(messages["product.meta.title"].replace("{name}", "Classic Secure"));

    const fallback = await generateProductMetadata({
      params: Promise.resolve({ lang: "en", slug: "missing" }),
    });
    expect(fallback.title).toBe(messages["product.meta.fallbackTitle"]);
  });

  it("renders product page for valid slug", async () => {
    const page = await ProductPage({
      params: Promise.resolve({ lang: "en", slug: "classic" }),
    });
    renderWithProviders(page, {
      withCart: true,
    });
    expect(screen.getByText("Classic Secure")).toBeInTheDocument();
  });

  it("throws notFound for invalid product slugs", async () => {
    await expect(
      ProductPage({ params: Promise.resolve({ lang: "en", slug: "missing" }) })
    ).rejects.toThrow();
  });
});
