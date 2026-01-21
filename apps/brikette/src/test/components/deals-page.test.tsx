import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@tests/renderers";

import DealsPage from "@/components/deals/DealsPage";

const openModal = jest.fn();

jest.mock("@/context/ModalContext", () => ({
  useModal: () => ({ openModal }),
}));

jest.mock("@acme/ui/context/ModalContext", () => ({
  useModal: () => ({ openModal }),
}));

jest.mock("@acme/ui/atoms/Link", () => ({
  AppLink: ({ children, ...props }: { children?: ReactNode }) => <a {...props}>{children}</a>,
  default: ({ children, ...props }: { children?: ReactNode }) => <a {...props}>{children}</a>,
  Link: ({ children, ...props }: { children?: ReactNode }) => <a {...props}>{children}</a>,
}));

jest.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useLoaderData: () => ({ lang: "en", title: "t", desc: "d" }),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => (({ buttonReserve: "Reserve Now" } as Record<string, string>)[key] ?? key),
  }),
}));

beforeEach(() => {
  openModal.mockClear();
  Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
});

describe("<DealsPage />", () => {
  it("opens booking modal from reserve button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DealsPage />, { route: "/en/deals" });

    await user.click(screen.getByRole("button", { name: /reserve now/i }));
    expect(openModal).toHaveBeenCalledWith("booking");
  });
});