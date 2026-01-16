import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";

import { CartProvider } from "../../contexts/XaCartContext";
import { WishlistProvider } from "../../contexts/XaWishlistContext";
import { CurrencyProvider } from "@platform-core/contexts/CurrencyContext";
import { XaBuyBox } from "../XaBuyBox.client";
import { XaDepartmentLanding } from "../XaDepartmentLanding";
import { XaDepartmentListing } from "../XaDepartmentListing";
import { XaFadeImage } from "../XaFadeImage";
import { XaFaqOverlayContent } from "../XaFaqOverlayContent.client";
import { XaFilterChip } from "../XaFilterChip";
import { XaFiltersDrawer } from "../XaFiltersDrawer.client";
import { XaImageGallery } from "../XaImageGallery.client";
import { XaMegaMenu } from "../XaMegaMenu";
import { XaProductCard } from "../XaProductCard";
import { XaProductListing as XaProductListingClient } from "../XaProductListing.client";
import { XaProductListing } from "../XaProductListing";
import { XaServiceWorkerRegistration } from "../XaServiceWorkerRegistration.client";
import { XaShell } from "../XaShell";
import { XaSizeGuideDialog } from "../XaSizeGuideDialog.client";
import { XaSupportDock } from "../XaSupportDock.client";
import type { XaProduct } from "../../lib/demoData";
import { getFilterConfigs, collectFacetValues } from "../../lib/xaFilters";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, ...props }: { fill?: boolean } & Record<string, unknown>) => (
    <img alt="" {...props} />
  ),
}));

jest.mock("next/dynamic", () => {
  return (loader: unknown, options?: { loading?: React.ComponentType }) => {
    const Loading = options?.loading;
    return Loading ? (props: Record<string, unknown>) => <Loading {...props} /> : () => null;
  };
});

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@platform-core/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "base", setTheme: jest.fn() }),
}));

const makeProduct = (overrides: Partial<XaProduct>): XaProduct => {
  const { taxonomy, ...rest } = overrides;
  return {
    id: "sku-1",
    slug: "sku-1",
    title: "Test Product",
    price: 150,
    deposit: 0,
    stock: 3,
    forSale: true,
    forRental: false,
    media: [
      { url: "https://example.com/img-1.jpg", type: "image", altText: "Image" },
      { url: "https://example.com/img-2.jpg", type: "image", altText: "Image 2" },
    ],
    sizes: ["S", "M"],
    description: "desc",
    brand: "acme",
    collection: "core",
    createdAt: "2024-01-01T00:00:00Z",
    popularity: 1,
    taxonomy: {
      department: "women",
      category: "clothing",
      subcategory: "tops",
      color: ["black", "ivory"],
      material: ["cotton"],
      ...(taxonomy ?? {}),
    },
    ...rest,
  };
};

const Providers = ({ children }: { children: React.ReactNode }) => (
  <CurrencyProvider>
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  </CurrencyProvider>
);

describe("XA components", () => {
  it("renders XaFadeImage", () => {
    render(
      <XaFadeImage
        src="https://example.com/img.jpg"
        alt="Alt"
        width={320}
        height={240}
      />,
    );
  });

  it("renders XaDepartmentListing", () => {
    render(
      <Providers>
        <XaDepartmentListing department="women" category="clothing" />
      </Providers>,
    );
  });

  it("renders XaDepartmentLanding", () => {
    render(
      <Providers>
        <XaDepartmentLanding department="women" />
      </Providers>,
    );
  });

  it("renders XaProductCard", () => {
    render(
      <Providers>
        <XaProductCard product={makeProduct({})} />
      </Providers>,
    );
  });

  it("renders XaBuyBox", () => {
    render(
      <Providers>
        <XaBuyBox product={makeProduct({})} />
      </Providers>,
    );
  });

  it("renders XaImageGallery", () => {
    render(
      <XaImageGallery
        title="Gallery"
        media={[
          { url: "https://example.com/img.jpg", type: "image", altText: "Alt" },
        ]}
      />,
    );
  });

  it("renders XaFaqOverlayContent", () => {
    render(<XaFaqOverlayContent />);
  });

  it("renders XaFilterChip", () => {
    render(<XaFilterChip label="Label" onRemove={() => {}} />);
  });

  it("renders XaFiltersDrawer", () => {
    const products = [makeProduct({})];
    const configs = getFilterConfigs("clothing");
    const facets = collectFacetValues(products, configs);
    const draftValues = Object.fromEntries(
      configs.map((config) => [config.key, new Set<string>()]),
    ) as Record<string, Set<string>>;

    render(
      <XaFiltersDrawer
        open
        onOpenChange={() => {}}
        filterConfigs={configs}
        facetValues={facets}
        draftValues={draftValues}
        draftInStock={false}
        draftSale={false}
        draftNewIn={false}
        draftMin=""
        draftMax=""
        onToggleValue={() => {}}
        onChangeInStock={() => {}}
        onChangeSale={() => {}}
        onChangeNewIn={() => {}}
        onChangeMin={() => {}}
        onChangeMax={() => {}}
        onClear={() => {}}
        onApply={() => {}}
      />,
    );
  });

  it("renders XaProductListing client", () => {
    render(
      <Providers>
        <XaProductListingClient
          title="Listing"
          breadcrumbs={[{ label: "Home", href: "/" }]}
          products={[makeProduct({})]}
          category="clothing"
        />
      </Providers>,
    );
  });

  it("renders XaProductListing legacy", () => {
    render(
      <XaProductListing
        title="Listing"
        breadcrumbs={[{ label: "Home", href: "/" }]}
        products={[makeProduct({})]}
      />,
    );
  });

  it("renders XaMegaMenu", () => {
    render(<XaMegaMenu label="Women" department="women" />);
  });

  it("renders XaShell", () => {
    window.matchMedia = () =>
      ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as MediaQueryList;

    render(
      <Providers>
        <XaShell>
          <div>Content</div>
        </XaShell>
      </Providers>,
    );
  });

  it("renders XaSizeGuideDialog", () => {
    render(<XaSizeGuideDialog copy="Sizing info" />);
  });

  it("renders XaSupportDock", () => {
    render(
      <Providers>
        <XaSupportDock />
      </Providers>,
    );
  });

  it("registers service worker in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const register = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });

    render(<XaServiceWorkerRegistration />);

    process.env.NODE_ENV = originalEnv;
  });
});
