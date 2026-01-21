/* eslint-env jest */

import type { ReadonlyURLSearchParams } from "next/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fireEvent,render, screen } from "@testing-library/react";

import { CampaignFilter } from "../src/app/cms/dashboard/[shop]/components/CampaignFilter.client";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("CampaignFilter", () => {
  it("updates router query string when options are selected and deselected", () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (usePathname as jest.Mock).mockReturnValue("/cms/dashboard/test");
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams() as unknown as ReadonlyURLSearchParams,
    );

    render(<CampaignFilter campaigns={["spring", "summer"]} />);
    const select = screen.getByRole<HTMLSelectElement>("listbox");
    const [spring, summer] = Array.from(select.options);

    spring.selected = true;
    fireEvent.change(select);
    expect(push).toHaveBeenCalledWith("/cms/dashboard/test?campaign=spring");

    push.mockClear();
    spring.selected = true;
    summer.selected = true;
    fireEvent.change(select);
    expect(push).toHaveBeenCalledWith(
      "/cms/dashboard/test?campaign=spring&campaign=summer",
    );

    push.mockClear();
    spring.selected = false;
    summer.selected = false;
    fireEvent.change(select);
    expect(push).toHaveBeenCalledWith("/cms/dashboard/test");
  });
});

