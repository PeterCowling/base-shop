import { renderToString } from "react-dom/server";
import RootLayout from "../src/app/layout";
import { initTheme } from "@platform-core/utils";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("@platform-core/contexts/CartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="cart-provider">{children}</div>
  ),
}));

test("RootLayout applies fonts, theme script, and cart provider", () => {
  const markup = renderToString(
    <RootLayout>
      <div data-cy="child" />
    </RootLayout>
  );

  const doc = new DOMParser().parseFromString(markup, "text/html");

  const html = doc.querySelector("html")!;
  expect(html.className).toContain("--font-geist-sans");
  expect(html.className).toContain("--font-geist-mono");

  const script = doc.querySelector("script")!;
  expect(script.textContent).toBe(initTheme);

  const provider = doc.querySelector('[data-cy="cart-provider"]')!;
  const child = doc.querySelector('[data-cy="child"]')!;
  expect(provider.contains(child)).toBe(true);
});
