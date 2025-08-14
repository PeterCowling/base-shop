jest.mock("../src/components/cms/blocks", () => ({
  blockRegistry: {
    Dummy: { component: () => <div data-testid="inner">content</div> },
  },
}));

import { render } from "@testing-library/react";
import Block from "../src/components/cms/page-builder/Block";
import type { PageComponent } from "@acme/types";

test("applies navigation and animation", () => {
  const component: PageComponent = {
    id: "1",
    type: "Dummy",
    clickAction: "navigate",
    href: "/test",
    animation: "fade",
  } as any;
  const { container, getByTestId } = render(
    <Block component={component} locale={"en" as any} />
  );
  expect(getByTestId("inner")).toBeTruthy();
  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.className).toContain("pb-animate-fade");
  expect(wrapper.querySelector("a")?.getAttribute("href")).toBe("/test");
});
