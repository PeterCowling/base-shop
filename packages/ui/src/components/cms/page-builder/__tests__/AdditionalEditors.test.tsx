import { fireEvent, render, screen } from "@testing-library/react";
import ButtonEditor from "../ButtonEditor";
import CustomHtmlEditor from "../CustomHtmlEditor";
import LookbookEditor from "../LookbookEditor";
import MapBlockEditor from "../MapBlockEditor";
import TabsEditor from "../TabsEditor";
import CountdownTimerEditor from "../CountdownTimerEditor";
import FAQBlockEditor from "../FAQBlockEditor";
import FooterEditor from "../FooterEditor";
import HeaderEditor from "../HeaderEditor";
import ImageSliderEditor from "../ImageSliderEditor";
import PopupModalEditor from "../PopupModalEditor";
import PricingTableEditor from "../PricingTableEditor";
import ProductComparisonEditor from "../ProductComparisonEditor";
import ProductFilterEditor from "../ProductFilterEditor";
import ProductGridEditor from "../ProductGridEditor";
import RecommendationCarouselEditor from "../RecommendationCarouselEditor";
import SearchBarEditor from "../SearchBarEditor";
import SocialLinksEditor from "../SocialLinksEditor";
import VideoBlockEditor from "../VideoBlockEditor";
import GiftCardEditor from "../GiftCardEditor";
import CollectionListEditor from "../CollectionListEditor";

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("../useMediaLibrary", () => ({
  __esModule: true,
  default: () => ({ media: [], loadMedia: jest.fn() }),
}));

describe("additional editors", () => {
  const cases = [
    {
      name: "ButtonEditor",
      Comp: ButtonEditor,
      component: { type: "Button", label: "", href: "" },
      getNode: () => screen.getByLabelText("Label"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "Click" } }),
      expected: { label: "Click" },
    },
    {
      name: "CustomHtmlEditor",
      Comp: CustomHtmlEditor,
      component: { type: "CustomHtml", html: "" },
      getNode: () => screen.getByLabelText("HTML"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "<p>hi</p>" } }),
      expected: { html: "<p>hi</p>" },
    },
    {
      name: "LookbookEditor",
      Comp: LookbookEditor,
      component: { type: "Lookbook", src: "", alt: "", hotspots: [] },
      getNode: () => screen.getByPlaceholderText("Alt text"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "alt" } }),
      expected: { alt: "alt" },
    },
    {
      name: "MapBlockEditor",
      Comp: MapBlockEditor,
      component: { type: "MapBlock", lat: 0, lng: 0, zoom: 0 },
      getNode: () => screen.getByLabelText("Latitude"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "1" } }),
      expected: { lat: 1 },
    },
    {
      name: "TabsEditor",
      Comp: TabsEditor,
      component: { type: "Tabs", labels: ["a"], active: 0 },
      getNode: () => screen.getByLabelText("Tab 1 Label"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "b" } }),
      expected: { labels: ["b"] },
    },
    {
      name: "CountdownTimerEditor",
      Comp: CountdownTimerEditor,
      component: { type: "CountdownTimer", targetDate: "", timezone: "", completionText: "", styles: "" },
      getNode: () => screen.getByLabelText("Target Date"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "2025-01-01T00:00" } }),
      expected: { targetDate: "2025-01-01T00:00" },
    },
    {
      name: "CountdownTimerEditor timezone",
      Comp: CountdownTimerEditor,
      component: { type: "CountdownTimer", targetDate: "", timezone: "", completionText: "", styles: "" },
      getNode: () => screen.getByLabelText("Timezone"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "UTC" } }),
      expected: { timezone: "UTC" },
    },
    {
      name: "CountdownTimerEditor completionText",
      Comp: CountdownTimerEditor,
      component: { type: "CountdownTimer", targetDate: "", timezone: "", completionText: "", styles: "" },
      getNode: () => screen.getByLabelText("Completion Text"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "Done" } }),
      expected: { completionText: "Done" },
    },
    {
      name: "CountdownTimerEditor styles",
      Comp: CountdownTimerEditor,
      component: { type: "CountdownTimer", targetDate: "", timezone: "", completionText: "", styles: "" },
      getNode: () => screen.getByLabelText("Styles"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "text-lg" } }),
      expected: { styles: "text-lg" },
    },
    {
      name: "FAQBlockEditor",
      Comp: FAQBlockEditor,
      component: { type: "FAQBlock", items: [{ question: "", answer: "" }] },
      getNode: () => screen.getByPlaceholderText("question"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "Why?" } }),
      expected: { items: [{ question: "Why?", answer: "" }] },
    },
    {
      name: "FooterEditor",
      Comp: FooterEditor,
      component: { type: "Footer", logoVariants: {}, shopName: "", links: [] },
      getNode: () => screen.getByPlaceholderText("shop name"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "My Shop" } }),
      expected: { shopName: "My Shop" },
    },
    {
      name: "HeaderEditor",
      Comp: HeaderEditor,
      component: { type: "Header", logoVariants: {}, shopName: "", nav: [] },
      getNode: () => screen.getByPlaceholderText("shop name"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "My Shop" } }),
      expected: { shopName: "My Shop" },
    },
    {
      name: "ImageSliderEditor",
      Comp: ImageSliderEditor,
      component: { type: "ImageSlider", slides: [{ src: "", alt: "", caption: "" }] },
      getNode: () => screen.getByPlaceholderText("alt"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "alt" } }),
      expected: { slides: [{ src: "", alt: "alt", caption: "" }] },
    },
    {
      name: "PopupModalEditor",
      Comp: PopupModalEditor,
      component: { type: "PopupModal", width: "", height: "", trigger: "", delay: undefined, content: "" },
      getNode: () => screen.getByPlaceholderText("width"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "100" } }),
      expected: { width: "100" },
    },
    {
      name: "PricingTableEditor",
      Comp: PricingTableEditor,
      component: { type: "PricingTable", plans: [{ title: "", price: "", features: [], ctaLabel: "", ctaHref: "", featured: false }], minItems: 0, maxItems: undefined },
      getNode: () => screen.getByPlaceholderText("title"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "Basic" } }),
      expected: { plans: [{ title: "Basic", price: "", features: [], ctaLabel: "", ctaHref: "", featured: false }] },
    },
    {
      name: "ProductComparisonEditor",
      Comp: ProductComparisonEditor,
      component: { type: "ProductComparison", skus: [], attributes: [] },
      getNode: () => screen.getByLabelText("SKUs (comma or newline separated)"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "sku1" } }),
      expected: { skus: ["sku1"] },
    },
    {
      name: "ProductFilterEditor",
      Comp: ProductFilterEditor,
      component: { type: "ProductFilter", showSize: true, showColor: true, showPrice: true },
      getNode: () => screen.getAllByRole("checkbox")[0],
      fire: (node: HTMLElement) => fireEvent.click(node),
      expected: { showSize: false },
    },
    {
      name: "ProductGridEditor",
      Comp: ProductGridEditor,
      component: { type: "ProductGrid", mode: "collection", quickView: false, collectionId: "" },
      getNode: () => screen.getByLabelText("Collection ID"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "col" } }),
      expected: { collectionId: "col" },
    },
    {
      name: "RecommendationCarouselEditor",
      Comp: RecommendationCarouselEditor,
      component: { type: "RecommendationCarousel", endpoint: "", desktopItems: 0, tabletItems: 0, mobileItems: 0 },
      getNode: () => screen.getByLabelText("Endpoint"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "api" } }),
      expected: { endpoint: "api" },
    },
    {
      name: "SearchBarEditor",
      Comp: SearchBarEditor,
      component: { type: "SearchBar", placeholder: "", limit: undefined },
      getNode: () => screen.getByPlaceholderText("placeholder"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "find" } }),
      expected: { placeholder: "find" },
    },
    {
      name: "SocialLinksEditor",
      Comp: SocialLinksEditor,
      component: { type: "SocialLinks", facebook: "", instagram: "", x: "", youtube: "", linkedin: "" },
      getNode: () => screen.getByLabelText("Facebook URL"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "fb" } }),
      expected: { facebook: "fb" },
    },
    {
      name: "VideoBlockEditor",
      Comp: VideoBlockEditor,
      component: { type: "VideoBlock", src: "", autoplay: false },
      getNode: () => screen.getByLabelText("Autoplay"),
      fire: (node: HTMLElement) => fireEvent.click(node),
      expected: { autoplay: true },
    },
    {
      name: "GiftCardEditor",
      Comp: GiftCardEditor,
      component: { type: "GiftCardBlock", denominations: [], description: "" },
      getNode: () => screen.getByPlaceholderText("Amounts (comma separated)"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "10,20" } }),
      expected: { denominations: [10, 20] },
    },
    {
      name: "CollectionListEditor",
      Comp: CollectionListEditor,
      component: { type: "CollectionList", collections: [], desktopItems: 0, tabletItems: 0, mobileItems: 0 },
      getNode: () => screen.getByLabelText("Desktop Items"),
      fire: (node: HTMLElement) => fireEvent.change(node, { target: { value: "2" } }),
      expected: { desktopItems: 2 },
    },
  ];

  it.each(cases)("%s propagates updates", ({ Comp, component, getNode, fire, expected }) => {
    const onChange = jest.fn();
    render(<Comp component={component} onChange={onChange} />);
    const node = getNode();
    fire(node);
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});

